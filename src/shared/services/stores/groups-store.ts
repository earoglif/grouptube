import { storage as extensionStorage } from "webextension-polyfill";
import {
  assignChannelToGroup,
  createGroup,
  deleteGroup,
  loadGroups,
  reorderGroups,
  saveGroups,
  updateGroup,
} from "../../storage/groups";
import { sanitizeText } from "../../groups";
import type { ChannelId, Group, GroupId } from "../../types";
import { getLastUserId, requestUserId, subscribeToUserId } from "./user-store";
import { STORAGE_KEYS } from "../../constants";

type CreateGroupInput = {
  name: string;
  color: string;
};

type UpdateGroupInput = {
  name?: string;
  color?: string;
};

type GroupsSnapshot = {
  userId: string | null;
  groups: Group[];
  isLoading: boolean;
};

type GroupsListener = () => void;

let snapshot: GroupsSnapshot = {
  userId: null,
  groups: [],
  isLoading: true,
};

let latestLoadId = 0;
const listeners = new Set<GroupsListener>();
let initialized = false;

function buildGroupsStorageKey(userId: string | null): string {
  return userId ? `${STORAGE_KEYS.groupsPrefix}${userId}` : `${STORAGE_KEYS.groupsPrefix}anonymous`;
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

async function loadForUser(nextUserId: string | null): Promise<void> {
  const loadId = ++latestLoadId;
  snapshot = { ...snapshot, userId: nextUserId, isLoading: true };
  emit();

  const nextGroups = await loadGroups(nextUserId);
  if (loadId !== latestLoadId) return;

  snapshot = { userId: nextUserId, groups: nextGroups, isLoading: false };
  emit();
}

function ensureInitialized(): void {
  if (initialized) return;
  initialized = true;

  subscribeToUserId((nextUserId) => {
    void loadForUser(nextUserId);
  }, false);

  const cachedUserId = getLastUserId();
  void loadForUser(cachedUserId);
  requestUserId();

  extensionStorage.onChanged.addListener((changes, areaName) => {
    const targetStorageKey = buildGroupsStorageKey(snapshot.userId);
    if (areaName !== "local" || !changes[targetStorageKey]) return;
    void loadForUser(snapshot.userId);
  });
}

export function subscribeToGroups(listener: GroupsListener): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGroupsSnapshot(): GroupsSnapshot {
  ensureInitialized();
  return snapshot;
}

function setGroups(groups: Group[]): void {
  snapshot = { ...snapshot, groups, isLoading: false };
  emit();
}

export async function createGroupAction(input: CreateGroupInput) {
  const nextGroups = await createGroup(snapshot.userId, input);
  setGroups(nextGroups);
  return nextGroups;
}

export async function updateGroupAction(groupId: GroupId, patch: UpdateGroupInput) {
  const nextGroups = await updateGroup(snapshot.userId, groupId, patch);
  setGroups(nextGroups);
  return nextGroups;
}

export async function deleteGroupAction(groupId: GroupId) {
  const nextGroups = await deleteGroup(snapshot.userId, groupId);
  setGroups(nextGroups);
  return nextGroups;
}

export async function reorderGroupsAction(groupIds: GroupId[]) {
  const nextGroups = await reorderGroups(snapshot.userId, groupIds);
  setGroups(nextGroups);
  return nextGroups;
}

export async function assignChannelToGroupAction(channelId: ChannelId, groupId: GroupId | null) {
  const nextGroups = await assignChannelToGroup(snapshot.userId, channelId, groupId);
  setGroups(nextGroups);
  return nextGroups;
}

export async function assignChannelsToGroupAction(channelIds: ChannelId[], groupId: GroupId | null) {
  const groups = await loadGroups(snapshot.userId);
  const normalized = channelIds.map((id) => sanitizeText(id)).filter((id) => id.length > 0);
  const idSet = new Set(normalized);

  const nextGroups = groups.map((group) => ({
    ...group,
    channelIds: group.channelIds.filter((id) => !idSet.has(id)),
  }));

  if (groupId) {
    const target = nextGroups.find((group) => group.id === groupId);
    if (target) {
      target.channelIds = [...target.channelIds, ...normalized.filter((id) => !target.channelIds.includes(id))];
    }
  }

  await saveGroups(snapshot.userId, nextGroups);
  setGroups(nextGroups);
  return nextGroups;
}
