'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { DEFAULT_GLOBAL_BRAND_LOGO, GOLDEN_HELIX_LOGO_SVG } from '@/lib/brandingAssets';
import { LEGAL_BRAND_NAME } from '@/lib/site';

const CONTACT_MAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'sysybu@gmail.com').trim();

function JerusalemClockThin() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timeStr = mounted
    ? now.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jerusalem',
      })
    : '—:—:—';
  const dateStr = mounted
    ? now.toLocaleDateString('he-IL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jerusalem',
      })
    : '…';

  return (
    <div
      className="flex flex-col items-center justify-center gap-1 text-end"
      suppressHydrationWarning
      dir="rtl"
    >
      <span className="text-xs font-extralight tracking-wide text-[#d4c896]/95" suppressHydrationWarning>
        {timeStr}
      </span>
      <span className="text-[10px] font-extralight tracking-wider text-[#8a9aaa]/90" suppressHydrationWarning>
        {dateStr}
      </span>
      <span className="text-[9px] font-extralight uppercase tracking-[0.2em] text-[#6b7a8c]/80">
        ירושלים
      </span>
    </div>
  );
}

export default function LuxuryLandingPage({ showroomMode = false }: { showroomMode?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { isCompanyAdmin, isGlobalStaff } = useCompany();
  const isPlatformAdmin = usePlatformAdmin();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState(DEFAULT_GLOBAL_BRAND_LOGO);
  const [globalAccent, setGlobalAccent] = useState<{ primary: string; secondary: string } | null>(null);

  const isAdminUser = Boolean(user && (isCompanyAdmin || isGlobalStaff || isPlatformAdmin));

  const enterHref = !authLoading && user ? '/dashboard' : '/login';

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="empire-landing-engine relative min-h-dvh w-full overflow-hidden" dir="rtl">
      <div className="empire-landing-helix pointer-events-none" aria-hidden />
      <div className="empire-landing-glows pointer-events-none" aria-hidden />

      {/* Physical top-left: menu */}
      {/* Physical corners: hamburger top-left, clock top-right (independent of RTL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-6 pt-safe px-safe">
        <div className="relative min-h-12 w-full">
          <div className="pointer-events-auto absolute left-0 top-0">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-12 w-12 items-center justify-center rounded-4xl border border-[#c9a227]/25 bg-[#00050a]/80 text-[#e8dcc4] shadow-[0_0_24px_rgba(201,162,39,0.12)] backdrop-blur-sm transition-opacity hover:border-[#c9a227]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227]"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'סגור תפריט' : 'תפריט'}
            >
              {menuOpen ? <X className="h-5 w-5" strokeWidth={1.25} /> : <Menu className="h-5 w-5" strokeWidth={1.25} />}
            </button>
          </div>
          <div className="pointer-events-auto absolute right-0 top-0">
            <JerusalemClockThin />
          </div>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="סגור רקע"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={closeMenu}
          />
          <nav
            className="fixed left-6 top-24 z-50 flex min-w-[200px] flex-col items-center justify-center gap-4 rounded-4xl border border-[#c9a227]/20 bg-[#000814]/95 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-md"
            aria-label="ניווט"
          >
            <Link
              href="/login"
              onClick={closeMenu}
              className="flex min-h-12 w-full items-center justify-center rounded-4xl border border-[#c9a227]/30 px-8 py-3 text-sm font-light tracking-wide text-[#f5ecd8] transition-colors hover:bg-[#c9a227]/10"
            >
              כניסה
            </Link>
            <a
              href={`mailto:${CONTACT_MAIL}`}
              onClick={closeMenu}
              className="flex min-h-12 w-full items-center justify-center rounded-4xl border border-[#c9a227]/30 px-8 py-3 text-sm font-light tracking-wide text-[#f5ecd8] transition-colors hover:bg-[#c9a227]/10"
            >
              יצירת קשר
            </a>
          </nav>
        </>
      )}

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-8 px-6 pb-32 pt-28">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-4xl border border-[#c9a227]/35 bg-[#000814]/60 p-6 shadow-[0_0_48px_rgba(201,162,39,0.18)] backdrop-blur-sm sm:h-44 sm:w-44">
            <Image
              src={logoSrc}
              alt=""
              width={160}
              height={160}
              className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(201,162,39,0.45)]"
              priority
              unoptimized={logoSrc.endsWith('.svg')}
              onError={() => setLogoSrc(GOLDEN_HELIX_LOGO_SVG)}
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-2xl font-extralight tracking-[0.12em] text-[#f0e6c8] sm:text-3xl md:text-4xl">
              {LEGAL_BRAND_NAME}
            </h1>
            <p className="max-w-md text-center text-xs font-extralight leading-relaxed tracking-wide text-[#8a9aaa] sm:text-sm">
              יוחנן בוקשפן · BSD-YBM AI Solutions
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center justify-center gap-4">
          <Link
            href={enterHref}
            className="btn-enter-empire relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-4xl px-12 py-4 text-center text-sm font-light tracking-[0.25em] text-[#1a1408] shadow-[0_12px_40px_rgba(201,162,39,0.25)] transition-transform active:scale-[0.99]"
            style={
              globalAccent
                ? {
                    boxShadow: `0 12px 40px color-mix(in srgb, ${globalAccent.secondary} 35%, transparent)`,
                  }
                : undefined
            }
          >
            <span className="relative z-10 tracking-[0.35em]">ENTER SYSTEM</span>
          </Link>
          {showroomMode ? (
            <span className="text-center text-[10px] font-extralight tracking-widest text-[#5c6b7c]">
              מצב תצוגה
            </span>
          ) : null}
        </div>
      </div>

      {isAdminUser ? (
        <Link
          href="/dashboard"
          className="fixed bottom-8 left-1/2 z-30 flex min-h-12 -translate-x-1/2 items-center justify-center rounded-4xl border border-[#c9a227]/35 bg-[#000814]/90 px-8 py-3 text-xs font-light tracking-wide text-[#e8dcc4] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors hover:border-[#c9a227]/55 hover:text-[#fff8e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227]"
        >
          חזרה לניהול המערכת
        </Link>
      ) : null}
    </div>
  );
}
