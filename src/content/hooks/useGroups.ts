import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  assignChannelToGroup,
  createGroup,
  deleteGroup,
  loadGroups,
  reorderGroups,
  updateGroup,
} from "../services/storage";
import { getLastUserId, requestUserId, subscribeToUserId } from "../services/user";
import type { ChannelId, Group, GroupId } from "../types";
import { storage as extensionStorage } from "webextension-polyfill";

type CreateGroupInput = {
  name: string;
  color: string;
};

type UpdateGroupInput = {
  name?: string;
  color?: string;
};

function reorderByIds(currentGroups: Group[], orderedGroupIds: GroupId[]): Group[] {
  const groupsById = new Map(currentGroups.map((group) => [group.id, group]));
  const orderedGroups = orderedGroupIds
    .map((groupId) => groupsById.get(groupId))
    .filter((group): group is Group => group !== undefined);
  const orderedIdSet = new Set(orderedGroupIds);
  const remainingGroups = currentGroups.filter((group) => !orderedIdSet.has(group.id));

  return [...orderedGroups, ...remainingGroups];
}

const GROUPS_STORAGE_PREFIX = "grouptube_groups_";

function buildGroupsStorageKey(userId: string | null): string {
  return userId ? `${GROUPS_STORAGE_PREFIX}${userId}` : `${GROUPS_STORAGE_PREFIX}anonymous`;
}

export function useGroups() {
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const latestLoadIdRef = useRef(0);
  const latestReorderIdRef = useRef(0);

  const loadForUser = useCallback(async (nextUserId: string | null) => {
    const loadId = ++latestLoadIdRef.current;
    setIsLoading(true);
    const nextGroups = await loadGroups(nextUserId);
    if (loadId !== latestLoadIdRef.current) return;
    setGroups(nextGroups);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToUserId((nextUserId) => {
      setUserId(nextUserId);
      void loadForUser(nextUserId);
    }, false);

    const cachedUserId = getLastUserId();
    setUserId(cachedUserId);
    void loadForUser(cachedUserId);
    requestUserId();

    return () => {
      unsubscribe();
    };
  }, [loadForUser]);

  useEffect(() => {
    const targetStorageKey = buildGroupsStorageKey(userId);
    const onStorageChanged: Parameters<typeof extensionStorage.onChanged.addListener>[0] = (changes, areaName) => {
      if (areaName !== "local" || !changes[targetStorageKey]) return;
      void loadForUser(userId);
    };

    extensionStorage.onChanged.addListener(onStorageChanged);
    return () => {
      extensionStorage.onChanged.removeListener(onStorageChanged);
    };
  }, [loadForUser, userId]);

  const channelToGroupMap = useMemo(() => {
    const map = new Map<ChannelId, GroupId>();
    for (const group of groups) {
      for (const channelId of group.channelIds) {
        map.set(channelId, group.id);
      }
    }
    return map;
  }, [groups]);

  const createGroupAction = useCallback(
    async (input: CreateGroupInput) => {
      const nextGroups = await createGroup(userId, input);
      setGroups(nextGroups);
      return nextGroups;
    },
    [userId]
  );

  const updateGroupAction = useCallback(
    async (groupId: GroupId, patch: UpdateGroupInput) => {
      const nextGroups = await updateGroup(userId, groupId, patch);
      setGroups(nextGroups);
      return nextGroups;
    },
    [userId]
  );

  const deleteGroupAction = useCallback(
    async (groupId: GroupId) => {
      const nextGroups = await deleteGroup(userId, groupId);
      setGroups(nextGroups);
      return nextGroups;
    },
    [userId]
  );

  const reorderGroupsAction = useCallback(
    async (groupIds: GroupId[]) => {
      const reorderId = ++latestReorderIdRef.current;
      setGroups((currentGroups) => reorderByIds(currentGroups, groupIds));

      const nextGroups = await reorderGroups(userId, groupIds);
      if (reorderId !== latestReorderIdRef.current) return nextGroups;

      setGroups(nextGroups);
      return nextGroups;
    },
    [userId]
  );

  const assignChannelAction = useCallback(
    async (channelId: ChannelId, groupId: GroupId | null) => {
      const nextGroups = await assignChannelToGroup(userId, channelId, groupId);
      setGroups(nextGroups);
      return nextGroups;
    },
    [userId]
  );

  return {
    userId,
    groups,
    isLoading,
    channelToGroupMap,
    createGroup: createGroupAction,
    updateGroup: updateGroupAction,
    deleteGroup: deleteGroupAction,
    reorderGroups: reorderGroupsAction,
    assignChannelToGroup: assignChannelAction,
  };
}
