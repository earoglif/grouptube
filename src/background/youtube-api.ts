import { identity } from "webextension-polyfill";
import type { ChannelId, Subscription } from "../shared/types";

const YOUTUBE_SUBSCRIPTIONS_URL = "https://www.googleapis.com/youtube/v3/subscriptions";
const YOUTUBE_PLAYLIST_ITEMS_URL = "https://www.googleapis.com/youtube/v3/playlistItems";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";
const PAGE_SIZE = 50;
const LATEST_UPLOAD_CONCURRENCY = 8;

type AuthTokenResponse = string | { token?: string | null } | undefined;

type SubscriptionListItem = {
  snippet?: {
    title?: string;
    description?: string;
    resourceId?: {
      channelId?: string;
    };
    thumbnails?: {
      default?: {
        url?: string;
      };
    };
  };
};

type SubscriptionListResponse = {
  nextPageToken?: string;
  items?: SubscriptionListItem[];
  error?: {
    message?: string;
  };
};

type IdentityLike = {
  getAuthToken: (details: { interactive: boolean }) => Promise<AuthTokenResponse>;
};

function extractToken(response: AuthTokenResponse): string | null {
  if (typeof response === "string") {
    return response;
  }

  if (response && typeof response === "object" && typeof response.token === "string") {
    return response.token;
  }

  return null;
}

export async function getOAuthToken(): Promise<string> {
  const identityApi = identity as unknown as IdentityLike;

  try {
    const silentToken = extractToken(await identityApi.getAuthToken({ interactive: false }));
    if (silentToken) {
      return silentToken;
    }
  } catch {
    // Silent auth failed (e.g. no cached token), fall through to interactive
  }

  const interactiveToken = extractToken(await identityApi.getAuthToken({ interactive: true }));
  if (interactiveToken) {
    return interactiveToken;
  }

  throw new Error("OAuth token was not received");
}

function mapItemToSubscription(item: SubscriptionListItem): Subscription | null {
  const channelId = item.snippet?.resourceId?.channelId?.trim();
  const name = item.snippet?.title?.trim();

  if (!channelId || !name) {
    return null;
  }

  const thumbnailUrl = item.snippet?.thumbnails?.default?.url;
  const description = item.snippet?.description?.trim();
  return {
    channelId,
    name,
    thumbnailUrl: typeof thumbnailUrl === "string" && thumbnailUrl.length > 0 ? thumbnailUrl : undefined,
    description: typeof description === "string" && description.length > 0 ? description : undefined,
  };
}

async function fetchSubscriptionsPage(token: string, pageToken?: string): Promise<SubscriptionListResponse> {
  const query = new URLSearchParams({
    part: "snippet",
    mine: "true",
    maxResults: String(PAGE_SIZE),
    fields: "nextPageToken,items/snippet(title,description,resourceId/channelId,thumbnails/default/url)",
  });

  if (pageToken) {
    query.set("pageToken", pageToken);
  }

  const response = await fetch(`${YOUTUBE_SUBSCRIPTIONS_URL}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as SubscriptionListResponse;

  if (!response.ok) {
    const message =
      payload.error?.message ||
      `YouTube API request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function fetchUserSubscriptions(): Promise<Subscription[]> {
  const token = await getOAuthToken();
  const subscriptions: Subscription[] = [];
  let pageToken: string | undefined;

  do {
    const payload = await fetchSubscriptionsPage(token, pageToken);
    const items = Array.isArray(payload.items) ? payload.items : [];

    for (const item of items) {
      const mapped = mapItemToSubscription(item);
      if (mapped) {
        subscriptions.push(mapped);
      }
    }

    pageToken = payload.nextPageToken;
  } while (pageToken);

  return subscriptions;
}

type PlaylistItemsResponse = {
  items?: Array<{
    contentDetails?: {
      videoPublishedAt?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type ChannelDetailsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      thumbnails?: {
        default?: { url?: string };
        medium?: { url?: string };
        high?: { url?: string };
      };
    };
  }>;
  error?: {
    message?: string;
  };
};

function channelIdToUploadsPlaylistId(channelId: ChannelId): string | null {
  if (!channelId.startsWith("UC") || channelId.length < 3) return null;
  return `UU${channelId.slice(2)}`;
}

async function fetchLatestUploadDate(token: string, channelId: ChannelId): Promise<string | null> {
  const playlistId = channelIdToUploadsPlaylistId(channelId);
  if (!playlistId) return null;

  const query = new URLSearchParams({
    part: "contentDetails",
    playlistId,
    maxResults: "1",
    fields: "items/contentDetails/videoPublishedAt",
  });

  try {
    const response = await fetch(`${YOUTUBE_PLAYLIST_ITEMS_URL}?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as PlaylistItemsResponse;
    const publishedAt = payload.items?.[0]?.contentDetails?.videoPublishedAt;
    return typeof publishedAt === "string" && publishedAt.length > 0 ? publishedAt : null;
  } catch {
    return null;
  }
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor++;
      if (index >= tasks.length) return;
      results[index] = await tasks[index]();
    }
  }

  const workers: Promise<void>[] = [];
  const workerCount = Math.min(Math.max(1, concurrency), tasks.length);
  for (let i = 0; i < workerCount; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

export async function fetchLatestUploadDates(
  channelIds: ChannelId[],
): Promise<Record<ChannelId, string>> {
  if (channelIds.length === 0) return {};

  const token = await getOAuthToken();
  const uniqueIds = Array.from(new Set(channelIds));

  const tasks = uniqueIds.map((channelId) => async (): Promise<[ChannelId, string | null]> => {
    const publishedAt = await fetchLatestUploadDate(token, channelId);
    return [channelId, publishedAt];
  });

  const entries = await runWithConcurrency(tasks, LATEST_UPLOAD_CONCURRENCY);

  const result: Record<ChannelId, string> = {};
  for (const [channelId, publishedAt] of entries) {
    if (publishedAt) {
      result[channelId] = publishedAt;
    }
  }
  return result;
}

export async function fetchChannelDetails(
  channelId: ChannelId,
): Promise<Subscription | null> {
  const normalizedChannelId = channelId.trim();
  if (!normalizedChannelId) return null;

  const token = await getOAuthToken();
  const query = new URLSearchParams({
    part: "snippet",
    id: normalizedChannelId,
    fields: "items(id,snippet(title,description,thumbnails(default/url,medium/url,high/url)))",
  });

  const response = await fetch(`${YOUTUBE_CHANNELS_URL}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as ChannelDetailsResponse;
  if (!response.ok) {
    const message = payload.error?.message || `YouTube channel request failed with status ${response.status}`;
    throw new Error(message);
  }

  const item = payload.items?.[0];
  if (!item) return null;

  const name = item.snippet?.title?.trim();
  if (!name) return null;

  const thumbnailUrl =
    item.snippet?.thumbnails?.high?.url ||
    item.snippet?.thumbnails?.medium?.url ||
    item.snippet?.thumbnails?.default?.url;
  const description = item.snippet?.description?.trim();

  return {
    channelId: normalizedChannelId,
    name,
    thumbnailUrl: typeof thumbnailUrl === "string" && thumbnailUrl.length > 0 ? thumbnailUrl : undefined,
    description: typeof description === "string" && description.length > 0 ? description : undefined,
  };
}
