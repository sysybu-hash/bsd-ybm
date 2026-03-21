'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ClipboardList, Filter, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { companyPayrollEntriesRef, getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useLocale } from '@/context/LocaleContext';

type Row = {
  id: string;
  workerName?: string;
  workDate?: string;
  projectId?: string;
  projectName?: string;
  dailyRate?: number;
  hours?: number;
  taxDeduction?: number;
  grossPay?: number;
  netPay?: number;
  notes?: string;
};

type Project = { id: string; name?: string; title?: string };

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return 0;
}

// Default date range: first → last of current month
function thisMonthRange() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const last = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}` };
}

export default function PayrollPage() {
  const { user } = useAuth();
  const { companyId, companies } = useCompany();
  const { dir, locale } = useLocale();
  const isHe = locale === 'he';

  const isClient =
    Boolean(companyId) && companies.some((c) => c.companyId === companyId && c.role === 'client');

  // ── Raw data ──────────────────────────────────────────────────────
  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // ── Filter state ──────────────────────────────────────────────────
  const range = thisMonthRange();
  const [filterFrom, setFilterFrom] = useState(range.from);
  const [filterTo, setFilterTo] = useState(range.to);
  const [filterProject, setFilterProject] = useState('');

  // ── Form state ────────────────────────────────────────────────────
  const [workerName, setWorkerName] = useState('');
  const [workDate, setWorkDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [hours, setHours] = useState('');
  const [taxDeduction, setTaxDeduction] = useState('16.5');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Live payroll rows ─────────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || isClient) {
      setRows([]);
      return;
    }
    return onSnapshot(companyPayrollEntriesRef(companyId), (snap) => {
      const list: Row[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Row, 'id'>) }));
      list.sort((a, b) => (b.workDate || '').localeCompare(a.workDate || ''));
      setRows(list);
    });
  }, [companyId, isClient]);

  // ── Live projects list (for filter dropdown) ──────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId) {
      setProjects([]);
      return;
    }
    return onSnapshot(collection(getDb(), 'companies', companyId, 'projects'), (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => {
        const data = d.data() as { name?: string; title?: string };
        list.push({ id: d.id, name: data.name || data.title || d.id });
      });
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProjects(list);
    });
  }, [companyId]);

  // ── Filtered rows ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = r.workDate || '';
      if (filterFrom && d < filterFrom) return false;
      if (filterTo && d > filterTo) return false;
      if (filterProject && r.projectId !== filterProject) return false;
      return true;
    });
  }, [rows, filterFrom, filterTo, filterProject]);

  // ── Totals ────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    let gross = 0, net = 0, tax = 0;
    filtered.forEach((r) => { gross += num(r.grossPay); net += num(r.netPay); tax += num(r.taxDeduction); });
    return { gross, net, tax };
  }, [filtered]);

  // ── Add row ───────────────────────────────────────────────────────
  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!companyId || !isFirebaseConfigured()) {
      setErr(isHe ? 'בחרו חברה.' : 'Select a company.');
      return;
    }
    const name = workerName.trim();
    if (!name) {
      setErr(isHe ? 'שם עובד נדרש.' : 'Worker name is required.');
      return;
    }
    const rate = Number(dailyRate.replace(/,/g, ''));
    const hrs = Number(hours.replace(/,/g, ''));
    const taxPct = Number(taxDeduction.replace(/,/g, '')) || 0;
    if (!Number.isFinite(rate) || !Number.isFinite(hrs) || rate < 0 || hrs < 0) {
      setErr(isHe ? 'תעריף ושעות חייבים להיות מספרים תקינים.' : 'Rate and hours must be valid numbers.');
      return;
    }
    const gross = rate * hrs;
    // taxDeduction is treated as % of gross if ≤ 100, else as fixed amount
    const taxAmt = taxPct <= 100 ? gross * (taxPct / 100) : taxPct;
    const net = Math.max(0, gross - taxAmt);
    const selectedProject = projects.find((p) => p.id === projectId);
    setSaving(true);
    try {
      await addDoc(companyPayrollEntriesRef(companyId), {
        workerName: name,
        workDate: workDate.trim() || '',
        projectId: projectId || null,
        projectName: selectedProject?.name || null,
        dailyRate: rate,
        hours: hrs,
        taxDeduction: taxAmt,
        grossPay: gross,
        netPay: net,
        notes: notes.trim() || '',
        createdByUid: user?.uid ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setWorkerName('');
      setWorkDate('');
      setProjectId('');
      setDailyRate('');
      setHours('');
      setTaxDeduction('16.5');
      setNotes('');
    } catch {
      setErr(isHe ? 'שמירה נכשלה.' : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  // ── CSV Export ────────────────────────────────────────────────────
  const exportCsv = () => {
    const header = ['עובד', 'תאריך', 'פרויקט', 'תעריף', 'שעות', 'ניכוי', 'ברוטו', 'נטו', 'הערות'];
    const csvRows = filtered.map((r) => [
      r.workerName || '',
      r.workDate || '',
      r.projectName || '',
      num(r.dailyRate),
      num(r.hours),
      num(r.taxDeduction),
      num(r.grossPay),
      num(r.netPay),
      r.notes || '',
    ]);
    const csv = [header, ...csvRows].map((row) => row.map(String).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${filterFrom}-to-${filterTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isClient) {
    return (
      <div className="min-h-full bg-white p-8 text-center text-slate-600" dir={dir}>
        {isHe ? 'אין גישה לשכר בחשבון לקוח.' : 'Payroll is not available for client accounts.'}
        <div className="mt-6">
          <Link href="/dashboard" className="font-bold text-[#004694] underline">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-4 pb-24 sm:p-6 md:p-8" dir={dir}>

      {/* ── Header ── */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#004694]/10">
            <ClipboardList className="h-6 w-6 text-[#004694]" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0f172a]">
              {isHe ? 'מרכז שכר מקאנו' : 'Mekano Payroll Hub'}
            </h1>
            <p className="text-xs text-slate-500">BSD-YBM · שם עובד | תאריך | פרויקט | שעות | תעריף | מס | נטו</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/finance/budget-actual"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#004694]/30 bg-white px-4 py-2 text-xs font-bold text-[#004694] shadow-sm hover:bg-[#004694]/5"
          >
            {isHe ? 'תקציב מול ביצוע' : 'Budget vs Actual'}
          </Link>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {isHe ? 'ייצוא CSV' : 'Export CSV'}
          </button>
        </div>
      </header>

      {!companyId && (
        <p className="text-center text-slate-500 py-12">{isHe ? 'בחרו חברה.' : 'Select a company.'}</p>
      )}

      {companyId && (
        <div className="flex flex-col gap-6">

          {/* ══ FILTERS ══════════════════════════════════════════════ */}
          <section className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-[#F8FAFC] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <Filter className="h-4 w-4" aria-hidden />
              {isHe ? 'סינון' : 'Filter'}
            </div>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              {isHe ? 'מתאריך' : 'From'}
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              {isHe ? 'עד תאריך' : 'To'}
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              {isHe ? 'פרויקט' : 'Project'}
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="">{isHe ? '— כל הפרויקטים —' : '— All projects —'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => { setFilterFrom(range.from); setFilterTo(range.to); setFilterProject(''); }}
              className="ml-auto h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-500 hover:bg-gray-50"
            >
              {isHe ? 'איפוס' : 'Reset'}
            </button>
          </section>

          {/* ══ TOTALS STRIP ═════════════════════════════════════════ */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-1">{isHe ? 'ברוטו סה"כ' : 'Total Gross'}</p>
              <p className="text-xl font-black text-[#1a1a1a]">{totals.gross.toLocaleString()} ₪</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-1">{isHe ? 'ניכויי מס' : 'Tax Deductions'}</p>
              <p className="text-xl font-black text-orange-600">{totals.tax.toLocaleString()} ₪</p>
            </div>
            <div className="rounded-xl border border-[#004694]/20 bg-[#004694]/5 p-4 text-center shadow-sm">
              <p className="text-xs font-semibold text-[#004694] mb-1">{isHe ? 'נטו לתשלום' : 'Net Pay'}</p>
              <p className="text-xl font-black text-[#004694]">{totals.net.toLocaleString()} ₪</p>
            </div>
          </div>

          {/* ══ ADD FORM ═════════════════════════════════════════════ */}
          <form
            onSubmit={onAdd}
            className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
          >
            <h2 className="col-span-full text-sm font-bold text-[#004694]">
              {isHe ? '+ הוספת שורה' : '+ Add Row'}
            </h2>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
              {isHe ? 'שם עובד *' : 'Worker name *'}
              <input
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#004694] focus:outline-none"
                placeholder={isHe ? 'ישראל ישראלי' : 'Jane Smith'}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              {isHe ? 'תאריך' : 'Work date'}
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#004694] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              {isHe ? 'פרויקט' : 'Project'}
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#004694] focus:outline-none"
              >
                <option value="">{isHe ? '— ללא —' : '— None —'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              {isHe ? 'תעריף יומי (₪)' : 'Daily rate (₪)'}
              <input
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                inputMode="decimal"
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#004694] focus:outline-none"
                placeholder="500"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              {isHe ? 'שעות' : 'Hours'}
              <input
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                inputMode="decimal"
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#004694] focus:outline-none"
                placeholder="8"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              {isHe ? 'מס % (ברירת מחדל 16.5%)' : 'Tax % (default 16.5%)'}
              <input
                value={taxDeduction}
                onChange={(e) => setTaxDeduction(e.target.value)}
                inputMode="decimal"
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#004694] focus:outline-none"
                placeholder="16.5"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
              {isHe ? 'הערות' : 'Notes'}
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#004694] focus:outline-none"
              />
            </label>
            {err && <p className="col-span-full text-center text-xs text-red-600">{err}</p>}
            <div className="col-span-full flex justify-end">
              <button
                type="submit"
                disabled={saving || !isFirebaseConfigured()}
                className="h-10 rounded-lg bg-[#004694] px-6 text-sm font-bold text-white hover:bg-[#003580] disabled:opacity-50"
              >
                {saving ? '…' : isHe ? 'שמור שורה' : 'Save row'}
              </button>
            </div>
          </form>

          {/* ══ TABLE ════════════════════════════════════════════════ */}
          <section className="overflow-x-auto rounded-[32px] border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F8FAFC] text-xs font-bold text-gray-500">
                  <th className="p-3 text-right">{isHe ? 'עובד' : 'Worker'}</th>
                  <th className="p-3 text-right">{isHe ? 'תאריך' : 'Date'}</th>
                  <th className="p-3 text-right">{isHe ? 'פרויקט' : 'Project'}</th>
                  <th className="p-3 text-right">{isHe ? 'תעריף' : 'Rate'}</th>
                  <th className="p-3 text-right">{isHe ? 'שעות' : 'Hrs'}</th>
                  <th className="p-3 text-right">{isHe ? 'מס (₪)' : 'Tax (₪)'}</th>
                  <th className="p-3 text-right">{isHe ? 'ברוטו' : 'Gross'}</th>
                  <th className="p-3 text-right font-black text-[#004694]">{isHe ? 'נטו' : 'Net'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3 font-medium text-[#1a1a1a]">{r.workerName || '—'}</td>
                    <td className="p-3 text-gray-500">{r.workDate || '—'}</td>
                    <td className="p-3 text-gray-500">{r.projectName || '—'}</td>
                    <td className="p-3">{num(r.dailyRate).toLocaleString()} ₪</td>
                    <td className="p-3">{num(r.hours)}</td>
                    <td className="p-3 text-orange-600">{num(r.taxDeduction).toLocaleString()} ₪</td>
                    <td className="p-3">{num(r.grossPay).toLocaleString()} ₪</td>
                    <td className="p-3 font-black text-[#004694]">{num(r.netPay).toLocaleString()} ₪</td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-[#F8FAFC] text-xs font-bold">
                    <td colSpan={6} className="p-3 text-gray-600">{isHe ? `סה"כ — ${filtered.length} שורות` : `Total — ${filtered.length} rows`}</td>
                    <td className="p-3">{totals.gross.toLocaleString()} ₪</td>
                    <td className="p-3 text-[#004694]">{totals.net.toLocaleString()} ₪</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {filtered.length === 0 && (
              <p className="py-12 text-center text-gray-400 text-sm">
                {isHe ? 'אין שורות בטווח התאריכים הנבחר' : 'No rows in selected date range'}
              </p>
            )}
          </section>

        </div>
      )}
    </div>
  );
}
