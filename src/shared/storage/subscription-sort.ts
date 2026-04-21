import { storage } from "webextension-polyfill";
import { STORAGE_KEYS } from "../constants";

export type SubscriptionSortMode = "relevance" | "nameAsc" | "nameDesc";

const DEFAULT_SUBSCRIPTION_SORT_MODE: SubscriptionSortMode = "relevance";

function buildStorageKey(userId: string | null, storagePrefix: string): string {
  return userId ? `${storagePrefix}${userId}` : `${storagePrefix}anonymous`;
}

function normalizeSubscriptionSortMode(value: unknown): SubscriptionSortMode {
  if (value === "nameAsc" || value === "nameDesc" || value === "relevance") {
    return value;
  }

  return DEFAULT_SUBSCRIPTION_SORT_MODE;
}

export async function loadSubscriptionSort(
  userId: string | null,
  storagePrefix: string = STORAGE_KEYS.subscriptionSortPrefix
): Promise<SubscriptionSortMode> {
  const key = buildStorageKey(userId, storagePrefix);
  const data = await storage.local.get(key);
  return normalizeSubscriptionSortMode(data[key]);
}

export async function saveSubscriptionSort(
  userId: string | null,
  sortMode: SubscriptionSortMode,
  storagePrefix: string = STORAGE_KEYS.subscriptionSortPrefix
): Promise<void> {
  const key = buildStorageKey(userId, storagePrefix);
  await storage.local.set({ [key]: normalizeSubscriptionSortMode(sortMode) });
}
