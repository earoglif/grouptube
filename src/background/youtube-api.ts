import { identity } from "webextension-polyfill";
import type { Subscription } from "../content/types";

const YOUTUBE_SUBSCRIPTIONS_URL = "https://www.googleapis.com/youtube/v3/subscriptions";
const PAGE_SIZE = 50;

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

async function getOAuthToken(): Promise<string> {
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
