import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

const COLLAPSED_GROUPS_STORAGE_PREFIX = "grouptube_collapsed_groups_";

function collapsedGroupsStorageKey(userId: string | null): string {
  return userId
    ? `${COLLAPSED_GROUPS_STORAGE_PREFIX}${userId}`
    : `${COLLAPSED_GROUPS_STORAGE_PREFIX}anonymous`;
}

function loadCollapsedGroupIdsFromStorage(userId: string | null): Set<string> {
  if (typeof localStorage === "undefined") {
    return new Set();
  }

  try {
    const raw = localStorage.getItem(collapsedGroupsStorageKey(userId));
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

function saveCollapsedGroupIdsToStorage(userId: string | null, collapsedIds: Set<string>): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(collapsedGroupsStorageKey(userId), JSON.stringify([...collapsedIds]));
  } catch {
    // ignore quota / private mode
  }
}

export function useCollapsedGroupsPersistence(userId: string | null): [
  Set<string>,
  Dispatch<SetStateAction<Set<string>>>,
] {
  const [collapsedGroupIds, setCollapsedGroupIds] = useState(() => loadCollapsedGroupIdsFromStorage(userId));

  useEffect(() => {
    setCollapsedGroupIds(loadCollapsedGroupIdsFromStorage(userId));
  }, [userId]);

  useEffect(() => {
    saveCollapsedGroupIdsToStorage(userId, collapsedGroupIds);
  }, [userId, collapsedGroupIds]);

  return [collapsedGroupIds, setCollapsedGroupIds];
}
