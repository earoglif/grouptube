import { storage } from "webextension-polyfill";
import { getCurrentLanguage } from "../utils/getCurrentLanguage";
import { STORAGE_KEYS } from "../shared/constants";
import { normalizeLanguage } from "../shared/i18n/normalize";
import { initGuideGroups } from "./guide-groups";
import { ensurePageBridgeInjected } from "./services/page-bridge";
import { initSubscribeAssign } from "./subscribe-assign";

async function persistPageLanguage(): Promise<void> {
  const normalizedLanguage = normalizeLanguage(getCurrentLanguage());
  await storage.local.set({ [STORAGE_KEYS.popupLanguage]: normalizedLanguage });
}

function init(): void {
  ensurePageBridgeInjected();
  void persistPageLanguage();
  initGuideGroups();
  initSubscribeAssign();
}

init();
