'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Star, Users } from 'lucide-react';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

/**
 * Bottom dock (image_10-style): fixed, rounded top “slab”, three columns, icon + caption.
 */
export default function StatusBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
      <nav
        className="pointer-events-auto flex w-full max-w-lg items-stretch justify-center overflow-hidden rounded-t-[32px] border border-b-0 border-white/70 bg-white/95 shadow-[0_-10px_40px_rgba(0,26,77,0.18)] backdrop-blur-md sm:max-w-2xl"
        aria-label="שורת סטטוס תחתונה"
        style={{ boxShadow: '0 -12px 40px rgba(0, 26, 77, 0.16)' }}
      >
        <Link
          href="/scan"
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 border-l border-gray-100 py-2 transition-colors hover:bg-gray-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--bsd-accent-orange)]"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
            style={{ backgroundColor: MEUHEDET.blue }}
          >
            <Building2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
          <span className="px-1 text-center text-[10px] font-bold leading-tight text-[#001a4d] sm:text-[11px]">
            סריקת גרמושקה
          </span>
        </Link>

        <Link
          href="/dashboard/team"
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 border-l border-gray-100 py-2 transition-colors hover:bg-gray-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--bsd-accent-orange)]"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
            style={{ backgroundColor: MEUHEDET.orange }}
          >
            <Users className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
          <span className="px-1 text-center text-[10px] font-bold leading-tight text-[#001a4d] sm:text-[11px]">
            Meckano Module
          </span>
        </Link>

        <Link
          href="/dashboard/finance"
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors hover:bg-gray-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--bsd-accent-teal)]"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
            style={{ backgroundColor: MEUHEDET.teal }}
          >
            <Star className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
          <span className="px-1 text-center text-[10px] font-bold leading-tight text-[#001a4d] sm:text-[11px]">
            VIP Status
          </span>
        </Link>
      </nav>
    </div>
  );
}
