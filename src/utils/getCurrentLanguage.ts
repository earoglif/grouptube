// Returns current UI language with YouTube-specific and browser fallbacks.
export function getCurrentLanguage(): string {
  const ytcfg = (
    window as Window & { ytcfg?: { get?: (key: string) => unknown } }
  ).ytcfg;
  const ytLanguage = ytcfg?.get?.("HL");

  console.log('ytLanguage:', ytLanguage);

  if (typeof ytLanguage === "string" && ytLanguage.trim().length > 0) {
    return ytLanguage;
  }

  const documentLanguage = document.documentElement.lang;
  if (documentLanguage.trim().length > 0) {
    return documentLanguage;
  }

  return navigator.language || "en";
}
