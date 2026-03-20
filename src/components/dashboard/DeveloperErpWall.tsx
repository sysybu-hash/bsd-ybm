'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

/** Shown when `developer` role must not access live ERP / tenant operations data. */
export default function DeveloperErpWall() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-[#FDFDFD] p-6 text-center"
      dir="rtl"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-4xl border border-amber-200 bg-amber-50 text-amber-700">
        <Shield className="h-8 w-8" aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-black text-[#001A4D]">גישה לנתוני לקוחות — חסומה</h1>
        <p className="text-sm text-gray-600">
          למפתחי מערכת יש גישה לכלי ארכיטקטורה ודיבוג בלבד. נתוני ERP חיים (כספים, פרויקטים, צוות וכו׳) אינם
          זמינים לתפקיד זה.
        </p>
      </div>
      <Link
        href="/dashboard/developer"
        className="flex min-h-12 items-center justify-center rounded-4xl bg-[#004694] px-8 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
      >
        לפאנל המפתח
      </Link>
    </div>
  );
}
