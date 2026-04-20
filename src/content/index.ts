import { storage } from "webextension-polyfill";
import { getCurrentLanguage } from "../utils/getCurrentLanguage";
import { initGuideGroups } from "./guide-groups";
import { ensurePageBridgeInjected } from "./services/page-bridge";
import { initSubscribeAssign } from "./subscribe-assign";

const POPUP_LANGUAGE_STORAGE_KEY = "popupLanguage";

function normalizeLanguage(language: string): "ru" | "en" {
  return language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

async function persistPageLanguage(): Promise<void> {
  const normalizedLanguage = normalizeLanguage(getCurrentLanguage());
  await storage.local.set({ [POPUP_LANGUAGE_STORAGE_KEY]: normalizedLanguage });
}

function init(): void {
  ensurePageBridgeInjected();
  void persistPageLanguage();
  initGuideGroups();
  initSubscribeAssign();
}

init();
