import { storage } from "webextension-polyfill";
import type { ChannelId, Group, GroupId } from "../types";
import { normalizeGroups, sanitizeColor, sanitizeText } from "../../shared/groups";

const STORAGE_PREFIX = "grouptube_groups_";
const ANONYMOUS_STORAGE_KEY = `${STORAGE_PREFIX}anonymous`;

type GroupCreateInput = {
  name: string;
  color: string;
};

type GroupUpdateInput = {
  name?: string;
  color?: string;
};

function buildStorageKey(userId: string | null): string {
  return userId ? `${STORAGE_PREFIX}${userId}` : ANONYMOUS_STORAGE_KEY;
}

function createGroupId(): GroupId {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function loadGroups(userId: string | null): Promise<Group[]> {
  const key = buildStorageKey(userId);
  const data = await storage.local.get(key);
  return normalizeGroups(data[key]);
}

export async function saveGroups(userId: string | null, groups: Group[]): Promise<void> {
  const key = buildStorageKey(userId);
  await storage.local.set({ [key]: normalizeGroups(groups) });
}

export async function createGroup(userId: string | null, input: GroupCreateInput): Promise<Group[]> {
  const groups = await loadGroups(userId);
  const name = sanitizeText(input.name);
  if (!name) return groups;

  const nextGroups: Group[] = [
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

export async function updateGroup(userId: string | null, groupId: GroupId, patch: GroupUpdateInput): Promise<Group[]> {
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

export async function deleteGroup(userId: string | null, groupId: GroupId): Promise<Group[]> {
  const groups = await loadGroups(userId);
  const nextGroups = groups.filter((group) => group.id !== groupId);
  await saveGroups(userId, nextGroups);
  return nextGroups;
}

export async function reorderGroups(userId: string | null, orderedGroupIds: GroupId[]): Promise<Group[]> {
  const groups = await loadGroups(userId);
  const orderMap = new Map(groups.map((group) => [group.id, group]));

  const sortedGroups = orderedGroupIds
    .map((groupId) => orderMap.get(groupId))
    .filter((group): group is Group => Boolean(group));

  const remainingGroups = groups.filter((group) => !orderedGroupIds.includes(group.id));
  const nextGroups = [...sortedGroups, ...remainingGroups];

  await saveGroups(userId, nextGroups);
  return nextGroups;
}

export async function assignChannelToGroup(
  userId: string | null,
  channelId: ChannelId,
  targetGroupId: GroupId | null
): Promise<Group[]> {
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
