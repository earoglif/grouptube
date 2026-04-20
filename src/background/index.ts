import { runtime } from "webextension-polyfill";
import type { ChannelId, Subscription } from "../content/types";
import { fetchLatestUploadDates, fetchUserSubscriptions } from "./youtube-api";
import {
  isCacheFresh,
  loadLastSeen,
  loadLastUploaded,
  markSeen,
  saveCacheTs,
  saveLastUploaded,
} from "./newness-store";

const NEWNESS_CACHE_TTL_MS = 15 * 60 * 1000;
const NEWNESS_FALLBACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type GetSubscriptionsMessage = {
  action: "get-subscriptions";
};

type GetChannelNewnessMessage = {
  action: "get-channel-newness";
  channelIds: string[];
};

type MarkChannelSeenMessage = {
  action: "mark-channel-seen";
  channelId: string;
};

export type GetSubscriptionsResponse =
  | {
      ok: true;
      subscriptions: Subscription[];
    }
  | {
      ok: false;
      error: string;
    };

export type GetChannelNewnessResponse =
  | {
      ok: true;
      newness: Record<ChannelId, boolean>;
    }
  | {
      ok: false;
      error: string;
    };

export type MarkChannelSeenResponse =
  | { ok: true }
  | { ok: false; error: string };

function isGetSubscriptionsMessage(message: unknown): message is GetSubscriptionsMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "action" in message &&
    (message as { action?: unknown }).action === "get-subscriptions"
  );
}

function isGetChannelNewnessMessage(message: unknown): message is GetChannelNewnessMessage {
  if (
    typeof message !== "object" ||
    message === null ||
    (message as { action?: unknown }).action !== "get-channel-newness"
  ) {
    return false;
  }
  const channelIds = (message as { channelIds?: unknown }).channelIds;
  return Array.isArray(channelIds) && channelIds.every((id) => typeof id === "string");
}

function isMarkChannelSeenMessage(message: unknown): message is MarkChannelSeenMessage {
  if (
    typeof message !== "object" ||
    message === null ||
    (message as { action?: unknown }).action !== "mark-channel-seen"
  ) {
    return false;
  }
  const channelId = (message as { channelId?: unknown }).channelId;
  return typeof channelId === "string" && channelId.length > 0;
}

async function handleGetSubscriptions(): Promise<GetSubscriptionsResponse> {
  try {
    const subscriptions = await fetchUserSubscriptions();
    return {
      ok: true,
      subscriptions,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load subscriptions";
    return {
      ok: false,
      error: message,
    };
  }
}

function computeNewness(
  channelIds: string[],
  lastUploaded: Record<string, string>,
  lastSeen: Record<string, string>,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  const fallbackIso = new Date(Date.now() - NEWNESS_FALLBACK_WINDOW_MS).toISOString();
  for (const channelId of channelIds) {
    const uploaded = lastUploaded[channelId];
    if (!uploaded) {
      result[channelId] = false;
      continue;
    }
    const seen = lastSeen[channelId] ?? fallbackIso;
    result[channelId] = uploaded > seen;
  }
  return result;
}

async function handleGetChannelNewness(
  channelIds: string[],
): Promise<GetChannelNewnessResponse> {
  try {
    if (channelIds.length === 0) {
      return { ok: true, newness: {} };
    }

    const uniqueIds = Array.from(new Set(channelIds));
    let lastUploaded = await loadLastUploaded();
    const lastSeen = await loadLastSeen();

    const cacheFresh = await isCacheFresh(NEWNESS_CACHE_TTL_MS);
    const needsRefresh = !cacheFresh || uniqueIds.some((id) => !(id in lastUploaded));

    if (needsRefresh) {
      const fetched = await fetchLatestUploadDates(uniqueIds);
      const nextUploaded: Record<string, string> = { ...lastUploaded };
      for (const id of uniqueIds) {
        const value = fetched[id];
        if (value) {
          nextUploaded[id] = value;
        } else {
          delete nextUploaded[id];
        }
      }
      await saveLastUploaded(nextUploaded);
      await saveCacheTs(Date.now());
      lastUploaded = nextUploaded;
    }

    return {
      ok: true,
      newness: computeNewness(uniqueIds, lastUploaded, lastSeen),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load channel newness";
    return { ok: false, error: message };
  }
}

async function handleMarkChannelSeen(channelId: string): Promise<MarkChannelSeenResponse> {
  try {
    await markSeen(channelId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark channel seen";
    return { ok: false, error: message };
  }
}

function init(): void {
  runtime.onInstalled.addListener(() => {
    console.log("BG loaded");
  });

  runtime.onMessage.addListener((message: unknown) => {
    if (isGetSubscriptionsMessage(message)) {
      return handleGetSubscriptions();
    }

    if (isGetChannelNewnessMessage(message)) {
      return handleGetChannelNewness(message.channelIds);
    }

    if (isMarkChannelSeenMessage(message)) {
      return handleMarkChannelSeen(message.channelId);
    }

    return undefined;
  });
}

init();
