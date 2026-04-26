export type ChannelId = string;
export type GroupId = string;

export interface ISubscription {
  channelId: ChannelId;
  name: string;
  thumbnailUrl?: string;
  description?: string;
  hasNewContent?: boolean;
}

export interface IGroup {
  id: GroupId;
  name: string;
  color: string;
  channelIds: ChannelId[];
}
