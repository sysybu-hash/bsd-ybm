'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCompanyFinancials } from '@/hooks/useCompanyFinancials';
import ExecutiveFinancialCards from '@/components/finance/ExecutiveFinancialCards';
import ProjectHealthChart from '@/components/finance/ProjectHealthChart';
import { FinancesPlCsvExportButton } from '@/components/reports/ReportCsvExportButton';

const ExecutiveGenerateReportButton = dynamic(
  () => import('@/components/reports/ReportPdfButtons').then((m) => m.ExecutiveGenerateReportButton),
  {
    ssr: false,
    loading: () => (
      <p className="w-full max-w-3xl py-6 text-center text-sm text-gray-500" dir="rtl">
        טוען ייצוא PDF…
      </p>
    ),
  }
);
import FinanceExportMapperPanel from '@/components/finance/FinanceExportMapperPanel';
import { useSubscription } from '@/hooks/useSubscription';
import { useSectorUi } from '@/hooks/useSectorUi';
import { useLocale } from '@/context/LocaleContext';
import FinanceOpsLights from '@/components/finance/FinanceOpsLights';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

export default function FinancePage() {
  const { companyId, revenue, expenses, netProfit, projects, allProjects, loading } = useCompanyFinancials();
  const { hasFeature, plan, branding } = useSubscription();
  const { moduleEnabled } = useSectorUi();
  const { dir } = useLocale();
  const tenantLabel = branding.displayName?.trim() || 'BSD-YBM';
  const canFinance = hasFeature('finance_dashboard');
  const canReports = hasFeature('reports');

  return (
    <div className="min-h-full bg-[#F4F5F7] p-6 pb-12 pt-safe px-safe" dir={dir}>
      <motion.header
        className="mb-8 flex flex-col items-center justify-center gap-4 text-center sm:mb-12"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      >
        <div
          className="flex items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-white p-4"
          style={{ boxShadow: `0 8px 32px rgba(0,26,77,0.1)` }}
        >
          <div
            className="rounded-[32px] p-3"
            style={{ backgroundColor: `${MEUHEDET.blue}18` }}
          >
            <Wallet className="h-8 w-8" style={{ color: MEUHEDET.blue }} aria-hidden />
          </div>
          <div className="text-center">
            <h1
              className="text-2xl font-black text-[#1a1a1a] sm:text-3xl"
              style={{ color: MEUHEDET.blue }}
            >
              לוח פיננסי מנהלים — {tenantLabel}
            </h1>
            <p className="mt-1 text-sm text-gray-500">P&amp;L בזמן אמת לפי החברה הנבחרת במתג</p>
          </div>
        </div>
      </motion.header>

      {!canFinance && (
        <section className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-8 text-center">
          <p className="text-sm font-bold text-gray-700">התוכנית הנוכחית ({plan}) אינה כוללת לוח פיננסי.</p>
          <p className="text-xs text-gray-500">שדרגו ל־Pro או Alloy כדי לפתוח P&amp;L, דוחות וגרפים.</p>
        </section>
      )}

      {canFinance && (
        <>
          <section className="mx-auto flex max-w-6xl flex-col items-center gap-4">
            {canReports && (
              <div className="flex w-full flex-col items-center justify-center gap-4">
                <ExecutiveGenerateReportButton
                  companyId={companyId}
                  revenue={revenue}
                  expenses={expenses}
                  netProfit={netProfit}
                  projects={allProjects}
                  loading={loading}
                />
                <FinancesPlCsvExportButton companyId={companyId} />
                <FinanceExportMapperPanel companyId={companyId} />
              </div>
            )}
            <ExecutiveFinancialCards
              revenue={revenue}
              expenses={expenses}
              netProfit={netProfit}
              loading={loading}
              companyId={companyId}
            />
            <FinanceOpsLights allProjects={allProjects} />
          </section>

          {moduleEnabled('showProjectHealthChart') && (
            <section className="mx-auto mt-8 flex max-w-6xl flex-col items-center gap-4 p-6">
              <ProjectHealthChart rows={projects} loading={loading} companyId={companyId} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
