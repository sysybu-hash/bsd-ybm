'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import Dashboard4Lights, { type FleetLight } from '@/components/shell/Dashboard4Lights';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

type TenantRow = {
  companyId: string;
  displayName: string;
  netProfitAggregate: number;
  meckanoActive: boolean;
  whatsappIngestActive: boolean;
  projectRows: { id: string; name: string; budgeted: number; actual: number; netProfit: number }[];
};

type AnomalyRow = {
  id: string;
  companyId: string;
  companyLabel: string;
  message: string;
  discrepancyPct: number;
  projectId: string;
  createdAt: string | null;
};

const DEMO_LIGHTS: FleetLight[] = [
  { id: 'sync', label: 'סנכרון ענן', state: 'green', detail: 'כל הדיירים' },
  { id: 'security', label: 'אבטחה / Vault', state: 'amber', detail: 'בדיקת מפתחות' },
  { id: 'vision', label: 'Gramoshka Vision', state: 'green', detail: 'מנוע תכניות' },
  { id: 'meckano', label: 'Meckano', state: 'off', detail: 'מודולרי לפי דייר' },
];

export default function FleetDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isGlobalStaff, isMasterAdmin, loading } = useCompany();
  const [dataBusy, setDataBusy] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRow[]>([]);
  const [toggleBusy, setToggleBusy] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isGlobalStaff) {
      router.replace('/dashboard');
    }
  }, [isGlobalStaff, loading, router]);

  const loadFleet = useCallback(async () => {
    if (!user || !isMasterAdmin) return;
    setDataBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/fleet-pro', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.tenants) {
        setTenants(json.tenants as TenantRow[]);
        setAnomalies((json.anomalies as AnomalyRow[]) ?? []);
      }
    } finally {
      setDataBusy(false);
    }
  }, [user, isMasterAdmin]);

  useEffect(() => {
    void loadFleet();
  }, [loadFleet]);

  const patchTenant = async (
    companyId: string,
    patch: { meckanoActive?: boolean; whatsappIngestActive?: boolean }
  ) => {
    if (!user || !isMasterAdmin) return;
    setToggleBusy(companyId);
    try {
      const token = await user.getIdToken();
      await fetch('/api/admin/tenant-modules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId, ...patch }),
      });
      await loadFleet();
    } finally {
      setToggleBusy(null);
    }
  };

  if (loading || !isGlobalStaff) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-12 text-gray-500" dir="rtl">
        טוען…
      </div>
    );
  }

  const chartData = tenants
    .map((t) => ({
      name: t.displayName.slice(0, 14) + (t.displayName.length > 14 ? '…' : ''),
      profit: t.netProfitAggregate,
      id: t.companyId,
    }))
    .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit))
    .slice(0, 12);

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

      <header className="mb-10 flex flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-black sm:text-3xl" style={{ color: MEUHEDET.blue }}>
          BSD-YBM — צי ארגוני
        </h1>
        <p className="max-w-xl text-sm text-gray-600">
          מבט עליון לנורות מצב; אזור Pro (רווחיות גלובלית, אנומליות, מתגי מודולים) — למנהל־על בלבד.
        </p>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8">
        <Dashboard4Lights lights={DEMO_LIGHTS} />
      </div>

      {!isMasterAdmin && (
        <p className="mx-auto mt-10 max-w-lg text-center text-sm font-bold text-gray-600">
          התחברו כ־master admin (SYSYBU) כדי לפתוח את לוח הבקרה המורחב.
        </p>
      )}

      {isMasterAdmin && (
        <div className="mx-auto mt-12 flex w-full max-w-5xl flex-col items-center justify-center gap-10">
          {dataBusy ? (
            <span className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              טוען נתוני צי…
            </span>
          ) : null}

          <section
            className="w-full rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-6"
            style={{ boxShadow: '0 12px 48px rgba(0,26,77,0.08)' }}
          >
            <h2 className="mb-6 text-center text-lg font-black text-[#001A4D]">
              רווחיות נטו לפי דייר (תקציב − ביצוע)
            </h2>
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={64} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => {
                      const n = typeof v === 'number' ? v : Number(v);
                      return [`${Number.isFinite(n) ? n.toLocaleString('he-IL') : '—'} ₪`, 'רווח נטו'];
                    }}
                    contentStyle={{ borderRadius: 16, border: `1px solid ${MEUHEDET.blue}33` }}
                  />
                  <Bar dataKey="profit" fill={MEUHEDET.orange} radius={[8, 8, 0, 0]} name="רווח נטו" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section
            className="w-full rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-6"
            style={{ boxShadow: '0 12px 48px rgba(0,26,77,0.08)' }}
          >
            <h2 className="mb-4 text-center text-lg font-black text-[#001A4D]">פיד אנומליות אדומות (כל הדיירים)</h2>
            {anomalies.length === 0 ? (
              <p className="text-center text-sm text-gray-500">אין אותות פעילים כרגע.</p>
            ) : (
              <ul className="flex flex-col items-center justify-center gap-4">
                {anomalies.map((a) => (
                  <li
                    key={`${a.companyId}-${a.id}`}
                    className="w-full max-w-2xl rounded-[32px] border border-red-200 bg-red-50/60 p-4 text-center"
                  >
                    <p className="text-sm font-black text-red-800">{a.companyLabel}</p>
                    <p className="text-xs font-bold text-red-700">{a.message}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      פרויקט: {a.projectId || '—'} · סטייה ~{a.discrepancyPct}%
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="w-full rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-6"
            style={{ boxShadow: '0 12px 48px rgba(0,26,77,0.08)' }}
          >
            <h2 className="mb-6 text-center text-lg font-black text-[#001A4D]">מתגי מודולים לפי דייר</h2>
            <div className="flex max-h-[420px] w-full flex-col items-center justify-start gap-4 overflow-y-auto">
              {tenants.map((t) => (
                <div
                  key={t.companyId}
                  className="flex w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-[#FDFDFD] p-4 sm:flex-row sm:justify-between"
                >
                  <div className="text-center sm:text-right">
                    <p className="font-black text-[#001A4D]">{t.displayName}</p>
                    <p className="font-mono text-xs text-gray-500">{t.companyId.slice(0, 10)}…</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <label className="flex items-center justify-center gap-2 text-xs font-bold text-[#001A4D]">
                      <input
                        type="checkbox"
                        checked={t.meckanoActive}
                        disabled={toggleBusy === t.companyId}
                        onChange={(e) => void patchTenant(t.companyId, { meckanoActive: e.target.checked })}
                      />
                      Meckano
                    </label>
                    <label className="flex items-center justify-center gap-2 text-xs font-bold text-[#001A4D]">
                      <input
                        type="checkbox"
                        checked={t.whatsappIngestActive}
                        disabled={toggleBusy === t.companyId}
                        onChange={(e) =>
                          void patchTenant(t.companyId, { whatsappIngestActive: e.target.checked })
                        }
                      />
                      WhatsApp Ingest
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
