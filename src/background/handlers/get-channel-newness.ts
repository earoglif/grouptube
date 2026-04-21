import type { ChannelId } from "../../shared/types";
import { fetchLatestUploadDates } from "../youtube-api";
import {
  isCacheFresh,
  loadLastSeen,
  loadLastUploaded,
  saveCacheTs,
  saveLastUploaded,
} from "../newness-store";

const NEWNESS_CACHE_TTL_MS = 15 * 60 * 1000;
const NEWNESS_FALLBACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function computeNewness(
  channelIds: ChannelId[],
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

export async function handleGetChannelNewness({
  channelIds,
}: {
  channelIds: ChannelId[];
}) {
  if (channelIds.length === 0) {
    return {};
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

  return computeNewness(uniqueIds, lastUploaded, lastSeen);
}
