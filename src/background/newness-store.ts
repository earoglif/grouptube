import { storage } from "webextension-polyfill";
import type { ChannelId } from "../content/types";

const LAST_UPLOADED_KEY = "grouptube_channel_last_uploaded";
const LAST_SEEN_KEY = "grouptube_channel_last_seen_v2";
const CACHE_TS_KEY = "grouptube_newness_cache_ts";

export type IsoDateMap = Record<ChannelId, string>;

function normalizeMap(value: unknown): IsoDateMap {
  if (!value || typeof value !== "object") return {};
  const result: IsoDateMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key === "string" && key.length > 0 && typeof raw === "string" && raw.length > 0) {
      result[key] = raw;
    }
  }
  return result;
}

export async function loadLastUploaded(): Promise<IsoDateMap> {
  const data = await storage.local.get(LAST_UPLOADED_KEY);
  return normalizeMap(data[LAST_UPLOADED_KEY]);
}

export async function saveLastUploaded(map: IsoDateMap): Promise<void> {
  await storage.local.set({ [LAST_UPLOADED_KEY]: map });
}

export async function loadLastSeen(): Promise<IsoDateMap> {
  const data = await storage.local.get(LAST_SEEN_KEY);
  return normalizeMap(data[LAST_SEEN_KEY]);
}

export async function saveLastSeen(map: IsoDateMap): Promise<void> {
  await storage.local.set({ [LAST_SEEN_KEY]: map });
}

export async function markSeen(channelId: ChannelId): Promise<void> {
  const map = await loadLastSeen();
  map[channelId] = new Date().toISOString();
  await saveLastSeen(map);
}

export async function loadCacheTs(): Promise<number> {
  const data = await storage.local.get(CACHE_TS_KEY);
  const raw = data[CACHE_TS_KEY];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

export async function saveCacheTs(ts: number): Promise<void> {
  await storage.local.set({ [CACHE_TS_KEY]: ts });
}

export async function isCacheFresh(ttlMs: number): Promise<boolean> {
  const ts = await loadCacheTs();
  if (ts <= 0) return false;
  return Date.now() - ts < ttlMs;
}
