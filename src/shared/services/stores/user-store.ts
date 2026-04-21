import { storage } from "webextension-polyfill";
import { STORAGE_KEYS } from "../../constants";
import { PAGE_BRIDGE_EVENTS } from "../../page-bridge/events";
import { ensurePageBridgeInjected } from "../../../content/services/page-bridge";

type UserInfoDetail = {
  userId?: unknown;
};

type UserIdListener = (userId: string | null) => void;

let listening = false;
let lastUserId: string | null = null;
const listeners = new Set<UserIdListener>();

function normalizeUserId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function emit(userId: string | null): void {
  lastUserId = userId;
  void storage.local.set({ [STORAGE_KEYS.userId]: userId }).catch((error: unknown) => {
    console.error("Failed to persist user ID", error);
  });

  for (const listener of listeners) {
    listener(userId);
  }
}

function handleUserInfoEvent(event: Event): void {
  if (!(event instanceof CustomEvent)) return;

  const detail = event.detail as UserInfoDetail | undefined;
  emit(normalizeUserId(detail?.userId));
}

function ensureListener(): void {
  if (listening) return;
  ensurePageBridgeInjected();
  window.addEventListener(PAGE_BRIDGE_EVENTS.userInfo, handleUserInfoEvent as EventListener);
  listening = true;
}

export function subscribeToUserId(listener: UserIdListener, emitCached = true): () => void {
  ensureListener();
  listeners.add(listener);

  if (emitCached && lastUserId !== null) {
    listener(lastUserId);
  }

  return () => {
    listeners.delete(listener);
  };
}

export function requestUserId(): void {
  ensureListener();
  window.dispatchEvent(new CustomEvent(PAGE_BRIDGE_EVENTS.requestUserInfo));
}

export function getLastUserId(): string | null {
  return lastUserId;
}

export function getUserIdOnce(timeoutMs = 2500): Promise<string | null> {
  ensureListener();

  if (lastUserId !== null) return Promise.resolve(lastUserId);

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      unsubscribe();
      resolve(lastUserId);
    }, timeoutMs);

    const unsubscribe = subscribeToUserId((userId) => {
      window.clearTimeout(timeoutId);
      unsubscribe();
      resolve(userId);
    }, false);

    requestUserId();
  });
}
