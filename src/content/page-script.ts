// @ts-nocheck

const INSTALL_FLAG = "__grouptubePageBridgeInstalled__";

const EVENT_USER_INFO = "grouptube:user-info";
const EVENT_REQUEST_USER_INFO = "grouptube:request-user-info";
const EVENT_SUBSCRIPTION_SUBSCRIBE = "grouptube:subscription-subscribe";
const EVENT_SUBSCRIPTION_UNSUBSCRIBE = "grouptube:subscription-unsubscribe";

const SUBSCRIBE_URL_MARKER = "/youtubei/v1/subscription/subscribe";
const UNSUBSCRIBE_URL_MARKER = "/youtubei/v1/subscription/unsubscribe";
const DEBUG_PREFIX = "[grouptube/page-script]";
const CHANNEL_IDS_ARRAY_REGEX = /"channelIds"\s*:\s*\[(.*?)\]/s;
const CHANNEL_ID_IN_ARRAY_REGEX = /"(UC[a-zA-Z0-9_-]{20,})"/g;
const SINGLE_CHANNEL_ID_REGEX = /"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{20,})"/;

function getYtData() {
  const ytcfg = window.ytcfg;
  if (typeof ytcfg !== "object" || ytcfg === null) return {};

  const data = ytcfg.data_;
  return typeof data === "object" && data !== null ? data : {};
}

function emitUserInfo() {
  const data = getYtData();
  const dataSyncId = data.DATASYNC_ID;
  const delegatedSessionId = data.DELEGATED_SESSION_ID;
  const userId =
    (typeof dataSyncId === "string" && dataSyncId.length > 0 && dataSyncId) ||
    (typeof delegatedSessionId === "string" && delegatedSessionId.length > 0 && delegatedSessionId) ||
    null;

  window.dispatchEvent(new CustomEvent(EVENT_USER_INFO, { detail: { userId } }));
}

function uniqueStringArray(items) {
  if (!Array.isArray(items)) return [];
  const normalized = [];
  const seen = new Set();
  for (const item of items) {
    if (typeof item !== "string") continue;
    const value = item.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }
  
  return normalized;
}

function maybeJsonParse(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseChannelIdsFromRawText(raw) {
  if (typeof raw !== "string" || raw.length === 0) return [];

  const parsed = maybeJsonParse(raw);
  if (parsed && typeof parsed === "object") {
    const direct = uniqueStringArray(parsed.channelIds || parsed.channelIdsList);
    if (direct.length > 0) return direct;
  }

  const arrayMatch = raw.match(CHANNEL_IDS_ARRAY_REGEX);
  if (arrayMatch) {
    const ids = [];
    let match;
    CHANNEL_ID_IN_ARRAY_REGEX.lastIndex = 0;
    while ((match = CHANNEL_ID_IN_ARRAY_REGEX.exec(arrayMatch[1])) !== null) {
      ids.push(match[1]);
    }
    const normalized = uniqueStringArray(ids);
    if (normalized.length > 0) return normalized;
  }

  const singleMatch = raw.match(SINGLE_CHANNEL_ID_REGEX);
  if (singleMatch) return [singleMatch[1]];

  return [];
}

function parseSubscribeBody(body) {
  if (!body) return [];

  if (typeof body === "string") {
    const fromRaw = parseChannelIdsFromRawText(body);
    if (fromRaw.length > 0) return fromRaw;

    const params = new URLSearchParams(body);
    const ids = params.getAll("channelIds");
    if (ids.length > 0) return uniqueStringArray(ids);

    const c = params.get("channelId");
    if (c) return uniqueStringArray([c]);

    const data = params.get("data");
    if (data) {
      const fromData = parseChannelIdsFromRawText(data);
      if (fromData.length > 0) return fromData;
    }
    return [];
  }

  if (body instanceof URLSearchParams) {
    const data = body.get("data");
    if (data) {
      const fromData = parseChannelIdsFromRawText(data);
      if (fromData.length > 0) return fromData;
    }
    return [];
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const ids = body.getAll("channelIds").filter((value) => typeof value === "string");
    if (ids.length > 0) return uniqueStringArray(ids);

    const c = body.get("channelId");
    if (typeof c === "string" && c) return uniqueStringArray([c]);

    const data = body.get("data");
    if (typeof data === "string") {
      const fromData = parseChannelIdsFromRawText(data);
      if (fromData.length > 0) return fromData;
    }
    return [];
  }

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return [];
  }

  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) {
    try {
      return parseChannelIdsFromRawText(new TextDecoder().decode(new Uint8Array(body)));
    } catch {
      return [];
    }
  }

  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(body)) {
    try {
      return parseChannelIdsFromRawText(new TextDecoder().decode(body));
    } catch {
      return [];
    }
  }

  if (typeof body === "object") {
    const direct = uniqueStringArray(body.channelIds || body.channelIdsList);
    if (direct.length > 0) return direct;
    try {
      return parseChannelIdsFromRawText(JSON.stringify(body));
    } catch {
      return [];
    }
  }

  return [];
}

