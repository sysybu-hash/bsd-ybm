'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import type { AppLocale, MessageKey } from '@/i18n/messages';
import { LOCALE_STORAGE_KEY, translate } from '@/i18n/messages';

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: (key: MessageKey) => string;
  dir: 'rtl' | 'ltr';
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectDeviceLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'he';
  const lang = (navigator.language || 'he').toLowerCase();
  return lang.startsWith('he') ? 'he' : 'en';
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: 'he',
      setLocale: () => {},
      t: (key) => translate('he', key),
      dir: 'rtl',
    };
  }
  return ctx;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('he');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    if (stored === 'he' || stored === 'en') {
      setLocaleState(stored);
    } else {
      setLocaleState(detectDeviceLocale());
    }
    setReady(true);
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    }
  }, []);

  const dir: 'rtl' | 'ltr' = locale === 'he' ? 'rtl' : 'ltr';

  useLayoutEffect(() => {
    if (!ready || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.lang = locale === 'he' ? 'he' : 'en';
    root.dir = dir;
    root.setAttribute('data-locale', locale);
  }, [locale, dir, ready]);

  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dir,
    }),
    [locale, setLocale, t, dir]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
