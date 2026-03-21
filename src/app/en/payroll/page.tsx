'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import EnSignedInGate from '@/components/en/EnSignedInGate';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { companyPayrollEntriesRef, companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

const DEFAULT_TAX_PERCENT = 16.5;

type Row = {
  id: string;
  workerName?: string;
  workDate?: string;
  dailyRate?: number;
  daysWorked?: number;
  hours?: number;
  taxPercentApplied?: number;
  taxDeduction?: number;
  grossPay?: number;
  netPay?: number;
  projectId?: string;
  notes?: string;
};

type ProjectOpt = { id: string; label: string };

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return 0;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function EnPayrollInner() {
  const { user } = useAuth();
  const { companyId, companies } = useCompany();
  const isClient =
    Boolean(companyId) && companies.some((c) => c.companyId === companyId && c.role === 'client');

  const { from: defaultFrom, to: defaultTo } = useMemo(() => monthBounds(), []);
  const [rangeFrom, setRangeFrom] = useState(defaultFrom);
  const [rangeTo, setRangeTo] = useState(defaultTo);

  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [taxPercent, setTaxPercent] = useState(DEFAULT_TAX_PERCENT);

  const [workerName, setWorkerName] = useState('');
  const [workDate, setWorkDate] = useState(todayISO);
  const [dailyRate, setDailyRate] = useState('');
  const [daysWorked, setDaysWorked] = useState('');
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadMergedTax = useCallback(async () => {
    if (!companyId || !user) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch(`/api/erp/merged-defaults?companyId=${encodeURIComponent(companyId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = (await r.json()) as { taxPercent?: number };
      if (typeof j.taxPercent === 'number' && Number.isFinite(j.taxPercent)) {
        setTaxPercent(j.taxPercent);
      }
    } catch {
      setTaxPercent(DEFAULT_TAX_PERCENT);
    }
  }, [companyId, user]);

  useEffect(() => {
    void loadMergedTax();
  }, [loadMergedTax]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || isClient) {
      setRows([]);
      setProjects([]);
      return;
    }
    const u1 = onSnapshot(companyPayrollEntriesRef(companyId), (snap) => {
      const list: Row[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Row, 'id'>) }));
      list.sort((a, b) => (b.workDate || '').localeCompare(a.workDate || ''));
      setRows(list);
    });
    const u2 = onSnapshot(companyProjectsRef(companyId), (snap) => {
      const list: ProjectOpt[] = [];
      snap.forEach((d) => {
        const data = d.data() as { name?: string; siteAddress?: string; location?: string };
        const addr = (data.siteAddress || data.location || '').trim();
        const label = [data.name || d.id, addr].filter(Boolean).join(' · ');
        list.push({ id: d.id, label: label || d.id });
      });
      list.sort((a, b) => a.label.localeCompare(b.label));
      setProjects(list);
    });
    return () => {
      u1();
      u2();
    };
  }, [companyId, isClient]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const w = r.workDate || '';
      if (!w) return false;
      return w >= rangeFrom && w <= rangeTo;
    });
  }, [rows, rangeFrom, rangeTo]);

  const totals = useMemo(() => {
    let gross = 0;
    let tax = 0;
    let net = 0;
    for (const r of filteredRows) {
      gross += num(r.grossPay);
      tax += num(r.taxDeduction);
      net += num(r.netPay);
    }
    return { gross, tax, net };
  }, [filteredRows]);

  const rowGross = (r: Row) => {
    if (num(r.grossPay) > 0) return num(r.grossPay);
    const rate = num(r.dailyRate);
    const days = num(r.daysWorked);
    const hrs = num(r.hours);
    if (days > 0) return rate * days;
    if (hrs > 0) return rate * hrs;
    return 0;
  };

  const rowDays = (r: Row) => {
    if (num(r.daysWorked) > 0) return num(r.daysWorked);
    if (num(r.hours) > 0) return num(r.hours);
    return 0;
  };

  const projectLabel = (pid: string | undefined) => {
    if (!pid?.trim()) return '—';
    return projects.find((p) => p.id === pid)?.label || pid;
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!companyId || !isFirebaseConfigured()) {
      setErr('בחרו חברה במתג בראש הדשבורד.');
      return;
    }
    const name = workerName.trim();
    if (!name) {
      setErr('יש להזין שם עובד.');
      return;
    }
    const rate = Number(dailyRate.replace(/,/g, ''));
    const days = Number(daysWorked.replace(/,/g, ''));
    if (!Number.isFinite(rate) || !Number.isFinite(days) || rate < 0 || days <= 0) {
      setErr('תעריף יומי ומספר ימי עבודה חייבים להיות מספרים חיוביים תקינים.');
      return;
    }
    const gross = rate * days;
    const pct = taxPercent;
    const taxAmt = Math.round((gross * pct) / 100 * 100) / 100;
    const net = Math.max(0, Math.round((gross - taxAmt) * 100) / 100);
    setSaving(true);
    try {
      await addDoc(companyPayrollEntriesRef(companyId), {
        workerName: name,
        workDate: workDate.trim() || todayISO(),
        dailyRate: rate,
        daysWorked: days,
        taxPercentApplied: pct,
        taxDeduction: taxAmt,
        grossPay: gross,
        netPay: net,
        projectId: projectId.trim() || '',
        notes: notes.trim() || '',
        createdByUid: user?.uid ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setWorkerName('');
      setDailyRate('');
      setDaysWorked('');
      setProjectId('');
      setNotes('');
      setWorkDate(todayISO());
    } catch {
      setErr('השמירה נכשלה. בדקו חיבור רשת והרשאות Firestore.');
    } finally {
      setSaving(false);
    }
  };

  if (isClient) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6 rounded-[32px] border border-gray-200 bg-white p-12 text-center text-gray-500"
        dir="rtl"
      >
        <p className="max-w-md text-sm font-semibold">שכר אינו זמין לחשבונות לקוח.</p>
        <a href="/dashboard" className="text-sm font-bold text-[#FF8C00] underline underline-offset-4">
          חזרה לדשבורד
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8" dir="rtl">
      <header className="flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">bsd-ybm</p>
        <h1 className="text-3xl font-black text-[#001A4D] sm:text-4xl">מרכז שכר — מקאנו</h1>
        <p className="max-w-lg text-sm text-gray-500">
          תעריף יומי × ימי עבודה. ניכוי {taxPercent}% מוחל אוטומטית (ממוזג מהגדרות ה-ERP).
        </p>
      </header>

      {!companyId && (
        <p className="text-center text-sm font-semibold text-amber-700">
          בחרו חברה בראש הדשבורד, ואז חזרו לדף זה.
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
            <div className="flex flex-col items-center justify-center gap-2 rounded-[32px] border border-gray-200 bg-white px-6 py-4 text-center">
              <span className="text-xs font-bold uppercase text-slate-500">סיכומי טווח (נטו)</span>
              <span className="text-xl font-black text-emerald-700">{totals.net.toLocaleString()} ₪</span>
              <span className="text-xs text-slate-500">
                ברוטו {totals.gross.toLocaleString()} ₪ · מס {totals.tax.toLocaleString()} ₪
              </span>
            </div>
          </section>

          <form
            onSubmit={onAdd}
            className="grid grid-cols-1 gap-4 rounded-[32px] border border-gray-200 bg-white p-6 sm:grid-cols-2 sm:gap-6 md:p-8"
          >
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 sm:col-span-2 md:col-span-1">
              שם עובד
              <input
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                required
                className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3 text-[#1a1a1a] focus:border-[#004694] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
              תאריך עבודה
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3 text-[#1a1a1a] focus:border-[#004694] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
              תעריף יומי (₪)
              <input
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3 text-[#1a1a1a] focus:border-[#004694] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
              ימי עבודה
              <input
                value={daysWorked}
                onChange={(e) => setDaysWorked(e.target.value)}
                inputMode="decimal"
                className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3 text-[#1a1a1a] focus:border-[#004694] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 sm:col-span-2 md:col-span-1">
              פרויקט (לדוחות אתר)
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3 text-[#1a1a1a] focus:border-[#004694] focus:outline-none"
              >
                <option value="">ללא שיוך</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 sm:col-span-2">
              הערות
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3 text-[#1a1a1a] focus:border-[#004694] focus:outline-none"
              />
            </label>
            {err && <p className="text-center text-sm font-semibold text-red-400 sm:col-span-2">{err}</p>}
            <div className="flex items-center justify-center sm:col-span-2">
              <button
                type="submit"
                disabled={saving || !isFirebaseConfigured()}
                className="min-h-12 rounded-[32px] bg-[#FF8C00] px-8 py-3 font-black text-white shadow-lg disabled:opacity-50"
              >
                {saving ? 'שומר…' : 'שמירת שורת שכר'}
              </button>
            </div>
          </form>

          <section className="overflow-x-auto rounded-[32px] border border-gray-200 bg-white p-4 sm:p-6">
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <caption className="sr-only">שורות שכר</caption>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                  <th className="p-3 text-center font-bold">עובד</th>
                  <th className="p-3 text-center font-bold">תאריך</th>
                  <th className="p-3 text-center font-bold">פרויקט</th>
                  <th className="p-3 text-center font-bold">תעריף יומי</th>
                  <th className="p-3 text-center font-bold">ימים</th>
                  <th className="p-3 text-center font-bold">ברוטו</th>
                  <th className="p-3 text-center font-bold">מס</th>
                  <th className="p-3 text-center font-bold">נטו</th>
                  <th className="p-3 text-center font-bold">הערות</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-200/80 hover:bg-[#FDFDFD]">
                    <td className="p-3 text-center font-medium text-[#1a1a1a]">{r.workerName}</td>
                    <td className="p-3 text-center text-gray-600">{r.workDate || '—'}</td>
                    <td className="max-w-[220px] truncate p-3 text-center text-xs text-gray-600" title={projectLabel(r.projectId)}>
                      {projectLabel(r.projectId)}
                    </td>
                    <td className="p-3 text-center text-gray-600">{num(r.dailyRate).toLocaleString()} ₪</td>
                    <td className="p-3 text-center text-gray-600">{rowDays(r)}</td>
                    <td className="p-3 text-center text-gray-700">{rowGross(r).toLocaleString()} ₪</td>
                    <td className="p-3 text-center text-amber-800">
                      {num(r.taxDeduction).toLocaleString()} ₪
                      {r.taxPercentApplied != null ? (
                        <span className="block text-xs text-slate-500">({num(r.taxPercentApplied)}%)</span>
                      ) : null}
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700">{num(r.netPay).toLocaleString()} ₪</td>
                    <td className="max-w-[160px] truncate p-3 text-center text-xs text-gray-500" title={r.notes}>
                      {r.notes?.trim() || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td
                      colSpan={5}
                      className="p-3 text-center text-xs font-bold uppercase text-gray-500"
                    >
                      סה״כ {filteredRows.length} שורות
                    </td>
                    <td className="p-3 text-center text-sm font-bold text-gray-700">
                      {filteredRows.reduce((s, r) => s + rowGross(r), 0).toLocaleString()} ₪
                    </td>
                    <td className="p-3 text-center text-sm font-bold text-amber-800">
                      {filteredRows.reduce((s, r) => s + num(r.taxDeduction), 0).toLocaleString()} ₪
                    </td>
                    <td className="p-3 text-center text-sm font-black text-emerald-700">
                      {totals.net.toLocaleString()} ₪
                    </td>
                    <td className="p-3 text-center text-xs text-gray-400">bsd-ybm</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {filteredRows.length === 0 && (
              <p className="py-12 text-center text-sm font-semibold text-slate-500">
                אין שורות שכר בטווח התאריכים. הרחיבו את הטווח או הוסיפו שורות בטופס למעלה.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function EnPayrollPage() {
  return (
    <EnSignedInGate>
      <EnPayrollInner />
    </EnSignedInGate>
  );
}
