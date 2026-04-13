import { storage } from "webextension-polyfill";

export type SubscriptionSortMode = "relevance" | "nameAsc" | "nameDesc";

const STORAGE_PREFIX = "grouptube_subscription_sort_";
const ANONYMOUS_STORAGE_KEY = `${STORAGE_PREFIX}anonymous`;
const DEFAULT_SUBSCRIPTION_SORT_MODE: SubscriptionSortMode = "relevance";

function buildStorageKey(userId: string | null): string {
  return userId ? `${STORAGE_PREFIX}${userId}` : ANONYMOUS_STORAGE_KEY;
}

function normalizeSubscriptionSortMode(value: unknown): SubscriptionSortMode {
  if (value === "nameAsc" || value === "nameDesc" || value === "relevance") {
    return value;
  }

  return DEFAULT_SUBSCRIPTION_SORT_MODE;
}

export async function loadSubscriptionSort(userId: string | null): Promise<SubscriptionSortMode> {
  const key = buildStorageKey(userId);
  const data = await storage.local.get(key);
  return normalizeSubscriptionSortMode(data[key]);
}

export async function saveSubscriptionSort(userId: string | null, sortMode: SubscriptionSortMode): Promise<void> {
  const key = buildStorageKey(userId);
  await storage.local.set({ [key]: normalizeSubscriptionSortMode(sortMode) });
}

