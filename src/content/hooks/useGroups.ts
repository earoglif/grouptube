import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { ChannelId, GroupId } from "../../shared/types";
import {
  assignChannelToGroupAction as assignChannelToGroupInStore,
  assignChannelsToGroupAction as assignChannelsToGroupInStore,
  createGroupAction as createGroupInStore,
  deleteGroupAction as deleteGroupInStore,
  getGroupsSnapshot,
  reorderGroupsAction as reorderGroupsInStore,
  subscribeToGroups,
  updateGroupAction as updateGroupInStore,
} from "../../shared/services/stores/groups-store";

type CreateGroupInput = {
  name: string;
  color: string;
};

type UpdateGroupInput = {
  name?: string;
  color?: string;
};

export function useGroups() {
  const snapshot = useSyncExternalStore(
    subscribeToGroups,
    getGroupsSnapshot,
    getGroupsSnapshot
  );
  const { userId, groups, isLoading } = snapshot;

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
      return createGroupInStore(input);
    },
    []
  );

  const updateGroupAction = useCallback(
    async (groupId: GroupId, patch: UpdateGroupInput) => {
      return updateGroupInStore(groupId, patch);
    },
    []
  );

  const deleteGroupAction = useCallback(
    async (groupId: GroupId) => {
      return deleteGroupInStore(groupId);
    },
    []
  );

  const reorderGroupsAction = useCallback(
    async (groupIds: GroupId[]) => {
      return reorderGroupsInStore(groupIds);
    },
    []
  );

  const assignChannelAction = useCallback(
    async (channelId: ChannelId, groupId: GroupId | null) => {
      return assignChannelToGroupInStore(channelId, groupId);
    },
    []
  );

  const assignChannelsAction = useCallback(
    async (channelIds: ChannelId[], groupId: GroupId | null) => {
      return assignChannelsToGroupInStore(channelIds, groupId);
    },
    []
  );

  const createGroupAndAssignChannelAction = useCallback(
    async (channelId: ChannelId, input: CreateGroupInput) => {
      const createdGroups = await createGroupAction(input);
      const createdGroup = createdGroups[createdGroups.length - 1];
      if (!createdGroup) return createdGroups;
      return assignChannelToGroupInStore(channelId, createdGroup.id);
    },
    [createGroupAction]
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
    assignChannelsToGroup: assignChannelsAction,
    createGroupAndAssignChannel: createGroupAndAssignChannelAction,
  };
}
