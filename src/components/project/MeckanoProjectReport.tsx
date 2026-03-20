'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type ReportRow = {
  meckanoUserId: string;
  employeeName: string;
  workDate: string;
  totalHours: number;
  projectOrDept: string;
  projectId: string | null;
  calculatedCost: number;
  hourlyRate: number;
};

type ByDate = Record<string, { distinctWorkers: number; workerIds: string[] }>;

type Props = {
  companyId: string;
  projectId: string;
};

/**
 * Project-scoped Meckano attendance: workers on-site per date + labor table (name, date, hours, department, cost).
 */
export default function MeckanoProjectReport({ companyId, projectId }: Props) {
  const { user } = useAuth();
  const { t, dir } = useLocale();

  const defaults = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toIsoDate(start), to: toIsoDate(today) };
  }, []);

  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [byDate, setByDate] = useState<ByDate>({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const loadReport = useCallback(async () => {
    setBanner(null);
    if (!user) {
      setBanner({ kind: 'err', text: t('meckano.report.signIn') });
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const q = new URLSearchParams({
        companyId,
        projectId,
        from,
        to,
      });
      const res = await fetch(`/api/meckano/report?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows([]);
        setByDate({});
        setBanner({ kind: 'err', text: (data.error as string) || t('meckano.report.error') });
        return;
      }
      setRows((data.rows as ReportRow[]) ?? []);
      setByDate((data.byDate as ByDate) ?? {});
    } catch {
      setRows([]);
      setByDate({});
      setBanner({ kind: 'err', text: t('meckano.report.error') });
    } finally {
      setLoading(false);
    }
  }, [companyId, projectId, from, to, user, t]);

  const syncToPl = useCallback(async () => {
    setBanner(null);
    if (!user) {
      setBanner({ kind: 'err', text: t('meckano.report.signIn') });
      return;
    }
    setSyncing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/meckano/sync-pl', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId, projectId, from, to }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setBanner({ kind: 'err', text: t('meckano.report.syncForbidden') });
        return;
      }
      if (!res.ok) {
        setBanner({ kind: 'err', text: (data.error as string) || t('meckano.report.syncErr') });
        return;
      }
      setBanner({
        kind: 'ok',
        text: `${t('meckano.report.syncOk')} (${data.financeLinesWritten ?? 0} lines)`,
      });
    } catch {
      setBanner({ kind: 'err', text: t('meckano.report.syncErr') });
    } finally {
      setSyncing(false);
    }
  }, [companyId, projectId, from, to, user, t]);

  const sortedDates = useMemo(() => Object.keys(byDate).sort(), [byDate]);

  return (
    <section
      className="flex w-full max-w-4xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-[#FDFDFD] p-6"
      dir={dir}
      aria-labelledby="meckano-project-report-heading"
    >
      <div className="flex w-full flex-col items-center justify-center gap-2 text-center">
        <h2 id="meckano-project-report-heading" className="text-lg font-black text-[#1a1a1a]">
          {t('meckano.report.title')}
        </h2>
        <p className="text-sm text-gray-500">{t('meckano.report.subtitle')}</p>
      </div>

      {banner && (
        <p
          className={`w-full rounded-[32px] px-4 py-3 text-center text-sm font-semibold ${
            banner.kind === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
          role="status"
        >
          {banner.text}
        </p>
      )}

      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
        <label className="flex flex-col items-center justify-center gap-2 text-sm font-semibold text-gray-600">
          {t('meckano.report.from')}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="min-h-11 rounded-[32px] border border-gray-200 bg-white px-4 py-2 text-center text-[#1a1a1a]"
          />
        </label>
        <label className="flex flex-col items-center justify-center gap-2 text-sm font-semibold text-gray-600">
          {t('meckano.report.to')}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="min-h-11 rounded-[32px] border border-gray-200 bg-white px-4 py-2 text-center text-[#1a1a1a]"
          />
        </label>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => void loadReport()}
          disabled={loading || !user}
          className="inline-flex min-h-11 min-w-[160px] items-center justify-center rounded-[32px] px-6 text-sm font-bold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-primary, #004694)' }}
        >
          {loading ? t('meckano.report.loading') : t('meckano.report.load')}
        </button>
        <button
          type="button"
          onClick={() => void syncToPl()}
          disabled={syncing || !user}
          className="inline-flex min-h-11 min-w-[160px] items-center justify-center rounded-[32px] border-2 border-[#1a1a1a] bg-white px-6 text-sm font-bold text-[#1a1a1a] transition-opacity disabled:opacity-50"
        >
          {syncing ? t('meckano.report.loading') : t('meckano.report.syncPl')}
        </button>
      </div>

      {sortedDates.length > 0 && (
        <div className="w-full">
          <h3 className="mb-4 text-center text-sm font-bold text-gray-700">
            {t('meckano.report.workersByDate')}
          </h3>
          <ul className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
            {sortedDates.map((d) => (
              <li
                key={d}
                className="flex min-w-[140px] flex-col items-center justify-center gap-2 rounded-[32px] border border-gray-100 bg-white px-6 py-4 text-center"
              >
                <span className="text-xs font-semibold text-gray-500">{d}</span>
                <span className="text-2xl font-black text-[#1a1a1a]" aria-label={`${byDate[d]?.distinctWorkers ?? 0}`}>
                  {byDate[d]?.distinctWorkers ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-[32px] border border-gray-100">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-center">
              <th className="p-4 font-bold text-gray-700">{t('meckano.report.employee')}</th>
              <th className="p-4 font-bold text-gray-700">{t('meckano.report.date')}</th>
              <th className="p-4 font-bold text-gray-700">{t('meckano.report.hours')}</th>
              <th className="p-4 font-bold text-gray-700">{t('meckano.report.projectDept')}</th>
              <th className="p-4 font-bold text-gray-700">{t('meckano.report.cost')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  {t('meckano.report.empty')}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.meckanoUserId}-${r.workDate}-${i}`} className="border-t border-gray-100 text-center">
                  <td className="p-4 font-medium text-[#1a1a1a]">{r.employeeName}</td>
                  <td className="p-4 text-gray-600">{r.workDate}</td>
                  <td className="p-4 text-gray-600">{r.totalHours}</td>
                  <td className="p-4 text-gray-600">{r.projectOrDept}</td>
                  <td className="p-4 font-semibold text-[#1a1a1a]">
                    {r.calculatedCost} {t('meckano.report.currency')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
