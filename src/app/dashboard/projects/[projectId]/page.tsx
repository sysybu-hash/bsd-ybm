'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, HardHat } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import ProjectHistoryLog from '@/components/projects/ProjectHistoryLog';
import ProjectMilestones from '@/components/project/ProjectMilestones';
import ProjectStaffComposer from '@/components/project/ProjectStaffComposer';
import { useSubscription } from '@/hooks/useSubscription';
import { useSectorUi } from '@/hooks/useSectorUi';
import { useLocale } from '@/context/LocaleContext';
import MeckanoProjectReport from '@/components/project/MeckanoProjectReport';
import ProjectBoqDraftsPanel from '@/components/projects/ProjectBoqDraftsPanel';
import { ProjectContractBadge } from '@/components/projects/ProjectContractBadge';

const ContractSignOff = dynamic(() => import('@/components/projects/ContractSignOff'), {
  ssr: false,
  loading: () => (
    <p className="w-full max-w-3xl py-6 text-center text-sm text-gray-500" dir="rtl">
      טוען חתימה…
    </p>
  ),
});

const QuoteGenerator = dynamic(() => import('@/components/quotes/QuoteGenerator'), {
  ssr: false,
  loading: () => (
    <p className="w-full max-w-3xl py-6 text-center text-sm text-gray-500" dir="rtl">
      טוען הצעות מחיר…
    </p>
  ),
});

const ProjectGenerateReportButton = dynamic(
  () => import('@/components/reports/ReportPdfButtons').then((m) => m.ProjectGenerateReportButton),
  {
    ssr: false,
    loading: () => (
      <p className="w-full max-w-3xl py-6 text-center text-sm text-gray-500" dir="rtl">
        טוען ייצוא PDF…
      </p>
    ),
  }
);

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = typeof params?.projectId === 'string' ? params.projectId : '';
  const { companyId } = useCompany();
  const { hasFeature, meckanoModuleEnabled } = useSubscription();
  const { terminology, moduleEnabled } = useSectorUi();
  const { dir, locale } = useLocale();

  const entityTitle = terminology('entitySingular');
  const backLabel =
    locale === 'he' ? `חזרה ל${terminology('entityPlural')}` : `Back to ${terminology('entityPlural')}`;

  return (
    <div className="min-h-full bg-[#FDFDFD] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12" dir={dir}>
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard/projects"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>

      <header className="mb-8 flex flex-col items-center justify-center gap-3 text-center sm:mb-12">
        <div
          className="rounded-[32px] p-3"
          style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary, #004694) 12%, white)' }}
        >
          <HardHat className="h-8 w-8" style={{ color: 'var(--brand-primary, #004694)' }} aria-hidden />
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl" style={{ color: 'var(--brand-primary, #004694)' }}>
              {entityTitle}
            </h1>
            {projectId ? <ProjectContractBadge projectId={projectId} /> : null}
          </div>
          <p className="mt-1 font-mono text-sm text-gray-500">{projectId || '—'}</p>
        </div>
      </header>

      {!companyId && (
        <p className="text-center text-gray-500">בחר חברה מהמתג כדי לראות את יומן הפרויקט.</p>
      )}

      {companyId && projectId && (
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8">
          {hasFeature('reports') && (
            <ProjectGenerateReportButton companyId={companyId} projectId={projectId} />
          )}
          {moduleEnabled('showMilestones') && (
            <ProjectMilestones companyId={companyId} projectId={projectId} />
          )}
          {moduleEnabled('showLeaseTracking') && (
            <section className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-[#FDFDFD] p-6 text-center">
              <h2 className="text-lg font-black text-[#1a1a1a]">
                {locale === 'he' ? 'מעקב חכירות / שכירות' : 'Lease tracking'}
              </h2>
              <p className="text-sm text-gray-500">
                {locale === 'he'
                  ? 'מודול בהרחבה — קישור חכירות לנכס זה.'
                  : 'Coming soon — tie leases to this asset.'}
              </p>
            </section>
          )}
          {meckanoModuleEnabled && (
            <MeckanoProjectReport companyId={companyId} projectId={projectId} />
          )}
          <ContractSignOff projectId={projectId} />
          <QuoteGenerator projectId={projectId} />
          <ProjectBoqDraftsPanel companyId={companyId} projectId={projectId} />
          <ProjectStaffComposer companyId={companyId} projectId={projectId} />
          <ProjectHistoryLog companyId={companyId} projectId={projectId} />
        </div>
      )}
    </div>
  );
}
