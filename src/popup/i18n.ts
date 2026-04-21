import { storage } from "webextension-polyfill";
import { STORAGE_KEYS } from "../shared/constants";
import { i18n } from "../shared/i18n";
import { normalizeLanguage } from "../shared/i18n/normalize";

async function applyStoredLanguage(): Promise<void> {
  const storedLanguage = (await storage.local.get(STORAGE_KEYS.popupLanguage))[
    STORAGE_KEYS.popupLanguage
  ];
  if (typeof storedLanguage !== "string") {
    return;
  }

  const normalizedLanguage = normalizeLanguage(storedLanguage);
  if (i18n.language !== normalizedLanguage) {
    await i18n.changeLanguage(normalizedLanguage);
  }
}

storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  const languageChange = changes[STORAGE_KEYS.popupLanguage];
  if (!languageChange || typeof languageChange.newValue !== "string") {
    return;
  }

  const normalizedLanguage = normalizeLanguage(languageChange.newValue);
  if (i18n.language !== normalizedLanguage) {
    void i18n.changeLanguage(normalizedLanguage);
  }
});

void applyStoredLanguage();

export { i18n };
