import { storage } from "webextension-polyfill";
import { STORAGE_KEYS } from "../constants";
import { createGroupId } from "../ids";
import { normalizeGroups, sanitizeColor, sanitizeText } from "../groups";
import type { ChannelId, GroupId, IGroup } from "../types";

const ANONYMOUS_STORAGE_KEY = `${STORAGE_KEYS.groupsPrefix}anonymous`;

type GroupCreateInput = {
  name: string;
  color: string;
};

type GroupUpdateInput = {
  name?: string;
  color?: string;
};

function buildStorageKey(userId: string | null): string {
  return userId ? `${STORAGE_KEYS.groupsPrefix}${userId}` : ANONYMOUS_STORAGE_KEY;
}

export async function loadGroups(userId: string | null): Promise<IGroup[]> {
  const key = buildStorageKey(userId);
  const data = await storage.local.get(key);
  return normalizeGroups(data[key]);
}

export async function saveGroups(userId: string | null, groups: IGroup[]): Promise<void> {
  const key = buildStorageKey(userId);
  await storage.local.set({ [key]: normalizeGroups(groups) });
}

export async function createGroup(userId: string | null, input: GroupCreateInput): Promise<IGroup[]> {
  const groups = await loadGroups(userId);
  const name = sanitizeText(input.name);
  if (!name) return groups;

  const nextGroups: IGroup[] = [
    ...groups,
    {
      id: createGroupId(),
      name,
      color: sanitizeColor(input.color),
      channelIds: [],
    },
  ];

  await saveGroups(userId, nextGroups);
  return nextGroups;
}

export async function updateGroup(userId: string | null, groupId: GroupId, patch: GroupUpdateInput): Promise<IGroup[]> {
  const groups = await loadGroups(userId);
  const name = patch.name !== undefined ? sanitizeText(patch.name) : undefined;
  const color = patch.color !== undefined ? sanitizeColor(patch.color) : undefined;

  const nextGroups = groups.map((group) => {
    if (group.id !== groupId) return group;
    return {
      ...group,
      ...(name !== undefined && name.length > 0 ? { name } : {}),
      ...(color !== undefined ? { color } : {}),
    };
  });

  await saveGroups(userId, nextGroups);
  return nextGroups;
}

export async function deleteGroup(userId: string | null, groupId: GroupId): Promise<IGroup[]> {
  const groups = await loadGroups(userId);
  const nextGroups = groups.filter((group) => group.id !== groupId);
  await saveGroups(userId, nextGroups);
  return nextGroups;
}

export async function reorderGroups(userId: string | null, orderedGroupIds: GroupId[]): Promise<IGroup[]> {
  const groups = await loadGroups(userId);
  const orderMap = new Map(groups.map((group) => [group.id, group]));

  const sortedGroups = orderedGroupIds
    .map((groupId) => orderMap.get(groupId))
    .filter((group): group is IGroup => Boolean(group));

  const remainingGroups = groups.filter((group) => !orderedGroupIds.includes(group.id));
  const nextGroups = [...sortedGroups, ...remainingGroups];

  await saveGroups(userId, nextGroups);
  return nextGroups;
}

export async function createGroupAndAssignChannel(
  userId: string | null,
  channelId: ChannelId,
  input: GroupCreateInput
): Promise<IGroup[]> {
  const groups = await loadGroups(userId);
  const name = sanitizeText(input.name);
  if (!name) return groups;

  const normalizedChannelId = sanitizeText(channelId);

  const cleanedGroups: IGroup[] = normalizedChannelId
    ? groups.map((group) => ({
        ...group,
        channelIds: group.channelIds.filter((id) => id !== normalizedChannelId),
      }))
    : groups;

  const newGroup: IGroup = {
    id: createGroupId(),
    name,
    color: sanitizeColor(input.color),
    channelIds: normalizedChannelId ? [normalizedChannelId] : [],
  };

  const nextGroups = [...cleanedGroups, newGroup];
  await saveGroups(userId, nextGroups);
  return nextGroups;
}

export async function assignChannelToGroup(
  userId: string | null,
  channelId: ChannelId,
  targetGroupId: GroupId | null
): Promise<IGroup[]> {
  const groups = await loadGroups(userId);
  const normalizedChannelId = sanitizeText(channelId);

  if (!normalizedChannelId) return groups;

  const nextGroups = groups.map((group) => ({
    ...group,
    channelIds: group.channelIds.filter((id) => id !== normalizedChannelId),
  }));

  if (targetGroupId) {
    const targetGroup = nextGroups.find((group) => group.id === targetGroupId);
    if (targetGroup) {
      targetGroup.channelIds = [...targetGroup.channelIds, normalizedChannelId];
    }
  }

  await saveGroups(userId, nextGroups);
  return nextGroups;
}
