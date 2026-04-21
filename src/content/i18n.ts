import { getCurrentLanguage } from "../utils/getCurrentLanguage";
import { i18n } from "../shared/i18n";
import { normalizeLanguage } from "../shared/i18n/normalize";
import en from "../shared/locales/en.json";

type TranslationKey = keyof typeof en;

export function t(key: TranslationKey): string {
  const lang = normalizeLanguage(getCurrentLanguage());
  if (i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
  return i18n.t(key);
}
