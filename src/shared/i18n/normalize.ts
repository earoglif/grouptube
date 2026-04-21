export function normalizeLanguage(language: string): "ru" | "en" {
  return language.toLowerCase().startsWith("ru") ? "ru" : "en";
}
