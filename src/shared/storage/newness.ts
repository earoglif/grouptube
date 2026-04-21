import { storage } from "webextension-polyfill";
import { STORAGE_KEYS } from "../constants";
import type { ChannelId } from "../types";

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
  const data = await storage.local.get(STORAGE_KEYS.lastUploaded);
  return normalizeMap(data[STORAGE_KEYS.lastUploaded]);
}

export async function saveLastUploaded(map: IsoDateMap): Promise<void> {
  await storage.local.set({ [STORAGE_KEYS.lastUploaded]: map });
}

export async function loadLastSeen(): Promise<IsoDateMap> {
  const data = await storage.local.get(STORAGE_KEYS.lastSeen);
  return normalizeMap(data[STORAGE_KEYS.lastSeen]);
}

export async function saveLastSeen(map: IsoDateMap): Promise<void> {
  await storage.local.set({ [STORAGE_KEYS.lastSeen]: map });
}

export async function markSeen(channelId: ChannelId): Promise<void> {
  const map = await loadLastSeen();
  map[channelId] = new Date().toISOString();
  await saveLastSeen(map);
}

export async function loadCacheTs(): Promise<number> {
  const data = await storage.local.get(STORAGE_KEYS.newnessCacheTs);
  const raw = data[STORAGE_KEYS.newnessCacheTs];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

export async function saveCacheTs(ts: number): Promise<void> {
  await storage.local.set({ [STORAGE_KEYS.newnessCacheTs]: ts });
}

export async function isCacheFresh(ttlMs: number): Promise<boolean> {
  const ts = await loadCacheTs();
  if (ts <= 0) return false;
  return Date.now() - ts < ttlMs;
}
