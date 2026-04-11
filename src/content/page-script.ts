// @ts-nocheck

const INSTALL_FLAG = "__grouptubePageBridgeInstalled__";

const EVENT_USER_INFO = "grouptube:user-info";
const EVENT_REQUEST_USER_INFO = "grouptube:request-user-info";

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

function init() {
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  window.addEventListener(EVENT_REQUEST_USER_INFO, () => {
    emitUserInfo();
  });

  emitUserInfo();
}

init();
