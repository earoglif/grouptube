import { STORAGE_KEYS } from "../constants";

function collapsedGroupsStorageKey(userId: string | null, storagePrefix: string): string {
  return userId ? `${storagePrefix}${userId}` : `${storagePrefix}anonymous`;
}

export function loadCollapsedGroupIdsFromStorage(
  userId: string | null,
  storagePrefix: string = STORAGE_KEYS.collapsedGroupsPrefix
): Set<string> {
  if (typeof localStorage === "undefined") {
    return new Set();
  }

  try {
    const raw = localStorage.getItem(collapsedGroupsStorageKey(userId, storagePrefix));
    if (!raw) {
      return new Set();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function saveCollapsedGroupIdsToStorage(
  userId: string | null,
  collapsedIds: Set<string>,
  storagePrefix: string = STORAGE_KEYS.collapsedGroupsPrefix
): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(collapsedGroupsStorageKey(userId, storagePrefix), JSON.stringify([...collapsedIds]));
  } catch {
    // ignore quota / private mode
  }
}
