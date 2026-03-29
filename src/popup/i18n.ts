import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { storage } from "webextension-polyfill";
import enTranslation from "./locales/en.json";
import ruTranslation from "./locales/ru.json";

const POPUP_LANGUAGE_STORAGE_KEY = "popupLanguage";

function normalizeLanguage(language: string): "ru" | "en" {
  return language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

async function applyStoredLanguage(): Promise<void> {
  const storedLanguage = (await storage.local.get(POPUP_LANGUAGE_STORAGE_KEY))[
    POPUP_LANGUAGE_STORAGE_KEY
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

  const languageChange = changes[POPUP_LANGUAGE_STORAGE_KEY];
  if (!languageChange || typeof languageChange.newValue !== "string") {
    return;
  }

  const normalizedLanguage = normalizeLanguage(languageChange.newValue);
  if (i18n.language !== normalizedLanguage) {
    void i18n.changeLanguage(normalizedLanguage);
  }
});

void i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: { translation: enTranslation },
    ru: { translation: ruTranslation },
  },
});

void applyStoredLanguage();

export { i18n };
