'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, History } from 'lucide-react';
import ImportWizard from '@/components/dashboard/ImportWizard';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';
import { useCompany } from '@/context/CompanyContext';
import { useSubscription } from '@/hooks/useSubscription';

export default function ImportHistoryPage() {
  const { companyId } = useCompany();
  const { hasFeature, plan } = useSubscription();
  const allowed = hasFeature('finance_dashboard');

  return (
    <div className="min-h-full bg-[#F4F5F7] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#001A4D]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          חזרה לדשבורד
        </Link>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center gap-4 text-center">
        <div
          className="flex items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-white p-4 shadow-sm"
          style={{ boxShadow: '0 8px 32px rgba(0,26,77,0.08)' }}
        >
          <div className="rounded-[32px] p-3" style={{ backgroundColor: `${MEUHEDET.blue}18` }}>
            <History className="h-8 w-8" style={{ color: MEUHEDET.blue }} aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black sm:text-3xl" style={{ color: MEUHEDET.blue }}>
              אשף ייבוא היסטוריה
            </h1>
            <p className="mt-1 max-w-lg text-sm text-gray-600">
              העלאה מרוכזת — Gemini 1.5 Pro מחלץ תאריכים וסכומים מחשבוניות / קבלות / גיליונות.
            </p>
          </div>
        </div>
      </header>

      {!allowed && (
        <section className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-gray-700">התוכנית ({plan}) אינה כוללת מודול פיננסי.</p>
        </section>
      )}

      {allowed && !companyId && (
        <p className="text-center text-sm font-bold text-gray-600">בחרו חברה מהמתג כדי להמשיך.</p>
      )}

      {allowed && companyId && <ImportWizard />}
    </div>
  );
}
