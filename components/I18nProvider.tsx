"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { MessageTree } from "@/lib/i18n/keys";
import { createTranslator, type TFunction } from "@/lib/i18n/translate";
import { type AppLocale, isRtlLocale } from "@/lib/i18n/config";

type I18nContextValue = {
  locale: AppLocale;
  t: TFunction;
  setLocale: (l: AppLocale) => Promise<void>;
  dir: "rtl" | "ltr";
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: MessageTree;
}) {
  const router = useRouter();
  const t = useMemo(() => createTranslator(messages), [messages]);
  const dir: "rtl" | "ltr" = isRtlLocale(locale) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback(async (l: AppLocale) => {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: l }),
    });
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({ locale, t, setLocale, dir }),
    [locale, t, setLocale, dir],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useI18nOptional(): I18nContextValue | null {
  return useContext(I18nContext);
}
