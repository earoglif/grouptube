import type { ChannelId, ISubscription } from "../types";

export type MessageMap = {
  "get-subscriptions": {
    req: Record<string, never>;
    res: ISubscription[];
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
    res: ISubscription | null;
  };
};

export type Action = keyof MessageMap;
