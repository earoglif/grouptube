import { storage } from "webextension-polyfill";

export type SubscriptionSortMode = "relevance" | "nameAsc" | "nameDesc";

const STORAGE_PREFIX = "grouptube_subscription_sort_";
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
  storagePrefix = STORAGE_PREFIX
): Promise<SubscriptionSortMode> {
  const key = buildStorageKey(userId, storagePrefix);
  const data = await storage.local.get(key);
  return normalizeSubscriptionSortMode(data[key]);
}

export async function saveSubscriptionSort(
  userId: string | null,
  sortMode: SubscriptionSortMode,
  storagePrefix = STORAGE_PREFIX
): Promise<void> {
  const key = buildStorageKey(userId, storagePrefix);
  await storage.local.set({ [key]: normalizeSubscriptionSortMode(sortMode) });
}

