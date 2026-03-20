'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import type { AppLocale } from '@/i18n/messages';

export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();

  const pick = (next: AppLocale) => {
    setLocale(next);
  };

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-4 rounded-4xl border border-white/40 bg-white/55 px-4 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 0 24px var(--brand-glow, rgba(0,70,148,0.12))' }}
      role="group"
      aria-label="Language"
    >
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500">
        <Languages className="h-4 w-4" style={{ color: 'var(--brand-primary, #004694)' }} aria-hidden />
        <span>{t('locale.he')} / {t('locale.en')}</span>
      </div>
      <div className="flex w-full max-w-[240px] items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => pick('he')}
          className={`flex min-h-12 flex-1 items-center justify-center rounded-4xl border-2 px-4 text-sm font-black transition-all ${
            locale === 'he'
              ? 'border-[var(--brand-primary,#004694)] text-[var(--brand-primary,#004694)]'
              : 'border-gray-200 text-gray-500'
          }`}
          style={
            locale === 'he'
              ? { boxShadow: '0 0 20px var(--brand-glow, rgba(0,70,148,0.35))' }
              : undefined
          }
        >
          עברית
        </button>
        <button
          type="button"
          onClick={() => pick('en')}
          className={`flex min-h-12 flex-1 items-center justify-center rounded-4xl border-2 px-4 text-sm font-black transition-all ${
            locale === 'en'
              ? 'border-[var(--brand-primary,#004694)] text-[var(--brand-primary,#004694)]'
              : 'border-gray-200 text-gray-500'
          }`}
          style={
            locale === 'en'
              ? { boxShadow: '0 0 20px var(--brand-glow, rgba(0,70,148,0.35))' }
              : undefined
          }
        >
          EN
        </button>
      </div>
    </div>
  );
}
