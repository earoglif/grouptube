import type { ChannelId, Group } from "./types";

export const DEFAULT_GROUP_COLOR = "#3ea6ff";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeColor(value: unknown): string {
  const color = sanitizeText(value);
  return color || DEFAULT_GROUP_COLOR;
}

export function sanitizeChannelIds(value: unknown): ChannelId[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);
  return [...new Set(ids)];
}

export function normalizeGroup(value: unknown): Group | null {
  if (!isRecord(value)) return null;

  const id = sanitizeText(value.id);
  const name = sanitizeText(value.name);

  if (!id || !name) return null;

  return {
    id,
    name,
    color: sanitizeColor(value.color),
    channelIds: sanitizeChannelIds(value.channelIds),
  };
}

export function normalizeGroups(value: unknown): Group[] {
  if (!Array.isArray(value)) return [];

  const groups = value
    .map((item) => normalizeGroup(item))
    .filter((item): item is Group => item !== null);

  return groups.map((group) => ({
    ...group,
    channelIds: [...new Set(group.channelIds)],
  }));
}

export function getGroupNameKey(value: unknown): string {
  return sanitizeText(value).toLowerCase();
}
