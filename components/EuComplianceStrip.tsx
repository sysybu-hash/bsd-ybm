"use client";

import Link from "next/link";
import { BadgeCheck, Shield } from "lucide-react";
import { openCookieSettingsFromUi } from "@/lib/cookie-consent";

export default function EuComplianceStrip() {
  return (
    <section
      className="relative z-10 border-y border-blue-100 bg-gradient-to-l from-blue-50/90 via-white to-indigo-50/80"
      aria-labelledby="eu-strip-heading"
    >
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md shadow-blue-500/10 ring-1 ring-blue-100">
              <Shield className="text-[var(--primary-color)]" size={28} aria-hidden />
            </div>
            <div>
              <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                <BadgeCheck size={14} aria-hidden />
                מוכנות תקינה אירופית
              </p>
              <h2 id="eu-strip-heading" className="text-xl font-black text-slate-900 md:text-2xl">
                פרטיות, שקיפות והתאמה למסגרת GDPR
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                BSD-YBM מיועדת לעמוד בעקרונות הגנת המידע האירופיים (GDPR) ובדרישות ePrivacy לגבי
                עוגיות. מוצגים כאן מסמכים משפטיים, ניהול הסכמה לעוגיות וזכויות נושאי מידע — יש להשלים
                ניסוח סופי מול יועץ משפטי לפני הסתמכות עסקית.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
            <Link
              href="/legal/gdpr"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary-color)] px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:opacity-95"
            >
              הצהרת GDPR
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              מדיניות פרטיות
            </Link>
            <button
              type="button"
              onClick={() => openCookieSettingsFromUi()}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50/80 px-5 py-3 text-center text-sm font-bold text-blue-900 transition hover:bg-blue-100"
            >
              הגדרות עוגיות
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
