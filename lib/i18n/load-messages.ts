import type { MessageTree } from "./keys";
import type { AppLocale } from "./config";
import { normalizeLocale } from "./config";
import en from "@/messages/en.json";
import he from "@/messages/he.json";
import ru from "@/messages/ru.json";
import siteMarketingHe from "@/messages/site-marketing.he.json";
import siteMarketingEn from "@/messages/site-marketing.en.json";
import siteMarketingRu from "@/messages/site-marketing.ru.json";
import marketingHomeHe from "@/messages/marketing-home.he.json";
import marketingHomeEn from "@/messages/marketing-home.en.json";
import marketingHomeRu from "@/messages/marketing-home.ru.json";

const PACKS: Record<AppLocale, MessageTree> = {
  en: en as unknown as MessageTree,
  he: he as unknown as MessageTree,
  ru: ru as unknown as MessageTree,
};

function deepMerge(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a };
  for (const key of Object.keys(b)) {
    const bv = b[key];
    const av = a[key];
    if (
      bv !== null &&
      typeof bv === "object" &&
      !Array.isArray(bv) &&
      av !== null &&
      typeof av === "object" &&
      !Array.isArray(av)
    ) {
      out[key] = deepMerge(av as Record<string, unknown>, bv as Record<string, unknown>);
    } else {
      out[key] = bv;
    }
  }
  return out;
}

/** תוכן שיווק/דף הבית — קבצים נפרדים לכל שפה */
function siteExtras(locale: AppLocale): Record<string, unknown> {
  if (locale === "he") {
    return deepMerge(
      siteMarketingHe as unknown as Record<string, unknown>,
      marketingHomeHe as unknown as Record<string, unknown>,
    );
  }
  if (locale === "ru") {
    return deepMerge(
      siteMarketingRu as unknown as Record<string, unknown>,
      marketingHomeRu as unknown as Record<string, unknown>,
    );
  }
  return deepMerge(
    siteMarketingEn as unknown as Record<string, unknown>,
    marketingHomeEn as unknown as Record<string, unknown>,
  );
}

export function getMessages(locale: string): MessageTree {
  const code = normalizeLocale(locale) as AppLocale;
  const base = PACKS[code] ?? PACKS.en;
  const extra = siteExtras(code);
  return deepMerge(base as unknown as Record<string, unknown>, extra) as MessageTree;
}

export function getMessagesForLocale(locale: AppLocale): MessageTree {
  return getMessages(locale);
}
