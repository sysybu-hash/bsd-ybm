'use client';

import React, { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, FileSignature } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { useSubscription } from '@/hooks/useSubscription';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

const ContractSignOff = dynamic(() => import('@/components/projects/ContractSignOff'), { ssr: false });

function ContractsSigningRoomInner() {
  const params = useSearchParams();
  const projectId = (params.get('projectId') ?? '').trim();
  const { companyId, companies } = useCompany();
  const { branding } = useSubscription();

  const isClient = useMemo(
    () => Boolean(companyId && companies.some((c) => c.companyId === companyId && c.role === 'client')),
    [companyId, companies]
  );

  return (
    <div className="min-h-full bg-[#FDFDFD] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href={projectId ? `/dashboard/projects/${projectId}` : '/dashboard/projects'}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#001A4D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          {projectId ? 'חזרה לפרויקט' : 'חזרה לפרויקטים'}
        </Link>
      </div>

      <header className="mb-8 flex flex-col items-center justify-center gap-4 text-center sm:mb-12">
        <div className="rounded-[32px] p-3" style={{ backgroundColor: `${MEUHEDET.blue}18` }}>
          <FileSignature className="h-8 w-8" style={{ color: MEUHEDET.blue }} aria-hidden />
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="" className="h-14 max-w-[220px] object-contain" />
          ) : null}
          <h1 className="text-2xl font-black text-[#001A4D] sm:text-3xl">חדר חתימה דיגיטלית</h1>
          <p className="max-w-lg text-sm text-gray-600">
            {isClient
              ? 'אנא קראו את ההסכם, חתמו במרכז המסך ואשרו. המסמך יישמר באופן מאובטח.'
              : 'קישור זה מיועד ללקוחות. מנהלים יכולים לערוך תבנית תחת הגדרות → תבניות חוזה.'}
          </p>
        </div>
      </header>

      {!companyId && (
        <p className="text-center text-sm text-gray-500">בחרו חברה מהמתג כדי להמשיך.</p>
      )}

      {companyId && !projectId && (
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 rounded-[32px] border border-amber-200 bg-amber-50/80 p-6 text-center">
          <p className="text-sm font-bold text-amber-900">חסר מזהה פרויקט בכתובת (projectId).</p>
          <p className="text-xs text-amber-800">לדוגמה: /dashboard/contracts?projectId=YOUR_PROJECT_ID</p>
          <Link
            href="/dashboard/projects"
            className="min-h-12 rounded-[32px] px-8 py-4 text-sm font-black text-white"
            style={{ backgroundColor: MEUHEDET.orange }}
          >
            לרשימת פרויקטים
          </Link>
        </div>
      )}

      {companyId && projectId && (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8">
          <ContractSignOff projectId={projectId} />
        </div>
      )}
    </div>
  );
}

export default function DashboardContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#FDFDFD] p-12 text-sm text-gray-500" dir="rtl">
          טוען…
        </div>
      }
    >
      <ContractsSigningRoomInner />
    </Suspense>
  );
}
