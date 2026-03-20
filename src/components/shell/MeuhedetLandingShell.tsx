'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Header from '@/components/shell/Header';
import MainHeading from '@/components/shell/MainHeading';
import ActionPanel from '@/components/shell/ActionPanel';
import GanttChartPreview from '@/components/shell/GanttChartPreview';
import StatusBar from '@/components/shell/StatusBar';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';
import { PLATFORM_BRANDING } from '@/lib/platformOwners';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useLocale } from '@/context/LocaleContext';

const ORANGE = MEUHEDET.orange;

export default function MeuhedetLandingShell({ showroomMode = false }: { showroomMode?: boolean }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { isCompanyAdmin, isGlobalStaff } = useCompany();
  const { t } = useLocale();

  const showReturnToDashboard =
    showroomMode && Boolean(user) && (isCompanyAdmin || isGlobalStaff);

  return (
    <div
      className="flex min-h-dvh flex-col font-[family-name:var(--font-heebo),var(--font-assistant),Assistant,sans-serif]"
      dir="rtl"
    >
      <div className="fixed right-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-[60] sm:right-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-opacity active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-14 sm:w-14"
          style={{ backgroundColor: ORANGE }}
          aria-label="פתח תפריט"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="סגור תפריט"
            className="fixed inset-0 z-[55] bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-[56] flex h-full w-[min(100vw-2rem,18rem)] max-w-[288px] flex-col rounded-l-[32px] bg-white p-6 pt-safe shadow-xl sm:p-6">
            <nav className="mt-[4.5rem] flex flex-col gap-4 text-base font-bold text-[#001A4D] sm:mt-24 sm:text-lg">
              {[
                ['דף הבית', '/'],
                ['כניסה', '/login'],
                ['בקשת גישה', '/register'],
                ['ניסיון (Demo)', '/trial'],
                ['דשבורד', '/dashboard'],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="min-h-12 rounded-full py-3 text-center transition-colors hover:text-[#FF7F00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A3A1]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}

      <Header />
      <MainHeading />

      <main
        className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-12 sm:pb-[calc(6rem+env(safe-area-inset-bottom))]"
        style={{ backgroundColor: 'var(--bsd-content-bg)' }}
      >
        <ActionPanel />
        <div className="w-full max-w-[1040px]">
          <GanttChartPreview />
        </div>

        <footer className="m-12 max-w-2xl px-6 text-center text-[11px] font-medium text-[#001a4d]/55">
          © {PLATFORM_BRANDING.legalName} · {PLATFORM_BRANDING.chairman} ·{' '}
          <a
            href={PLATFORM_BRANDING.website}
            className="font-bold text-[#001a4d] underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {PLATFORM_BRANDING.websiteDisplay}
          </a>
        </footer>
      </main>

      <StatusBar />

      {showReturnToDashboard ? (
        <div
          className="fixed z-[65] max-w-[min(calc(100vw-2rem),22rem)]"
          style={{
            bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
            right: 'calc(1.5rem + env(safe-area-inset-right))',
          }}
        >
          <Link
            href="/dashboard"
            className="empire-shimmer-gold btn-primary-empire flex min-h-12 w-full items-center justify-center rounded-[32px] px-6 py-4 text-center text-sm font-black text-white shadow-lg transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
          >
            {t('landing.returnToDashboard')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
