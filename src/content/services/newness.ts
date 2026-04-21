import { sendMessage } from "../../shared/messaging/client";
import type { ChannelId } from "../../shared/types";

export async function requestChannelNewness(
  channelIds: ChannelId[],
): Promise<Map<ChannelId, boolean>> {
  if (channelIds.length === 0) return new Map();

  const response = await sendMessage("get-channel-newness", { channelIds });

  const result = new Map<ChannelId, boolean>();
  for (const [channelId, value] of Object.entries(response)) {
    result.set(channelId, Boolean(value));
  }
  return result;
}

export async function markChannelSeen(channelId: ChannelId): Promise<void> {
  await sendMessage("mark-channel-seen", { channelId });
}
