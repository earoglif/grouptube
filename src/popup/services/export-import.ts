import { runtime, storage } from "webextension-polyfill";
import { loadGroups, saveGroups } from "../../content/services/storage";
import type { Group, GroupId, Subscription } from "../../content/types";
import { getGroupNameKey, normalizeGroups, sanitizeText } from "../../shared/groups";

const USER_ID_STORAGE_KEY = "grouptube_userId";
const BACKUP_VERSION = 1;

type GetSubscriptionsMessage = {
  action: "get-subscriptions";
};

type GetSubscriptionsResponse =
  | {
      ok: true;
      subscriptions: Subscription[];
    }
  | {
      ok: false;
      error: string;
    };

type BackupPayload = {
  version: number;
  groups: unknown;
};

type ParsedImportPayload = {
  groups: Group[];
  skippedInvalidCount: number;
};

export type ImportGroupsResult = {
  importedCount: number;
  skippedCount: number;
  filteredChannelsCount: number;
};

export type ExportGroupsResult = {
  exportedCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toValidUserId(value: unknown): string | null {
  const userId = sanitizeText(value);
  return userId.length > 0 ? userId : null;
}

async function getStoredUserId(): Promise<string | null> {
  const data = await storage.local.get(USER_ID_STORAGE_KEY);
  return toValidUserId(data[USER_ID_STORAGE_KEY]);
}

async function resolveUserId(userId?: string | null): Promise<string | null> {
  if (userId !== undefined) {
    return toValidUserId(userId);
  }

  return getStoredUserId();
}

function getFileNameDatePart(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadJsonFile(payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `grouptube-backup-${getFileNameDatePart()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseImportPayload(content: string): ParsedImportPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Invalid backup JSON");
  }

  if (!isRecord(parsed)) {
    throw new Error("Invalid backup structure");
  }

  const payload = parsed as BackupPayload;
  if (payload.version !== BACKUP_VERSION || !Array.isArray(payload.groups)) {
    throw new Error("Unsupported backup version");
  }

  const groups = normalizeGroups(payload.groups);

  return {
    groups,
    skippedInvalidCount: payload.groups.length - groups.length,
  };
}

function normalizeSubscriptions(value: unknown): Subscription[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const subscriptions: Subscription[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const channelId = sanitizeText((item as { channelId?: unknown }).channelId);
    const name = sanitizeText((item as { name?: unknown }).name);
    const thumbnailUrl = sanitizeText((item as { thumbnailUrl?: unknown }).thumbnailUrl);

    if (!channelId || !name) {
      continue;
    }

    subscriptions.push({
      channelId,
      name,
      thumbnailUrl: thumbnailUrl.length > 0 ? thumbnailUrl : undefined,
    });
  }

  return subscriptions;
}

async function fetchCurrentSubscriptions(): Promise<Subscription[]> {
  const message: GetSubscriptionsMessage = { action: "get-subscriptions" };
  const response = (await runtime.sendMessage(message)) as GetSubscriptionsResponse | undefined;

  if (!response || typeof response !== "object") {
    throw new Error("Invalid subscriptions response");
  }

  if (!response.ok) {
    throw new Error(response.error || "Failed to load subscriptions");
  }

  return normalizeSubscriptions(response.subscriptions);
}

function createUniqueGroupId(existingIds: Set<GroupId>): GroupId {
  let nextId: GroupId;

  do {
    nextId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  } while (existingIds.has(nextId));

  existingIds.add(nextId);
  return nextId;
}

export async function exportGroups(userId?: string | null): Promise<ExportGroupsResult> {
  const resolvedUserId = await resolveUserId(userId);
  const groups = await loadGroups(resolvedUserId);

  if (groups.length === 0) {
    return { exportedCount: 0 };
  }

  downloadJsonFile({
    version: BACKUP_VERSION,
    groups,
  });

  return {
    exportedCount: groups.length,
  };
}

export async function importGroups(
  file: File,
  userId?: string | null
): Promise<ImportGroupsResult> {
  const resolvedUserId = await resolveUserId(userId);
  const [existingGroups, currentSubscriptions, fileContent] = await Promise.all([
    loadGroups(resolvedUserId),
    fetchCurrentSubscriptions(),
    file.text(),
  ]);

  const importedPayload = parseImportPayload(fileContent);
  const currentChannelIds = new Set(currentSubscriptions.map((sub) => sub.channelId));
  const groupNameKeys = new Set(existingGroups.map((group) => getGroupNameKey(group.name)));
  const usedGroupIds = new Set(existingGroups.map((group) => group.id));

  let skippedCount = importedPayload.skippedInvalidCount;
  let filteredChannelsCount = 0;

  const groupsToImport: Group[] = [];
  for (const group of importedPayload.groups) {
    const groupNameKey = getGroupNameKey(group.name);
    if (!groupNameKey || groupNameKeys.has(groupNameKey)) {
      skippedCount += 1;
      continue;
    }

    groupNameKeys.add(groupNameKey);

    const filteredChannelIds = group.channelIds.filter((channelId) => currentChannelIds.has(channelId));
    filteredChannelsCount += group.channelIds.length - filteredChannelIds.length;

    let nextGroupId = group.id;
    if (usedGroupIds.has(nextGroupId)) {
      nextGroupId = createUniqueGroupId(usedGroupIds);
    } else {
      usedGroupIds.add(nextGroupId);
    }

    groupsToImport.push({
      ...group,
      id: nextGroupId,
      channelIds: filteredChannelIds,
    });
  }

  if (groupsToImport.length > 0) {
    await saveGroups(resolvedUserId, [...existingGroups, ...groupsToImport]);
  }

  return {
    importedCount: groupsToImport.length,
    skippedCount,
    filteredChannelsCount,
  };
}
