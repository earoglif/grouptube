import type { ChannelId, GroupId } from "../types";

const GROUP_PREFIX = "group:";
const SUBSCRIPTION_PREFIX = "subscription:";

export const UNGROUPED_DROP_ID = "ungrouped";

export type GroupDragData = {
  kind: "group";
  groupId: GroupId;
};

export type SubscriptionDragData = {
  kind: "subscription";
  channelId: ChannelId;
  groupId: GroupId | null;
};

export function getGroupDragId(groupId: GroupId): string {
  return `${GROUP_PREFIX}${groupId}`;
}

export function parseGroupId(dragId: unknown): GroupId | null {
  if (typeof dragId !== "string") return null;
  return dragId.startsWith(GROUP_PREFIX) ? dragId.slice(GROUP_PREFIX.length) : null;
}

export function getSubscriptionDragId(channelId: ChannelId): string {
  return `${SUBSCRIPTION_PREFIX}${channelId}`;
}

export function parseSubscriptionChannelId(dragId: unknown): ChannelId | null {
  if (typeof dragId !== "string") return null;
  return dragId.startsWith(SUBSCRIPTION_PREFIX) ? dragId.slice(SUBSCRIPTION_PREFIX.length) : null;
}
