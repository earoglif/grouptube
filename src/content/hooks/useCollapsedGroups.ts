import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

const COLLAPSED_GROUPS_STORAGE_PREFIX = "grouptube_collapsed_groups_";

function collapsedGroupsStorageKey(userId: string | null, storagePrefix: string): string {
  return userId
    ? `${storagePrefix}${userId}`
    : `${storagePrefix}anonymous`;
}

function loadCollapsedGroupIdsFromStorage(userId: string | null, storagePrefix: string): Set<string> {
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

function saveCollapsedGroupIdsToStorage(userId: string | null, collapsedIds: Set<string>, storagePrefix: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(collapsedGroupsStorageKey(userId, storagePrefix), JSON.stringify([...collapsedIds]));
  } catch {
    // ignore quota / private mode
  }
}

export function useCollapsedGroupsPersistence(
  userId: string | null,
  storagePrefix = COLLAPSED_GROUPS_STORAGE_PREFIX
): [Set<string>, Dispatch<SetStateAction<Set<string>>>] {
  const [collapsedGroupIds, setCollapsedGroupIds] = useState(() =>
    loadCollapsedGroupIdsFromStorage(userId, storagePrefix)
  );

  useEffect(() => {
    setCollapsedGroupIds(loadCollapsedGroupIdsFromStorage(userId, storagePrefix));
  }, [userId, storagePrefix]);

  useEffect(() => {
    saveCollapsedGroupIdsToStorage(userId, collapsedGroupIds, storagePrefix);
  }, [userId, collapsedGroupIds, storagePrefix]);

  return [collapsedGroupIds, setCollapsedGroupIds];
}
