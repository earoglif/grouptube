import { getCurrentLanguage } from "../utils/getCurrentLanguage";
import en from "../popup/locales/en.json";
import ru from "../popup/locales/ru.json";

type TranslationKey = keyof typeof en;

const translations: Record<string, Record<TranslationKey, string>> = { en, ru };

function normalizeLanguage(language: string): "ru" | "en" {
  return language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function t(key: TranslationKey): string {
  const lang = normalizeLanguage(getCurrentLanguage());
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
