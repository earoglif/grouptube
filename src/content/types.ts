export type ChannelId = string;
export type GroupId = string;

export interface Subscription {
  channelId: ChannelId;
  name: string;
  thumbnailUrl?: string;
}

export interface Group {
  id: GroupId;
  name: string;
  color: string;
  channelIds: ChannelId[];
}
