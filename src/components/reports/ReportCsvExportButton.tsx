'use client';

import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { downloadFinancesPlCsv } from '@/services/reports/financesCsvExport';

const ORANGE = '#FF8C00';
const ORANGE_GLOW = '0 0 24px rgba(255, 140, 0, 0.5), 0 0 12px rgba(255, 140, 0, 0.35)';

const finalizeBtnClass =
  'flex min-h-12 w-full max-w-md items-center justify-center gap-3 rounded-4xl border-4 bg-[#FDFDFD] px-6 py-3 text-center text-sm font-black transition-transform active:scale-[0.99] disabled:opacity-50 sm:max-w-lg';

export function FinancesPlCsvExportButton({ companyId }: { companyId: string | null }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    if (!companyId) return;
    setBusy(true);
    setMessage(null);
    try {
      await downloadFinancesPlCsv(companyId);
      setMessage('קובץ CSV הורד.');
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
        disabled={busy || !companyId}
        onClick={() => void run()}
        className={finalizeBtnClass}
        style={{ borderColor: ORANGE, color: '#004694', boxShadow: ORANGE_GLOW }}
      >
        <FileSpreadsheet className="h-5 w-5 shrink-0" aria-hidden />
        {busy ? 'מייצא…' : 'ייצוא דו"ח רווח והפסד (CSV)'}
      </button>
      {message && <p className="text-center text-xs text-gray-600">{message}</p>}
    </div>
  );
}
