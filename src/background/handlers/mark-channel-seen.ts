import type { ChannelId } from "../../shared/types";
import { markSeen } from "../newness-store";

export async function handleMarkChannelSeen({ channelId }: { channelId: ChannelId }) {
  await markSeen(channelId);
  return null;
}
