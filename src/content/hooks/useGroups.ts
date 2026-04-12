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

type CreateGroupInput = {
  name: string;
  color: string;
};

type UpdateGroupInput = {
  name?: string;
  color?: string;
};

export function useGroups() {
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const latestLoadIdRef = useRef(0);

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
      const nextGroups = await reorderGroups(userId, groupIds);
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
