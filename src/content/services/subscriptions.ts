import type { Subscription } from "../types";
import { runtime } from "webextension-polyfill";

type SubscriptionsListener = (subscriptions: Subscription[]) => void;
type GetSubscriptionsMessage = {
  action: "get-subscriptions";
};

type GetChannelDetailsMessage = {
  action: "get-channel-details";
  channelId: string;
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

type GetChannelDetailsResponse =
  | {
      ok: true;
      subscription: Subscription | null;
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

export function upsertSubscription(subscription: Subscription): void {
  const channelId = typeof subscription.channelId === "string" ? subscription.channelId.trim() : "";
  if (!channelId) return;

  const name = typeof subscription.name === "string" ? subscription.name.trim() : "";
  if (!name) return;

  const nextItem: Subscription = {
    channelId,
    name,
    thumbnailUrl:
      typeof subscription.thumbnailUrl === "string" && subscription.thumbnailUrl.length > 0
        ? subscription.thumbnailUrl
        : undefined,
    description:
      typeof subscription.description === "string" && subscription.description.length > 0
        ? subscription.description
        : undefined,
  };

  const existingIndex = lastSubscriptions.findIndex((item) => item.channelId === channelId);
  if (existingIndex < 0) {
    emit([...lastSubscriptions, nextItem]);
    return;
  }

  const existing = lastSubscriptions[existingIndex];
  const merged: Subscription = {
    ...existing,
    ...nextItem,
    name: nextItem.name || existing.name,
    thumbnailUrl: nextItem.thumbnailUrl ?? existing.thumbnailUrl,
    description: nextItem.description ?? existing.description,
  };

  const nextList = [...lastSubscriptions];
  nextList[existingIndex] = merged;
  emit(nextList);
}

export function removeSubscriptions(channelIds: string[]): void {
  const ids = Array.isArray(channelIds)
    ? channelIds
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    : [];
  if (ids.length === 0) return;

  const idSet = new Set(ids);
  const nextList = lastSubscriptions.filter((item) => !idSet.has(item.channelId));
  if (nextList.length === lastSubscriptions.length) return;
  emit(nextList);
}

export async function requestChannelDetails(channelId: string): Promise<Subscription | null> {
  const normalizedChannelId = typeof channelId === "string" ? channelId.trim() : "";
  if (!normalizedChannelId) return null;

  const message: GetChannelDetailsMessage = {
    action: "get-channel-details",
    channelId: normalizedChannelId,
  };
  const response = (await runtime.sendMessage(message)) as GetChannelDetailsResponse | undefined;
  if (!response || typeof response !== "object") {
    throw new Error("Invalid channel details response");
  }
  if (!response.ok) {
    throw new Error(response.error || "Failed to load channel details");
  }
  return response.subscription ?? null;
}
