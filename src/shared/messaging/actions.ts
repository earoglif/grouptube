import type { ChannelId, Subscription } from "../types";

export type MessageMap = {
  "get-subscriptions": {
    req: Record<string, never>;
    res: Subscription[];
  };
  "get-channel-newness": {
    req: { channelIds: ChannelId[] };
    res: Record<ChannelId, boolean>;
  };
  "mark-channel-seen": {
    req: { channelId: ChannelId };
    res: null;
  };
  "get-channel-details": {
    req: { channelId: ChannelId };
    res: Subscription | null;
  };
};

export type Action = keyof MessageMap;
