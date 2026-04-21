import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../shared/constants";
import {
  loadCollapsedGroupIdsFromStorage,
  saveCollapsedGroupIdsToStorage,
} from "../../shared/storage/collapsed-groups";

export function useCollapsedGroupsPersistence(
  userId: string | null,
  storagePrefix: string = STORAGE_KEYS.collapsedGroupsPrefix
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