async function parseSubscribeBodyFromRequest(input, init) {
  const directBody = init && init.body !== undefined ? init.body : undefined;
  const fromDirectBody = parseSubscribeBody(directBody);
  if (fromDirectBody.length > 0) return fromDirectBody;

  if (typeof Blob !== "undefined" && directBody instanceof Blob) {
    try {
      const text = await directBody.text();
      const fromBlob = parseChannelIdsFromRawText(text);
      if (fromBlob.length > 0) return fromBlob;
    } catch (error) {
      console.log(`${DEBUG_PREFIX} init.body Blob.text() failed`, { error });
    }
  }

  if (input && typeof Request !== "undefined" && input instanceof Request) {
    try {
      const text = await input.clone().text();
      const fromText = parseChannelIdsFromRawText(text);
      if (fromText.length > 0) return fromText;
    } catch (error) {
      console.log(`${DEBUG_PREFIX} request.clone().text() failed`, { error });
    }
  }

  const bodyFromRequest = input && typeof input === "object" && "body" in input ? input.body : undefined;
  const fromRequestBody = parseSubscribeBody(bodyFromRequest);
  if (fromRequestBody.length > 0) return fromRequestBody;

  return [];
}

function emitSubscriptionEvent(eventName, channelIds) {
  const normalizedChannelIds = Array.isArray(channelIds) ? channelIds : [];
  console.log(`${DEBUG_PREFIX} emit subscription event`, { eventName, channelIds: normalizedChannelIds });
  window.dispatchEvent(
    new CustomEvent(eventName, { detail: { channelIds: normalizedChannelIds } })
  );
}

function installSubscribeRequestBridge() {
  console.log(`${DEBUG_PREFIX} install subscribe bridge`);
  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = function patchedFetch(input, init) {
      try {
        const url =
          typeof input === "string"
            ? input
            : input && typeof input === "object" && "url" in input
              ? input.url
              : "";
        if (typeof url === "string" && (url.includes(SUBSCRIBE_URL_MARKER) || url.includes(UNSUBSCRIBE_URL_MARKER))) {
          const eventName = url.includes(UNSUBSCRIBE_URL_MARKER)
            ? EVENT_SUBSCRIPTION_UNSUBSCRIBE
            : EVENT_SUBSCRIPTION_SUBSCRIBE;
          console.log(`${DEBUG_PREFIX} fetch subscription match`, { url, eventName });
          void parseSubscribeBodyFromRequest(input, init).then((channelIds) => {
            const body = init && init.body !== undefined ? init.body : undefined;
            console.log(`${DEBUG_PREFIX} fetch parsed channelIds`, {
              channelIds,
              bodyType: typeof body,
              inputType: input instanceof Request ? "Request" : typeof input,
            });
            emitSubscriptionEvent(eventName, channelIds);
          });
        }
      } catch {}

      return originalFetch.apply(this, arguments);
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    try {
      this.__grouptubeSubscribeUrl = typeof url === "string" ? url : "";
      if (
        typeof this.__grouptubeSubscribeUrl === "string" &&
        (this.__grouptubeSubscribeUrl.includes(SUBSCRIBE_URL_MARKER) ||
          this.__grouptubeSubscribeUrl.includes(UNSUBSCRIBE_URL_MARKER))
      ) {
        console.log(`${DEBUG_PREFIX} xhr subscription open`, { method, url: this.__grouptubeSubscribeUrl });
      }
    } catch {}
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function patchedSend(body) {
    try {
      const url = this.__grouptubeSubscribeUrl || "";
      if (typeof url === "string" && (url.includes(SUBSCRIBE_URL_MARKER) || url.includes(UNSUBSCRIBE_URL_MARKER))) {
        const eventName = url.includes(UNSUBSCRIBE_URL_MARKER)
          ? EVENT_SUBSCRIPTION_UNSUBSCRIBE
          : EVENT_SUBSCRIPTION_SUBSCRIBE;
        const channelIds = parseSubscribeBody(body);
        console.log(`${DEBUG_PREFIX} xhr parsed channelIds`, { channelIds, bodyType: typeof body });
        emitSubscriptionEvent(eventName, channelIds);
      }
    } catch {}
    return originalSend.apply(this, arguments);
  };
}

function init() {
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;
  console.log(`${DEBUG_PREFIX} init`);

  window.addEventListener(EVENT_REQUEST_USER_INFO, () => {
    emitUserInfo();
  });

  emitUserInfo();
  installSubscribeRequestBridge();
}

init();
