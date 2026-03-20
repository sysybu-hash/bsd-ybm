'use client';

import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { fetchProjectStatusReportPayload } from '@/services/reports/fetchProjectReportPayload';
import { downloadProjectStatusPdf, downloadExecutiveFinancePdf } from '@/services/reports/PdfGeneratorService';
import type { ExecutiveFinanceReportPayload } from '@/services/reports/types';
import type { ProjectHealthRow } from '@/hooks/useCompanyFinancials';
import { useSubscription } from '@/hooks/useSubscription';

const ORANGE = '#FF8C00';
const ORANGE_GLOW = '0 0 24px rgba(255, 140, 0, 0.5), 0 0 12px rgba(255, 140, 0, 0.35)';

const finalizeBtnClass =
  'flex min-h-12 w-full max-w-md items-center justify-center gap-3 rounded-4xl border-4 bg-[#FDFDFD] px-6 py-3 text-center text-sm font-black transition-transform active:scale-[0.99] disabled:opacity-50 sm:max-w-lg';

/** Client-only PDF exports — loaded via `next/dynamic({ ssr: false })` to avoid jspdf/fflate in SSR. */
export function ProjectGenerateReportButton({
  companyId,
  projectId,
}: {
  companyId: string;
  projectId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const payload = await fetchProjectStatusReportPayload(companyId, projectId);
      await downloadProjectStatusPdf(payload, 'jb-project-status');
      setMessage('הקובץ הורד (PDF).');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'ייצוא נכשל');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 px-safe pt-safe">
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className={finalizeBtnClass}
        style={{ borderColor: ORANGE, color: '#004694', boxShadow: ORANGE_GLOW }}
      >
        <FileDown className="h-5 w-5 shrink-0" aria-hidden />
        {busy ? 'מייצא דוח…' : 'הפק דוח סטטוס (PDF)'}
      </button>
      {message && <p className="text-center text-xs text-gray-600">{message}</p>}
    </div>
  );
}

export function ExecutiveGenerateReportButton({
  companyId,
  revenue,
  expenses,
  netProfit,
  projects,
  loading,
}: {
  companyId: string | null;
  revenue: number;
  expenses: number;
  netProfit: number;
  projects: ProjectHealthRow[];
  loading: boolean;
}) {
  const { branding } = useSubscription();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    if (!companyId) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload: ExecutiveFinanceReportPayload = {
        generatedAtIso: new Date().toISOString(),
        companyId,
        revenue,
        expenses,
        netProfit,
        projects: projects.map((r) => ({
          id: r.id,
          name: r.name,
          budgeted: r.budgeted,
          actual: r.actual,
        })),
        headerLogoUrl: branding.logoUrl ?? null,
      };
      await downloadExecutiveFinancePdf(payload, 'jb-executive-finance');
      setMessage('הקובץ הורד (PDF).');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'ייצוא נכשל');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <button
        type="button"
        disabled={busy || loading || !companyId}
        onClick={() => void run()}
        className={finalizeBtnClass}
        style={{ borderColor: ORANGE, color: '#004694', boxShadow: ORANGE_GLOW }}
      >
        <FileDown className="h-5 w-5 shrink-0" aria-hidden />
        {busy ? 'מייצא דוח…' : 'הפק דוח מנהלים (PDF)'}
      </button>
      {message && <p className="text-center text-xs text-gray-600">{message}</p>}
    </div>
  );
}
