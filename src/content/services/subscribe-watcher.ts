import type { ChannelId } from "../../shared/types";
import { logger } from "../../shared/logger";
import { PAGE_BRIDGE_EVENTS, ensurePageBridgeInjected } from "./page-bridge";

export type SubscribedChannelInfo = {
  channelId: ChannelId;
  name: string;
  thumbnailUrl?: string;
};

export type SubscribeWatcherCallback = (info: SubscribedChannelInfo) => void;
export type UnsubscribeWatcherCallback = (channelIds: ChannelId[]) => void;

const CHANNEL_ID_REGEX = /"(?:channelId|externalChannelId|externalId)"\s*:\s*"(UC[a-zA-Z0-9_-]{20,})"/;
const AUTHOR_REGEX = /"author"\s*:\s*"((?:\\.|[^"\\])*)"/;
const DEBUG_PREFIX = "[grouptube/subscribe-watcher]";

function unescapeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value;
  }
}

/**
 * Extract channel info from scripts
 * @returns {channelId: string | null; name: string}
 */
function extractFromScripts(): { channelId: string | null; name: string } {
  const scripts = document.querySelectorAll<HTMLScriptElement>("script");
  let channelId: string | null = null;
  let name = "";

  for (const script of scripts) {
    const text = script.textContent;
    if (!text) continue;
    if (!text.includes("ytInitialPlayerResponse") && !text.includes("ytInitialData")) continue;

    if (!channelId) {
      const idMatch = text.match(CHANNEL_ID_REGEX);
      if (idMatch) channelId = idMatch[1];
    }
    if (!name) {
      const authorMatch = text.match(AUTHOR_REGEX);
      if (authorMatch) name = unescapeJsonString(authorMatch[1]);
    }
    if (channelId && name) break;
  }

  logger.debug(`${DEBUG_PREFIX} extractChannelInfo`, { scripts, channelId, name });

  return { channelId, name };
}

function extractChannelInfo(preferredChannelId?: string): SubscribedChannelInfo | null {
  const fromScripts = extractFromScripts();

  let channelId = preferredChannelId ?? fromScripts.channelId;
  if (!channelId) {
    const metaId = document
      .querySelector<HTMLMetaElement>('meta[itemprop="channelId"], meta[itemprop="identifier"]')
      ?.getAttribute("content");
    if (metaId && metaId.startsWith("UC")) channelId = metaId;
  }

  if (!channelId) {
    const linkEl = document.querySelector<HTMLAnchorElement>('a[href*="/channel/UC"]');
    const hrefMatch = linkEl?.getAttribute("href")?.match(/\/channel\/(UC[a-zA-Z0-9_-]{20,})/);
    if (hrefMatch) channelId = hrefMatch[1];
  }

  if (!channelId) return null;

  let name = fromScripts.name;
  if (!name) {
    name =
      document.querySelector("ytd-video-owner-renderer ytd-channel-name")?.textContent?.trim() ??
      document.querySelector('meta[itemprop="name"]')?.getAttribute("content")?.trim() ??
      "";
  }

  const thumbnailUrl =
    document.querySelector<HTMLImageElement>("ytd-video-owner-renderer img, #avatar img")?.src ||
    undefined;

  logger.debug(`${DEBUG_PREFIX} extractChannelInfo`, { preferredChannelId, fromScripts, channelId, name, thumbnailUrl });

  return { channelId, name, thumbnailUrl };
}

function normalizeChannelIds(value: unknown): ChannelId[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: ChannelId[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function initSubscribeWatcher(onSubscribed: SubscribeWatcherCallback): () => void {
  ensurePageBridgeInjected();
  logger.debug(`${DEBUG_PREFIX} init; listening event`, PAGE_BRIDGE_EVENTS.subscriptionSubscribe);

  const handleSubscribeEvent = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;

    const detail = event.detail as { channelIds?: unknown } | undefined;
    const channelIds = normalizeChannelIds(detail?.channelIds);
    logger.debug(`${DEBUG_PREFIX} event received`, { detail, channelIds });

    const info = extractChannelInfo(channelIds[0]);
    if (!info) {
      logger.debug(`${DEBUG_PREFIX} skip: extractChannelInfo failed`, { preferredChannelId: channelIds[0] });
      return;
    }
    logger.debug(`${DEBUG_PREFIX} onSubscribed`, info);
    onSubscribed(info);
  };

  window.addEventListener(PAGE_BRIDGE_EVENTS.subscriptionSubscribe, handleSubscribeEvent as EventListener);

  return () => {
    window.removeEventListener(PAGE_BRIDGE_EVENTS.subscriptionSubscribe, handleSubscribeEvent as EventListener);
  };
}

export function initUnsubscribeWatcher(onUnsubscribed: UnsubscribeWatcherCallback): () => void {
  ensurePageBridgeInjected();
  logger.debug(`${DEBUG_PREFIX} init; listening event`, PAGE_BRIDGE_EVENTS.subscriptionUnsubscribe);

  const handleUnsubscribeEvent = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;

    const detail = event.detail as { channelIds?: unknown } | undefined;
    const channelIds = normalizeChannelIds(detail?.channelIds);
    if (channelIds.length > 0) {
      onUnsubscribed(channelIds);
      return;
    }

    const info = extractChannelInfo();
    onUnsubscribed(info ? [info.channelId] : []);
  };

  window.addEventListener(PAGE_BRIDGE_EVENTS.subscriptionUnsubscribe, handleUnsubscribeEvent as EventListener);

  return () => {
    window.removeEventListener(PAGE_BRIDGE_EVENTS.subscriptionUnsubscribe, handleUnsubscribeEvent as EventListener);
  };
}
