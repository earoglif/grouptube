import { runtime } from "webextension-polyfill";
import type { ChannelId } from "../types";

type GetChannelNewnessMessage = {
  action: "get-channel-newness";
  channelIds: ChannelId[];
};

type GetChannelNewnessResponse =
  | { ok: true; newness: Record<ChannelId, boolean> }
  | { ok: false; error: string };

type MarkChannelSeenMessage = {
  action: "mark-channel-seen";
  channelId: ChannelId;
};

type MarkChannelSeenResponse = { ok: true } | { ok: false; error: string };

export async function requestChannelNewness(
  channelIds: ChannelId[],
): Promise<Map<ChannelId, boolean>> {
  if (channelIds.length === 0) return new Map();

  const message: GetChannelNewnessMessage = {
    action: "get-channel-newness",
    channelIds,
  };

  const response = (await runtime.sendMessage(message)) as GetChannelNewnessResponse | undefined;

  if (!response || typeof response !== "object") {
    throw new Error("Invalid channel newness response");
  }

  if (!response.ok) {
    throw new Error(response.error || "Failed to load channel newness");
  }

  const result = new Map<ChannelId, boolean>();
  for (const [channelId, value] of Object.entries(response.newness)) {
    result.set(channelId, Boolean(value));
  }
  return result;
}

export async function markChannelSeen(channelId: ChannelId): Promise<void> {
  const message: MarkChannelSeenMessage = {
    action: "mark-channel-seen",
    channelId,
  };

  const response = (await runtime.sendMessage(message)) as MarkChannelSeenResponse | undefined;

  if (!response || typeof response !== "object") {
    throw new Error("Invalid mark-channel-seen response");
  }

  if (!response.ok) {
    throw new Error(response.error || "Failed to mark channel seen");
  }
}
