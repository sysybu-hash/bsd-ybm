'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { onSnapshot } from 'firebase/firestore';
import { Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { companyExpenseLogsRef, companyPayrollEntriesRef, companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useLocale } from '@/context/LocaleContext';
import { useSubscription } from '@/hooks/useSubscription';

type ProjectDoc = {
  name?: string;
  totalContractValue?: number;
  budget?: number;
};

type ExpenseDoc = {
  amount?: number;
  projectId?: string;
};

type PayrollDoc = {
  netPay?: number;
};

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return 0;
}

export default function BudgetVsActualPage() {
  const { companyId, companies } = useCompany();
  const { dir, locale } = useLocale();
  const { hasFeature, plan } = useSubscription();
  const canFinance = hasFeature('finance_dashboard');

  const isClient =
    Boolean(companyId) && companies.some((c) => c.companyId === companyId && c.role === 'client');

  const [projects, setProjects] = useState<{ id: string; data: ProjectDoc }[]>([]);
  const [expenses, setExpenses] = useState<{ id: string; data: ExpenseDoc }[]>([]);
  const [payrollNetTotal, setPayrollNetTotal] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || isClient) {
      setProjects([]);
      setExpenses([]);
      setPayrollNetTotal(0);
      return;
    }
    const u1 = onSnapshot(companyProjectsRef(companyId), (snap) => {
      const rows: { id: string; data: ProjectDoc }[] = [];
      snap.forEach((d) => rows.push({ id: d.id, data: d.data() as ProjectDoc }));
      setProjects(rows);
    });
    const u2 = onSnapshot(companyExpenseLogsRef(companyId), (snap) => {
      const rows: { id: string; data: ExpenseDoc }[] = [];
      snap.forEach((d) => rows.push({ id: d.id, data: d.data() as ExpenseDoc }));
      setExpenses(rows);
    });
    const u3 = onSnapshot(companyPayrollEntriesRef(companyId), (snap) => {
      let t = 0;
      snap.forEach((d) => {
        t += num((d.data() as PayrollDoc).netPay);
      });
      setPayrollNetTotal(t);
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, [companyId, isClient]);

  const byProjectActual = useMemo(() => {
    const m = new Map<string, number>();
    for (const { data } of expenses) {
      const pid = (data.projectId || '').trim();
      if (!pid) continue;
      m.set(pid, (m.get(pid) || 0) + num(data.amount));
    }
    return m;
  }, [expenses]);

  const totalBudget = useMemo(
    () =>
      projects.reduce(
        (s, p) => s + num(p.data.totalContractValue !== undefined ? p.data.totalContractValue : p.data.budget),
        0
      ),
    [projects]
  );

  const totalExpenseLogged = useMemo(() => expenses.reduce((s, { data }) => s + num(data.amount), 0), [expenses]);

  const totalActual = totalExpenseLogged + payrollNetTotal;

  const totalUnassigned = useMemo(() => {
    let u = 0;
    for (const { data } of expenses) {
      if (!(data.projectId || '').trim()) u += num(data.amount);
    }
    return u;
  }, [expenses]);

  if (isClient) {
    return (
      <div className="min-h-full bg-[#FDFDFD] p-8 text-center text-slate-600" dir={dir}>
        {locale === 'he' ? 'אין גישה לתקציב מול ביצוע בחשבון לקוח.' : 'Budget vs actual is not available for client accounts.'}
        <div className="mt-6">
          <Link href="/dashboard" className="font-bold text-[#004694] underline">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FDFDFD] p-4 pb-16 sm:p-8 md:p-12" dir={dir}>
      <header className="mb-8 flex flex-col items-center justify-center gap-4 text-center sm:mb-12">
        <div className="flex items-center justify-center gap-4 rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="rounded-[32px] bg-[#004694]/12 p-3">
            <Scale className="h-8 w-8 text-[#004694]" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] sm:text-3xl">
              {locale === 'he' ? 'תקציב מול ביצוע' : 'Budget vs actual'}
            </h1>
            <p className="text-sm text-slate-500">bsd-ybm · Jerusalem Builders ERP v6</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard/finance/expenses"
            className="inline-flex min-h-12 items-center justify-center rounded-[32px] bg-[#004694] px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-90"
          >
            {locale === 'he' ? 'יומן הוצאות' : 'Expense log'}
          </Link>
          <Link
            href="/dashboard/finance"
            className="inline-flex min-h-12 items-center justify-center rounded-[32px] border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            {locale === 'he' ? 'דוח רווח והפסד' : 'Executive P&L'}
          </Link>
        </div>
      </header>

      {!companyId && (
        <p className="text-center text-slate-500">{locale === 'he' ? 'בחרו חברה מהמתג.' : 'Select a company from the header.'}</p>
      )}

      {!canFinance && companyId && (
        <section className="mx-auto mb-8 max-w-xl rounded-[32px] border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950">
          {locale === 'he'
            ? `התוכנית ${plan} אינה כוללת את לוח הפיננסים המלא. נתוני תקציב/ביצוע עדיין נשמרים ב-Firestore.`
            : `Plan ${plan} may limit the executive finance board. Budget/actual data still saves to Firestore.`}
        </section>
      )}

      {companyId && (
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <section className="grid grid-cols-1 gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:p-8">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-xs font-bold uppercase text-slate-400">
                {locale === 'he' ? 'סה״כ חוזים (תקציב)' : 'Total contract value'}
              </span>
              <span className="text-2xl font-black text-[#004694]">
                {totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₪
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-xs font-bold uppercase text-slate-400">
                {locale === 'he' ? 'הוצאות (חומרים וכו׳)' : 'Expenses (materials etc.)'}
              </span>
              <span className="flex items-center justify-center gap-2 text-2xl font-black text-slate-800">
                <TrendingDown className="h-6 w-6 text-rose-600" aria-hidden />
                {totalExpenseLogged.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₪
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-xs font-bold uppercase text-slate-400">
                {locale === 'he' ? 'שכר נטו (מטבלת שכר)' : 'Payroll net (from payroll)'}
              </span>
              <span className="text-2xl font-black text-slate-800">
                {payrollNetTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₪
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-xs font-bold uppercase text-slate-400">
                {locale === 'he' ? 'פער (תקציב − ביצוע)' : 'Gap (budget − actual)'}
              </span>
              <span className="flex items-center justify-center gap-2 text-2xl font-black text-emerald-700">
                <TrendingUp className="h-6 w-6" aria-hidden />
                {(totalBudget - totalActual).toLocaleString(undefined, { maximumFractionDigits: 0 })} ₪
              </span>
            </div>
          </section>

          {totalUnassigned > 0 && (
            <p className="rounded-[32px] border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
              {locale === 'he'
                ? `סכום ללא שיוך פרויקט: ${totalUnassigned.toLocaleString()} ₪ (יומן הוצאות)`
                : `Unassigned to any project: ${totalUnassigned.toLocaleString()} ₪ (expense log)`}
            </p>
          )}

          <section className="overflow-x-auto rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-center text-lg font-black text-[#0f172a]">
              {locale === 'he' ? 'לפי פרויקט' : 'By project'}
            </h2>
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <caption className="sr-only">
                {locale === 'he' ? 'תקציב מול ביצוע לפי פרויקט' : 'Budget vs actual by project'}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'פרויקט' : 'Project'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'תקציב' : 'Budget'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'ביצוע (הוצאות)' : 'Actual (expenses)'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'פער' : 'Variance'}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(({ id, data }) => {
                  const b = num(data.totalContractValue !== undefined ? data.totalContractValue : data.budget);
                  const a = byProjectActual.get(id) || 0;
                  const v = b - a;
                  return (
                    <tr key={id} className="border-b border-slate-100 hover:bg-[#FDFDFD]">
                      <td className="p-3 text-center font-semibold text-slate-900">{data.name || id}</td>
                      <td className="p-3 text-center text-[#004694]">{b.toLocaleString()} ₪</td>
                      <td className="p-3 text-center">{a.toLocaleString()} ₪</td>
                      <td className={`p-3 text-center font-bold ${v >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {v.toLocaleString()} ₪
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {projects.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="p-3 text-center text-xs font-bold uppercase text-slate-500">
                      {locale === 'he' ? `סה״כ ${projects.length} פרויקטים` : `Total ${projects.length} projects`}
                    </td>
                    <td className="p-3 text-center text-sm font-black text-[#004694]">
                      {totalBudget.toLocaleString()} ₪
                    </td>
                    <td className="p-3 text-center text-sm font-bold text-slate-800">
                      {projects.reduce((s, { id }) => s + (byProjectActual.get(id) || 0), 0).toLocaleString()} ₪
                    </td>
                    <td className="p-3 text-center text-sm font-black text-emerald-800">
                      {(totalBudget - projects.reduce((s, { id }) => s + (byProjectActual.get(id) || 0), 0)).toLocaleString()}{' '}
                      ₪
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            {projects.length === 0 && (
              <p className="py-8 text-center text-slate-400">{locale === 'he' ? 'אין פרויקטים' : 'No projects yet'}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
