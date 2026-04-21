import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "../locales/en.json";
import ruTranslation from "../locales/ru.json";

let initialized = false;

export async function ensureI18n(): Promise<void> {
  if (initialized) return;

  await i18n.use(initReactI18next).init({
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
  initialized = true;
}

void ensureI18n();

export { i18n };
