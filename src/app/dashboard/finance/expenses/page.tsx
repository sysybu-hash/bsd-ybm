'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Receipt } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { companyExpenseLogsRef, companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useLocale } from '@/context/LocaleContext';

type ExpenseRow = {
  id: string;
  expenseType?: string;
  vendor?: string;
  amount?: number;
  invoiceRef?: string;
  expenseDate?: string;
  projectId?: string;
  notes?: string;
};

type ProjectOpt = { id: string; name: string };

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return 0;
}

export default function ExpensesLogPage() {
  const { user } = useAuth();
  const { companyId, companies } = useCompany();
  const { dir, locale } = useLocale();

  const isClient =
    Boolean(companyId) && companies.some((c) => c.companyId === companyId && c.role === 'client');

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);

  const [expenseType, setExpenseType] = useState<'materials' | 'subcontractor'>('materials');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || isClient) {
      setRows([]);
      setProjects([]);
      return;
    }
    const u1 = onSnapshot(companyExpenseLogsRef(companyId), (snap) => {
      const list: ExpenseRow[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ExpenseRow, 'id'>) }));
      list.sort((a, b) => (b.expenseDate || '').localeCompare(a.expenseDate || ''));
      setRows(list);
    });
    const u2 = onSnapshot(companyProjectsRef(companyId), (snap) => {
      const list: ProjectOpt[] = [];
      snap.forEach((d) => {
        const data = d.data() as { name?: string };
        list.push({ id: d.id, name: data.name || d.id });
      });
      setProjects(list);
    });
    return () => {
      u1();
      u2();
    };
  }, [companyId, isClient]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!companyId || !isFirebaseConfigured()) {
      setErr(locale === 'he' ? 'בחרו חברה.' : 'Select a company.');
      return;
    }
    const v = vendor.trim();
    if (!v) {
      setErr(locale === 'he' ? 'ספק / תיאור נדרש.' : 'Vendor / description is required.');
      return;
    }
    const amt = Number(amount.replace(/,/g, ''));
    if (!Number.isFinite(amt) || amt <= 0) {
      setErr(locale === 'he' ? 'סכום חייב להיות חיובי.' : 'Amount must be a positive number.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(companyExpenseLogsRef(companyId), {
        expenseType,
        vendor: v,
        amount: amt,
        invoiceRef: invoiceRef.trim() || '',
        expenseDate: expenseDate.trim() || '',
        projectId: projectId.trim() || '',
        notes: notes.trim() || '',
        createdByUid: user?.uid ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setVendor('');
      setAmount('');
      setInvoiceRef('');
      setExpenseDate('');
      setProjectId('');
      setNotes('');
    } catch {
      setErr(locale === 'he' ? 'שמירה נכשלה.' : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (isClient) {
    return (
      <div className="min-h-full bg-[#FDFDFD] p-8 text-center text-slate-600" dir={dir}>
        {locale === 'he' ? 'אין גישה ליומן הוצאות.' : 'Expense log is not available for client accounts.'}
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
            <Receipt className="h-8 w-8 text-[#004694]" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] sm:text-3xl">
              {locale === 'he' ? 'יומן הוצאות' : 'Expense log'}
            </h1>
            <p className="text-sm text-slate-500">bsd-ybm · materials & subcontractors</p>
          </div>
        </div>
        <Link
          href="/dashboard/finance/budget-actual"
          className="text-sm font-bold text-[#004694] underline underline-offset-4"
        >
          {locale === 'he' ? 'תקציב מול ביצוע' : 'Budget vs actual'}
        </Link>
      </header>

      {!companyId && (
        <p className="text-center text-slate-500">{locale === 'he' ? 'בחרו חברה.' : 'Select a company.'}</p>
      )}

      {companyId && (
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <form
            onSubmit={onAdd}
            className="flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:gap-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              <label className="flex items-center justify-center gap-4 text-sm font-semibold">
                <input
                  type="radio"
                  name="etype"
                  checked={expenseType === 'materials'}
                  onChange={() => setExpenseType('materials')}
                />
                {locale === 'he' ? 'חומרים' : 'Materials'}
              </label>
              <label className="flex items-center justify-center gap-4 text-sm font-semibold">
                <input
                  type="radio"
                  name="etype"
                  checked={expenseType === 'subcontractor'}
                  onChange={() => setExpenseType('subcontractor')}
                />
                {locale === 'he' ? 'קבלן משנה' : 'Subcontractor'}
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
              {locale === 'he' ? 'ספק / קבלן' : 'Vendor / subcontractor'} *
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
                {locale === 'he' ? 'סכום (₪)' : 'Amount (₪)'} *
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
                {locale === 'he' ? 'מספר חשבונית' : 'Invoice #'}
                <input
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
                {locale === 'he' ? 'תאריך' : 'Date'}
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
                {locale === 'he' ? 'פרויקט (אופציונלי)' : 'Project (optional)'}
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3"
                >
                  <option value="">{locale === 'he' ? '— ללא שיוך —' : '— Unassigned —'}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
              {locale === 'he' ? 'הערות' : 'Notes'}
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3"
              />
            </label>
            {err && <p className="text-center text-sm text-red-600">{err}</p>}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="min-h-12 rounded-[32px] bg-[#004694] px-8 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving ? '…' : locale === 'he' ? 'שמור הוצאה' : 'Save expense'}
              </button>
            </div>
          </form>

          <section className="overflow-x-auto rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <caption className="sr-only">
                {locale === 'he' ? 'יומן הוצאות' : 'Expense log'}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'סוג' : 'Type'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'ספק' : 'Vendor'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'סכום' : 'Amount'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'חשבונית' : 'Invoice'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'תאריך' : 'Date'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'פרויקט' : 'Project'}</th>
                  <th className="p-3 text-center font-bold">{locale === 'he' ? 'הערות' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-[#FDFDFD]">
                    <td className="p-3 text-center capitalize">{r.expenseType || '—'}</td>
                    <td className="p-3 text-center font-medium">{r.vendor}</td>
                    <td className="p-3 text-center font-semibold text-[#004694]">
                      {num(r.amount).toLocaleString()} ₪
                    </td>
                    <td className="p-3 text-center">{r.invoiceRef || '—'}</td>
                    <td className="p-3 text-center">{r.expenseDate || '—'}</td>
                    <td className="p-3 text-center text-slate-600">
                      {r.projectId ? projects.find((p) => p.id === r.projectId)?.name || r.projectId : '—'}
                    </td>
                    <td className="max-w-[200px] truncate p-3 text-center text-xs text-slate-500" title={r.notes}>
                      {r.notes?.trim() || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td
                      colSpan={2}
                      className="p-3 text-center text-xs font-bold uppercase text-slate-500"
                    >
                      {locale === 'he' ? `סה״כ ${rows.length} רשומות` : `Total ${rows.length} rows`}
                    </td>
                    <td className="p-3 text-center text-sm font-black text-[#004694]">
                      {rows.reduce((s, r) => s + num(r.amount), 0).toLocaleString()} ₪
                    </td>
                    <td colSpan={4} className="p-3 text-center text-xs text-slate-400">
                      bsd-ybm
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            {rows.length === 0 && (
              <p className="py-8 text-center text-slate-400">{locale === 'he' ? 'אין רשומות' : 'No entries yet'}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
