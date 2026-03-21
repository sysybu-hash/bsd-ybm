'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot } from 'firebase/firestore';
import { FolderKanban, Wallet, Users, ScanLine } from 'lucide-react';
import { useDashboardDiagnostics } from '@/context/DashboardDiagnosticsContext';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useSubscription } from '@/hooks/useSubscription';
import { useDemoMode } from '@/services/demo/DemoProvider';
import ProjectHeatmap from '@/components/dashboard/ProjectHeatmap';
import ExecutiveHeatmap from '@/components/dashboard/ExecutiveHeatmap';
import FieldTourVideo from '@/components/dashboard/FieldTourVideo';
import DashboardEmpireOverview from '@/components/dashboard/DashboardEmpireOverview';

const TILES = [
  { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban, countKey: 'projects' as const },
  {
    label: 'Finance',
    href: '/dashboard/finance',
    icon: Wallet,
    countKey: 'finance' as const,
    feature: 'finance_dashboard' as const,
  },
  { label: 'Team', href: '/dashboard/team', icon: Users, countKey: null },
  {
    label: 'Scan Center',
    href: '/scan',
    icon: ScanLine,
    countKey: null,
    feature: 'multi_engine_scan' as const,
  },
];

export default function Dashboard() {
  const { recordError } = useDashboardDiagnostics();
  const { accountTier } = useAuth();
  const { companyId, companies, isGlobalStaff } = useCompany();
  const { hasFeature } = useSubscription();
  const { dataMode, setDataMode, isTrialUserLocked } = useDemoMode();
  const isClient =
    Boolean(companyId) &&
    companies.some((c) => c.companyId === companyId && c.role === 'client');
  const showHeatmap = Boolean(companyId && (isGlobalStaff || !isClient));
  const [syncBusy, setSyncBusy] = useState(false);
  const [counts, setCounts] = useState({ projects: 0, finance: 0 });
  const [erpLive, setErpLive] = useState({ payrollMonth: 0, expensesMonth: 0 });

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setCounts({ projects: 0, finance: 0 });
      return;
    }
    const db = getDb();
    const base = ['companies', companyId] as const;
    const unsubP = onSnapshot(collection(db, ...base, 'projects'), (snap) => {
      setCounts((c) => ({ ...c, projects: snap.size }));
    });
    const unsubF = onSnapshot(collection(db, ...base, 'finances'), (snap) => {
      setCounts((c) => ({ ...c, finance: snap.size }));
    });
    return () => {
      unsubP();
      unsubF();
    };
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured() || isClient) {
      setErpLive({ payrollMonth: 0, expensesMonth: 0 });
      return;
    }
    const n = new Date();
    const y = n.getFullYear();
    const m = n.getMonth();
    const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const last = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    const db = getDb();
    const base = ['companies', companyId] as const;
    const unsubPay = onSnapshot(collection(db, ...base, 'payrollEntries'), (snap) => {
      let t = 0;
      snap.forEach((d) => {
        const row = d.data() as { workDate?: string; netPay?: number };
        const w = row.workDate;
        if (typeof w === 'string' && w >= from && w <= to) t += Number(row.netPay) || 0;
      });
      setErpLive((e) => ({ ...e, payrollMonth: t }));
    });
    const unsubEx = onSnapshot(collection(db, ...base, 'expenseLogs'), (snap) => {
      let t = 0;
      snap.forEach((d) => {
        const row = d.data() as { expenseDate?: string; amount?: number };
        const x = row.expenseDate;
        if (typeof x === 'string' && x >= from && x <= to) t += Number(row.amount) || 0;
      });
      setErpLive((e) => ({ ...e, expensesMonth: t }));
    });
    return () => {
      unsubPay();
      unsubEx();
    };
  }, [companyId, isClient]);

  const runGlobalSync = async () => {
    setSyncBusy(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        recordError('dashboard-global-sync', (json as { message?: string }).message || 'סנכרון נכשל');
      }
    } catch (e) {
      recordError('dashboard-global-sync', e instanceof Error ? e.message : 'סנכרון נכשל');
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FFFFFF] p-4 pb-12 pt-4 sm:p-8 md:p-12">
      <header className="mb-8 flex flex-col items-stretch justify-center gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <h1 className="text-center text-3xl font-black text-[#1a1a1a] sm:text-left sm:text-4xl">
            bsd-ybm · Workshop
          </h1>
          <p className="text-center text-xs font-bold text-slate-500 sm:text-left">Live Firestore ERP summaries</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {companyId && !isClient && (
            <Link
              href="/dashboard/projects/new"
              className="inline-flex min-h-12 items-center justify-center rounded-4xl border-2 border-[#004694]/30 bg-white px-6 py-3 text-sm font-black text-[#004694] shadow-sm transition-colors hover:bg-[#004694]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
            >
              + פרויקט חדש
            </Link>
          )}
          <div
            className="flex items-center justify-center gap-2 rounded-4xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
            title={
              isTrialUserLocked
                ? accountTier === 'demo'
                  ? 'חשבון דמו — נתונים אמיתיים נחסמים'
                  : 'חשבון הדגמה — נתונים אמיתיים נחסמים'
                : undefined
            }
          >
            <span className="text-xs font-bold text-gray-600">נתונים</span>
            <button
              type="button"
              disabled={isTrialUserLocked}
              onClick={() => setDataMode('real')}
              className={`min-h-10 rounded-4xl px-4 py-2 text-xs font-black transition-colors ${
                dataMode === 'real' ? 'bg-[#004694] text-white' : 'text-gray-500 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              LIVE
            </button>
            <button
              type="button"
              onClick={() => setDataMode('demo')}
              className={`min-h-10 rounded-4xl px-4 py-2 text-xs font-black transition-colors ${
                dataMode === 'demo' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              DEMO
            </button>
          </div>
          <button
            type="button"
            onClick={runGlobalSync}
            disabled={syncBusy}
            className="btn-primary-empire min-h-12 rounded-4xl px-8 py-4 text-base font-bold text-white shadow-md transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary,#004694)] disabled:opacity-60"
            style={{
              backgroundColor: 'var(--brand-accent, #FF8C00)',
              boxShadow: '0 0 20px color-mix(in srgb, var(--brand-accent, #FF8C00) 35%, transparent)',
            }}
          >
            {syncBusy ? 'מסנכרן…' : 'Global Sync'}
          </button>
        </div>
      </header>

      {companyId && !isClient && dataMode === 'real' && (
        <section className="mx-auto mb-8 grid w-full max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:gap-6 sm:px-8">
          {/* Monthly Payroll — white Meuhedet-style tile */}
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <Wallet className="h-5 w-5 text-emerald-600" aria-hidden />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">שכר חודשי (נטו)</span>
            </div>
            <span className="text-3xl font-black text-emerald-700">
              {erpLive.payrollMonth.toLocaleString()} ₪
            </span>
            <Link href="/en/payroll" className="text-xs font-bold text-[#004694] hover:underline">
              מרכז שכר מקאנו ←
            </Link>
          </div>
          {/* Active Projects tile */}
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <FolderKanban className="h-5 w-5 text-[#004694]" aria-hidden />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">פרויקטים פעילים</span>
            </div>
            <span className="text-3xl font-black text-[#004694]">{counts.projects}</span>
            <Link href="/dashboard/projects" className="text-xs font-bold text-[#004694] hover:underline">
              כל הפרויקטים ←
            </Link>
          </div>
          {/* Monthly Expenses tile */}
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                <Users className="h-5 w-5 text-[#FF8C00]" aria-hidden />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">הוצאות חודשיות</span>
            </div>
            <span className="text-3xl font-black text-[#FF8C00]">
              {erpLive.expensesMonth.toLocaleString()} ₪
            </span>
            <Link href="/dashboard/finance/expenses" className="text-xs font-bold text-[#004694] hover:underline">
              יומן הוצאות ←
            </Link>
          </div>
        </section>
      )}

      {companyId && dataMode === 'real' && (
        <div className="mx-auto mb-8 w-full max-w-6xl px-4 sm:px-8">
          <DashboardEmpireOverview />
        </div>
      )}

      {(companyId || dataMode === 'demo') && (
        <div className="mx-auto mb-8 w-full max-w-6xl px-4 sm:px-8">
          <ExecutiveHeatmap />
        </div>
      )}

      {showHeatmap && companyId && dataMode === 'real' && (
        <div className="mx-auto mb-8 w-full max-w-6xl px-4 sm:px-8">
          <ProjectHeatmap companyId={companyId} />
        </div>
      )}

      {(companyId || dataMode === 'demo') && (
        <div className="mx-auto mb-8 flex w-full max-w-6xl flex-col items-center justify-center px-4 sm:px-8">
          <FieldTourVideo />
        </div>
      )}

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {TILES.filter((t) => ('feature' in t && t.feature ? hasFeature(t.feature) : true)).map(({ label, href, icon: Icon, countKey }) => {
          const sub =
            countKey === 'projects'
              ? `${counts.projects} פרויקטים פעילים בחברה`
              : countKey === 'finance'
                ? `${counts.finance} רשומות בכספים`
                : 'מחובר ל־Firestore בזמן אמת';
          return (
            <Link
              key={label}
              href={href}
              className="dashboard-tile-shimmer flex min-h-[220px] flex-col items-center justify-center rounded-4xl border border-gray-100 bg-white p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_14px_34px_rgba(0,0,0,0.1)] active:shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:min-h-[260px] sm:p-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent,#FF8C00)]"
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-4xl text-white sm:mb-6 sm:h-16 sm:w-16"
                style={{
                  backgroundColor: 'var(--brand-accent, #FF8C00)',
                  boxShadow: '0 0 18px color-mix(in srgb, var(--brand-accent, #FF8C00) 40%, transparent)',
                }}
              >
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
              </div>
              <h2 className="mb-2 text-2xl font-black text-[#1a1a1a] sm:mb-3 sm:text-3xl">{label}</h2>
              <p className="font-medium text-gray-500">
                {!companyId ? 'בחר חברה מהסרגל' : sub}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
