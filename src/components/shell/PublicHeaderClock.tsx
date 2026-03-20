'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Globe2, Wifi, WifiOff } from 'lucide-react';
import { PUBLIC_SITE_URL } from '@/lib/site';
import { BSD_DISPLAY_TIMEZONE } from '@/lib/displayTimezone';
import { formatHebrewDate, todayHolidayTitlesIsrael } from '@/lib/hebrewCalendar';

const STORAGE_HEBREW_PRIMARY = 'bsd-ybm:header-hebrew-date-primary';

export default function PublicHeaderClock() {
  /** Avoid hydration mismatch: server has no Jerusalem wall clock; client ticks after mount. */
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [hebrewPrimary, setHebrewPrimary] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [holidayHint, setHolidayHint] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_HEBREW_PRIMARY);
      setHebrewPrimary(v === '1' || v === 'true');
    } catch {
      setHebrewPrimary(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const titles = todayHolidayTitlesIsrael(now);
    setHolidayHint(titles.length ? titles.slice(0, 2).join(' · ') : '');
  }, [now, mounted]);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const j = await res.json().catch(() => ({}));
        if (!cancelled) setApiOk(res.ok && (j as { ok?: boolean }).ok === true);
      } catch {
        if (!cancelled) setApiOk(false);
      }
    };
    ping();
    const id = window.setInterval(ping, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const toggleHebrewPrimary = useCallback(() => {
    setHebrewPrimary((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_HEBREW_PRIMARY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
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
  const heb = mounted ? formatHebrewDate(now) : '…';

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-2 border-t border-white/10 px-4 py-2 md:flex-row md:justify-between md:gap-4 md:px-8"
      suppressHydrationWarning
    >
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-white/95 sm:text-xs">
        <span
          className="flex min-h-[1.5rem] items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1"
          title={`שעון ירושלים (${BSD_DISPLAY_TIMEZONE}, UTC+2/+3)`}
          suppressHydrationWarning
        >
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span suppressHydrationWarning>{timeStr}</span>
        </span>
        <button
          type="button"
          onClick={toggleHebrewPrimary}
          className="flex min-h-[1.5rem] items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1 transition-colors hover:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          title="החלפת שורת תאריך עברי/לועזי (נשמר במכשיר)"
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {hebrewPrimary ? (
            <span dir="rtl" suppressHydrationWarning>
              {heb}
            </span>
          ) : (
            <span dir="rtl" suppressHydrationWarning>
              {dateStr}
            </span>
          )}
        </button>
        <span
          className="hidden min-h-[1.5rem] items-center justify-center gap-1 rounded-full bg-white/5 px-2 py-1 text-white/80 sm:flex"
          dir="rtl"
          suppressHydrationWarning
        >
          <Globe2 className="h-3 w-3 shrink-0" aria-hidden />
          {hebrewPrimary ? (
            <span className="text-white/70" suppressHydrationWarning>
              {dateStr}
            </span>
          ) : (
            <span className="text-white/70" suppressHydrationWarning>
              {heb}
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {holidayHint ? (
          <span className="max-w-[min(100%,280px)] truncate text-center text-[10px] font-bold text-amber-200" dir="rtl">
            {holidayHint}
          </span>
        ) : null}
        <span
          className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white"
          title={`API: ${PUBLIC_SITE_URL}/api`}
        >
          {apiOk === null ? (
            <>
              <Wifi className="h-3.5 w-3.5 animate-pulse text-white/70" aria-hidden />
              בודק חיבור…
            </>
          ) : apiOk ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
              מערכת מחוברת
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-red-200" aria-hidden />
              תקלת API
            </>
          )}
        </span>
      </div>
    </div>
  );
}
