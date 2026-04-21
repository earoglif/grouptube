import type { ChannelId } from "../../shared/types";
import { fetchChannelDetails } from "../youtube-api";

export async function handleGetChannelDetails({ channelId }: { channelId: ChannelId }) {
  return fetchChannelDetails(channelId);
}
