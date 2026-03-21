'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import EnSignedInGate from '@/components/en/EnSignedInGate';
import { useCompany } from '@/context/CompanyContext';
import { companyExpenseLogsRef, companyPayrollEntriesRef, companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

type ProjectDoc = { siteAddress?: string; location?: string; name?: string };
type PayRow = { workDate?: string; grossPay?: number; netPay?: number; projectId?: string; dailyRate?: number; daysWorked?: number; hours?: number };
type ExpRow = { expenseDate?: string; amount?: number; projectId?: string };

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return 0;
}

function monthBounds(): { from: string; to: string } {
  const n = new Date();
  const y = n.getFullYear();
  const m = n.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const last = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

function addressForProject(map: Map<string, string>, projectId: string): string {
  if (!projectId) return 'ללא אתר משויך';
  return map.get(projectId) || `פרויקט ${projectId}`;
}

function payrollGross(row: PayRow): number {
  if (num(row.grossPay) > 0) return num(row.grossPay);
  const rate = num(row.dailyRate);
  const d = num(row.daysWorked);
  const h = num(row.hours);
  if (d > 0) return rate * d;
  if (h > 0) return rate * h;
  return 0;
}

function EnLocationReportInner() {
  const { companyId, companies } = useCompany();
  const isClient =
    Boolean(companyId) && companies.some((c) => c.companyId === companyId && c.role === 'client');

  const { from: defaultFrom, to: defaultTo } = useMemo(() => monthBounds(), []);
  const [rangeFrom, setRangeFrom] = useState(defaultFrom);
  const [rangeTo, setRangeTo] = useState(defaultTo);

  const [projectAddrs, setProjectAddrs] = useState<Map<string, string>>(() => new Map());
  const [payroll, setPayroll] = useState<PayRow[]>([]);
  const [expenses, setExpenses] = useState<ExpRow[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || isClient) {
      setProjectAddrs(new Map());
      setPayroll([]);
      setExpenses([]);
      return;
    }
    const u0 = onSnapshot(companyProjectsRef(companyId), (snap) => {
      const m = new Map<string, string>();
      snap.forEach((d) => {
        const data = d.data() as ProjectDoc;
        const addr = (data.siteAddress || data.location || data.name || d.id).trim() || d.id;
        m.set(d.id, addr);
      });
      setProjectAddrs(m);
    });
    const u1 = onSnapshot(companyPayrollEntriesRef(companyId), (snap) => {
      const list: PayRow[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as PayRow) }));
      setPayroll(list);
    });
    const u2 = onSnapshot(companyExpenseLogsRef(companyId), (snap) => {
      const list: ExpRow[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as ExpRow) }));
      setExpenses(list);
    });
    return () => {
      u0();
      u1();
      u2();
    };
  }, [companyId, isClient]);

  const aggregates = useMemo(() => {
    const byAddr = new Map<string, { labor: number; materials: number; otherExp: number }>();

    const bump = (addr: string, key: 'labor' | 'materials' | 'otherExp', v: number) => {
      if (!byAddr.has(addr)) byAddr.set(addr, { labor: 0, materials: 0, otherExp: 0 });
      const cur = byAddr.get(addr)!;
      cur[key] += v;
    };

    for (const r of payroll) {
      const w = r.workDate || '';
      if (!w || w < rangeFrom || w > rangeTo) continue;
      const addr = addressForProject(projectAddrs, r.projectId || '');
      bump(addr, 'labor', payrollGross(r));
    }

    for (const r of expenses) {
      const x = r.expenseDate || '';
      if (!x || x < rangeFrom || x > rangeTo) continue;
      const addr = addressForProject(projectAddrs, r.projectId || '');
      const amt = num(r.amount);
      bump(addr, 'materials', amt);
    }

    const rows = [...byAddr.entries()].map(([address, v]) => ({
      address,
      labor: v.labor,
      materials: v.materials,
      total: v.labor + v.materials + v.otherExp,
    }));
    rows.sort((a, b) => b.total - a.total);
    const grand = rows.reduce((s, r) => s + r.total, 0);
    return { rows, grand };
  }, [payroll, expenses, projectAddrs, rangeFrom, rangeTo]);

  if (isClient) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6 rounded-[32px] border border-gray-200 bg-white p-12 text-center text-gray-500"
        dir="rtl"
      >
        <p className="max-w-md text-sm font-semibold">דוח עלויות לפי אתר אינו זמין לחשבונות לקוח.</p>
        <a href="/dashboard" className="text-sm font-bold text-[#FF8C00] underline underline-offset-4">
          חזרה לדשבורד
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8" dir="rtl">
      <header className="flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">bsd-ybm</p>
        <h1 className="text-3xl font-black text-[#001A4D] sm:text-4xl">עלויות לפי כתובת פרויקט</h1>
        <p className="max-w-xl text-sm text-gray-500">
          עבודה (ברוטו משכר) והוצאות רשומות מקובצות לפי כתובת האתר לתקופה שנבחרה.
        </p>
      </header>

      {!companyId && (
        <p className="text-center text-sm font-semibold text-amber-700">
          בחרו חברה בראש הדשבורד כדי לטעון נתוני דוח.
        </p>
      )}

      {companyId && (
        <>
          <section className="flex flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white p-6 sm:flex-row sm:gap-6 sm:p-8">
            <label className="flex w-full max-w-xs flex-col items-center justify-center gap-2 text-center text-xs font-bold uppercase text-gray-500">
              מתאריך
              <input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="min-h-12 w-full rounded-[32px] border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-[#1a1a1a]"
              />
            </label>
            <label className="flex w-full max-w-xs flex-col items-center justify-center gap-2 text-center text-xs font-bold uppercase text-gray-500">
              עד תאריך
              <input
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="min-h-12 w-full rounded-[32px] border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-[#1a1a1a]"
              />
            </label>
            <div className="flex flex-col items-center justify-center gap-2 rounded-[32px] border border-orange-500/40 bg-white px-6 py-4 text-center">
              <span className="text-xs font-bold uppercase text-slate-500">סה״כ בטווח</span>
              <span className="text-2xl font-black text-[#FF8C00]">{aggregates.grand.toLocaleString()} ₪</span>
            </div>
          </section>

          <section className="overflow-x-auto rounded-[32px] border border-gray-200 bg-white p-4 sm:p-6">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <caption className="sr-only">עלויות לפי כתובת פרויקט</caption>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                  <th className="p-3 text-center font-bold">כתובת / אתר</th>
                  <th className="p-3 text-center font-bold">עבודה (ברוטו)</th>
                  <th className="p-3 text-center font-bold">חומרים וקבלנים (רשום)</th>
                  <th className="p-3 text-center font-bold">סה״כ</th>
                </tr>
              </thead>
              <tbody>
                {aggregates.rows.map((r) => (
                  <tr key={r.address} className="border-b border-gray-200/80 hover:bg-[#FDFDFD]">
                    <td className="p-3 text-center font-semibold text-[#1a1a1a]">{r.address}</td>
                    <td className="p-3 text-center text-gray-600">{r.labor.toLocaleString()} ₪</td>
                    <td className="p-3 text-center text-gray-600">{r.materials.toLocaleString()} ₪</td>
                    <td className="p-3 text-center font-black text-[#FF8C00]">{r.total.toLocaleString()} ₪</td>
                  </tr>
                ))}
              </tbody>
              {aggregates.rows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="p-3 text-center text-xs font-bold uppercase text-gray-500">סיכום כולל</td>
                    <td className="p-3 text-center text-sm font-bold text-gray-700">
                      {aggregates.rows.reduce((s, r) => s + r.labor, 0).toLocaleString()} ₪
                    </td>
                    <td className="p-3 text-center text-sm font-bold text-gray-700">
                      {aggregates.rows.reduce((s, r) => s + r.materials, 0).toLocaleString()} ₪
                    </td>
                    <td className="p-3 text-center text-lg font-black text-[#001a4d]">
                      {aggregates.grand.toLocaleString()} ₪
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            {aggregates.rows.length === 0 && (
              <p className="py-12 text-center text-sm font-semibold text-slate-500">
                אין עלויות בטווח. רשמו הוצאות עם פרויקט, ושורות שכר עם פרויקט ותאריכים בתוך הטווח.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function EnLocationReportPage() {
  return (
    <EnSignedInGate>
      <EnLocationReportInner />
    </EnSignedInGate>
  );
}
