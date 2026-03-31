/**
 * שפות ממשק רשמיות: עברית, ערבית, אנגלית, רוסית.
 * שפות אחרות בקליטת Accept-Language — נבחרת הראשונה שמתאימה לארבע אלה; אחרת ברירת מחדל en.
 */
export const PRIMARY_UI_LOCALES = ["he", "ar", "en", "ru"] as const;

export type AppLocale = (typeof PRIMARY_UI_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const COOKIE_LOCALE = "bsd-locale";

/** רק ארבע השפות במתג השפה */
export const SELECTABLE_LOCALES: AppLocale[] = [...PRIMARY_UI_LOCALES];

/** @deprecated השתמשו ב־PRIMARY_UI_LOCALES */
export const SUPPORTED_LOCALES = PRIMARY_UI_LOCALES;

/** כיווניות — עברית וערבית RTL */
const RTL = new Set<AppLocale>(["he", "ar"]);

export function isRtlLocale(locale: string): boolean {
  return RTL.has(locale as AppLocale);
}

export function isSupportedLocale(code: string): code is AppLocale {
  return (PRIMARY_UI_LOCALES as readonly string[]).includes(code);
}

export function normalizeLocale(raw: string | undefined | null): AppLocale {
  if (!raw || typeof raw !== "string") return DEFAULT_LOCALE;
  const lower = raw.trim().toLowerCase();
  const base = lower.split("-")[0] ?? lower;
  if (base === "iw") return "he";
  if (isSupportedLocale(base)) return base;
  return DEFAULT_LOCALE;
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  he: "עברית",
  ar: "العربية",
  en: "English",
  ru: "Русский",
};

/** תיאור השפה לשימוש בהנחיות למודל AI (באנגלית) */
export const LOCALE_AI_LANGUAGE_NAMES: Record<AppLocale, string> = {
  he: "Hebrew",
  ar: "Arabic",
  en: "English",
  ru: "Russian",
};
