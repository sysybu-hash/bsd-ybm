import type { MessageTree } from "./keys";
import type { AppLocale } from "./config";
import { normalizeLocale } from "./config";
import en from "@/messages/en.json";
import he from "@/messages/he.json";
import ar from "@/messages/ar.json";
import ru from "@/messages/ru.json";

const PACKS: Record<string, MessageTree> = {
  en: en as MessageTree,
  he: he as MessageTree,
  ar: ar as MessageTree,
  ru: ru as MessageTree,
};

export function getMessages(locale: string): MessageTree {
  const code = normalizeLocale(locale);
  return PACKS[code] ?? (PACKS.en as MessageTree);
}

export function getMessagesForLocale(locale: AppLocale): MessageTree {
  return getMessages(locale);
}
