import type { ChannelId, Group, GroupId, Subscription } from "../types";

const CHANNEL_URL_PREFIX = "https://www.youtube.com/channel/";
export const GROUPING_PROMPT_VERSION = 2;

type PromptChannel = {
  channelId: ChannelId;
  name: string;
  url: string;
  currentGroup: string | null;
};

type BuildGroupingPromptInput = {
  groups: Group[];
  subscriptions: Subscription[];
  channelToGroupMap: Map<ChannelId, GroupId>;
};

function buildChannelUrl(channelId: ChannelId): string {
  return `${CHANNEL_URL_PREFIX}${channelId}`;
}

function toPromptChannels({
  groups,
  subscriptions,
  channelToGroupMap,
}: BuildGroupingPromptInput): PromptChannel[] {
  const groupNameById = new Map(groups.map((group) => [group.id, group.name]));

  return [...subscriptions]
    .map((subscription) => {
      const groupId = channelToGroupMap.get(subscription.channelId);
      const currentGroup = groupId ? groupNameById.get(groupId) ?? null : null;

      return {
        channelId: subscription.channelId,
        name: subscription.name,
        url: buildChannelUrl(subscription.channelId),
        currentGroup,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));
}

export function buildGroupingPrompt(input: BuildGroupingPromptInput): string {
  const channels = toPromptChannels(input);
  const outputShapeExample = {
    version: GROUPING_PROMPT_VERSION,
    groups: [
      {
        id: "group-id-uuid",
        name: "Group Name",
        color: "#3ea6ff",
        channelIds: ["channel-id-1", "channel-id-2"],
      },
    ],
  };

  return [
    "You are an assistant that organizes YouTube subscriptions into clear and practical groups.",
    "",
    "Goal:",
    "- Group all channels from INPUT_CHANNELS into useful thematic groups.",
    "- Use currentGroup as a hint, but you may reorganize channels if a better structure exists.",
    "",
    "Hard requirements:",
    "- Return valid JSON only. No markdown, no explanations, no extra text.",
    `- Set \"version\" to ${GROUPING_PROMPT_VERSION}.`,
    "- Use this exact top-level shape:",
    JSON.stringify(outputShapeExample, null, 2),
    "- Include every channelId from INPUT_CHANNELS exactly once across groups[*].channelIds.",
    "- Do not add channelIds that are not present in INPUT_CHANNELS.",
    "- Group names must be short and human-readable.",
    "- color must be a valid hex string in #RRGGBB format.",
    "",
    "INPUT_CHANNELS (each item contains channelId, channel name, channel URL, and current group hint):",
    JSON.stringify(channels, null, 2),
  ].join("\n");
}
