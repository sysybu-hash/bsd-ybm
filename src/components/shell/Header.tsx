'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, UserRound } from 'lucide-react';
import BsybmLogoMark from '@/components/shell/BsybmLogoMark';
import PublicHeaderClock from '@/components/shell/PublicHeaderClock';

/**
 * Meuhedet-style app bar: logo (RTL right), search + personal area, clock + API status strip.
 */
export default function Header() {
  const router = useRouter();

  return (
    <header
      className="bsd-shell-header flex w-full flex-col items-center justify-center border-b border-white/10 pt-safe"
      style={{ backgroundColor: 'var(--bsd-royal-blue)' }}
    >
      <div className="flex h-[60px] w-full max-w-[1200px] items-center justify-between gap-3 px-4 md:h-[64px] md:gap-6 md:px-8">
        <div className="flex min-w-0 shrink items-center justify-start">
          <BsybmLogoMark />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-4">
          <form
            className="bsd-shell-search flex h-11 max-w-[min(100%,340px)] flex-1 items-center justify-center gap-2 rounded-full border border-white/25 bg-white px-3 shadow-inner md:max-w-[360px] md:px-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const query = String(fd.get('q') ?? '').trim();
              if (query.length >= 2) {
                router.push(`/dashboard/archive-search?q=${encodeURIComponent(query)}`);
              }
            }}
          >
            <Search
              className="h-[18px] w-[18px] shrink-0"
              style={{ color: 'var(--bsd-royal-blue)' }}
              strokeWidth={2.25}
              aria-hidden
            />
            <input
              name="q"
              type="search"
              placeholder="חיפוש בארכיון OCR…"
              className="min-w-0 flex-1 bg-transparent text-right text-[14px] font-semibold outline-none placeholder:font-medium placeholder:text-[#001a4d]/45"
              style={{ color: 'var(--bsd-royal-blue)' }}
              aria-label="חיפוש בארכיון סריקות"
            />
          </form>

          <Link
            href="/login"
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-2 pr-3 transition-colors hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:px-3"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
              aria-hidden
            >
              <UserRound
                className="h-[18px] w-[18px]"
                style={{ color: 'var(--bsd-royal-blue)' }}
                strokeWidth={2.25}
              />
            </span>
            <span className="hidden text-[13px] font-bold text-white sm:inline">אזור אישי</span>
          </Link>
        </div>
      </div>

      <PublicHeaderClock />
    </header>
  );
}
