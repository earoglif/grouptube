import type { Subscription } from "../types";
import { runtime } from "webextension-polyfill";

type SubscriptionsListener = (subscriptions: Subscription[]) => void;
type GetSubscriptionsMessage = {
  action: "get-subscriptions";
};
type GetSubscriptionsResponse =
  | {
      ok: true;
      subscriptions: Subscription[];
    }
  | {
      ok: false;
      error: string;
    };

let lastSubscriptions: Subscription[] = [];
const listeners = new Set<SubscriptionsListener>();

function emit(subs: Subscription[]): void {
  lastSubscriptions = subs;
  for (const fn of listeners) fn(subs);
}

function normalizeSubscriptions(value: unknown): Subscription[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: Subscription[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const channelId = (item as { channelId?: unknown }).channelId;
    const name = (item as { name?: unknown }).name;
    const thumbnailUrl = (item as { thumbnailUrl?: unknown }).thumbnailUrl;
    const description = (item as { description?: unknown }).description;

    if (typeof channelId !== "string" || channelId.length === 0) {
      continue;
    }

    if (typeof name !== "string" || name.length === 0) {
      continue;
    }

    normalized.push({
      channelId,
      name,
      thumbnailUrl: typeof thumbnailUrl === "string" && thumbnailUrl.length > 0 ? thumbnailUrl : undefined,
      description: typeof description === "string" && description.length > 0 ? description : undefined,
    });
  }

  return normalized;
}

async function loadSubscriptions(): Promise<void> {
  const message: GetSubscriptionsMessage = { action: "get-subscriptions" };
  const response = (await runtime.sendMessage(message)) as GetSubscriptionsResponse | undefined;

  if (!response || typeof response !== "object") {
    throw new Error("Invalid subscriptions response");
  }

  if (!response.ok) {
    throw new Error(response.error || "Failed to load subscriptions");
  }

  emit(normalizeSubscriptions(response.subscriptions));
}

export function subscribeToSubscriptions(
  listener: SubscriptionsListener,
  emitCached = true,
): () => void {
  listeners.add(listener);

  if (emitCached && lastSubscriptions.length > 0) {
    listener(lastSubscriptions);
  }

  return () => {
    listeners.delete(listener);
  };
}

export function requestSubscriptions(): void {
  void loadSubscriptions().catch((error: unknown) => {
    console.error("Failed to request subscriptions", error);
    emit(lastSubscriptions);
  });
}

export function getLastSubscriptions(): Subscription[] {
  return lastSubscriptions;
}
