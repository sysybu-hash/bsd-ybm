'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, LayoutDashboard } from 'lucide-react';

/** Minimal home for `developer` role — no live tenant aggregates. */
export default function DeveloperDashboardLite() {
  return (
    <div className="min-h-full bg-[#FFFFFF] p-6 pb-12 pt-safe px-safe sm:p-8 md:p-12" dir="rtl">
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-8 rounded-4xl border border-gray-200 bg-[#FDFDFD] p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-4xl bg-[#004694]/10 text-[#004694]">
          <LayoutDashboard className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#1a1a1a]">מצב מפתח</h1>
          <p className="text-sm text-gray-600">
            דשבורד ארגוני מלא אינו זמין לתפקיד מפתח. השתמשו בפאנל המפתח לניהול הרשאות, תורים והדגמות טכניות.
          </p>
        </div>
        <Link
          href="/dashboard/developer"
          className="flex min-h-12 w-full max-w-xs items-center justify-center gap-3 rounded-4xl bg-[#004694] px-6 py-4 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <Shield className="h-5 w-5" aria-hidden />
          פאנל מפתח מערכת
        </Link>
      </div>
    </div>
  );
}
