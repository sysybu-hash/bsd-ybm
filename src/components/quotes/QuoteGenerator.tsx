'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  doc,
  limit,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useSubscription } from '@/hooks/useSubscription';
import { getDb, companyQuotesRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import SignaturePad from '@/components/contracts/SignaturePad';
import { renderQuoteSignedPdfBlob, type QuoteSignedPdfMeta } from '@/services/reports/PdfGeneratorService';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

type QuoteDoc = {
  id: string;
  title: string;
  projectId: string;
  lines: { label: string; amount: number }[];
  total: number;
  status: 'draft' | 'awaiting_signature' | 'approved';
};

function formatSignedAt(d: Date): string {
  return d.toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    dateStyle: 'full',
    timeStyle: 'long',
  });
}

export default function QuoteGenerator({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { companyId, companies, isCompanyAdmin, isGlobalStaff } = useCompany();
  const { branding } = useSubscription();

  const isClient = useMemo(
    () => Boolean(companyId && companies.some((c) => c.companyId === companyId && c.role === 'client')),
    [companyId, companies]
  );

  const [quotes, setQuotes] = useState<QuoteDoc[]>([]);
  const [title, setTitle] = useState('הצעת מחיר');
  const [lineLabel, setLineLabel] = useState('');
  const [lineAmount, setLineAmount] = useState('');
  const [lines, setLines] = useState<{ label: string; amount: number }[]>([]);
  const [sig, setSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!companyId || !projectId || !isFirebaseConfigured()) return;
    const pref = doc(getDb(), 'companies', companyId, 'projects', projectId);
    const unsub = onSnapshot(pref, (snap) => {
      const d = snap.data() as { name?: string } | undefined;
      setProjectName(String(d?.name ?? projectId));
    });
    return () => unsub();
  }, [companyId, projectId]);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) return;
    const q = query(companyQuotesRef(companyId), limit(80));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: QuoteDoc[] = [];
        snap.forEach((d) => {
          const x = d.data() as Record<string, unknown>;
          if (String(x.projectId ?? '') !== projectId) return;
          rows.push({
            id: d.id,
            title: String(x.title ?? ''),
            projectId: String(x.projectId ?? ''),
            lines: Array.isArray(x.lines) ? (x.lines as { label: string; amount: number }[]) : [],
            total: typeof x.total === 'number' ? x.total : 0,
            status: (x.status as QuoteDoc['status']) ?? 'draft',
          });
        });
        rows.sort((a, b) => b.id.localeCompare(a.id));
        setQuotes(rows);
      },
      () => setQuotes([])
    );
    return () => unsub();
  }, [companyId, projectId]);

  const pendingForSign = useMemo(
    () => quotes.find((q) => q.status === 'awaiting_signature'),
    [quotes]
  );

  const addLine = () => {
    const amt = Number(String(lineAmount).replace(/,/g, ''));
    if (!lineLabel.trim() || !Number.isFinite(amt)) return;
    setLines((prev) => [...prev, { label: lineLabel.trim(), amount: Math.round(amt * 100) / 100 }]);
    setLineLabel('');
    setLineAmount('');
  };

  const totalPreview = useMemo(
    () => lines.reduce((s, l) => s + l.amount, 0),
    [lines]
  );

  const canEditQuotes = isCompanyAdmin || isGlobalStaff;

  const saveDraft = useCallback(async () => {
    if (!user || !companyId || !canEditQuotes || !projectId) return;
    if (!title.trim() || lines.length === 0) {
      setMsg('הוסיפו כותרת ולפחות שורה אחת.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await addDoc(collection(getDb(), 'companies', companyId, 'quotes'), {
        title: title.trim(),
        projectId,
        lines,
        total: totalPreview,
        status: 'draft',
        companyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdByUid: user.uid,
      });
      setLines([]);
      setMsg('הצעת המחיר נשמרה כטיוטה.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  }, [user, companyId, canEditQuotes, projectId, title, lines, totalPreview]);

  const sendForSignature = useCallback(
    async (quote: QuoteDoc) => {
      if (!user || !companyId || !canEditQuotes || quote.status !== 'draft') return;
      setBusy(true);
      setMsg(null);
      try {
        await setDoc(
          doc(getDb(), 'companies', companyId, 'quotes', quote.id),
          { status: 'awaiting_signature', updatedAt: serverTimestamp() },
          { merge: true }
        );
        setMsg('נשלח לחתימת לקוח.');
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'שגיאה');
      } finally {
        setBusy(false);
      }
    },
    [user, companyId, canEditQuotes]
  );

  const signQuote = async () => {
    if (!user || !companyId || !projectId || !pendingForSign || !sig) {
      setMsg('חסרה חתימה או הצעה ממתינה.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' }).catch(() => null);
      const ipJson = ipRes ? await ipRes.json().catch(() => ({})) : {};
      const ip = typeof (ipJson as { ip?: string }).ip === 'string' ? (ipJson as { ip: string }).ip : '—';

      const meta: QuoteSignedPdfMeta = {
        quoteTitle: pendingForSign.title,
        lines: pendingForSign.lines,
        total: pendingForSign.total,
        signatureDataUrl: sig,
        signedAtIso: formatSignedAt(new Date()),
        ip,
        signerEmail: user.email ?? undefined,
        projectName,
        companyDisplayName: branding.legalName || branding.displayName || 'BSD-YBM AI Solutions',
        headerLogoUrl: branding.logoUrl,
      };

      const blob = await renderQuoteSignedPdfBlob(meta);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result ?? ''));
        r.onerror = () => reject(new Error('read_failed'));
        r.readAsDataURL(blob);
      });

      const token = await user.getIdToken();
      const res = await fetch('/api/quotes/complete-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          companyId,
          projectId,
          quoteId: pendingForSign.id,
          pdfBase64: dataUrl,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((json as { error?: string }).error ?? 'שמירה נכשלה');
        return;
      }
      setMsg('ההצעה אושרה, נוצר PDF ונשלחה התראה (אם הוגדרה).');
      setSig(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  if (!companyId) return null;

  if (isClient) {
    if (!pendingForSign) {
      return (
        <section
          className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-[#FDFDFD] p-6 text-center"
          dir="rtl"
        >
          <p className="text-sm text-gray-600">אין הצעת מחיר הממתינה לחתימה.</p>
        </section>
      );
    }
    return (
      <section
        className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 rounded-[32px] border border-[#001A4D]/20 bg-white p-6 shadow-sm sm:p-8"
        dir="rtl"
      >
        <h2 className="text-xl font-black text-[#001A4D]">חתימה על הצעת מחיר</h2>
        <p className="text-center text-sm font-bold text-gray-700">{pendingForSign.title}</p>
        <ul className="w-full max-w-md text-right text-sm">
          {pendingForSign.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-4 border-b border-gray-100 py-2">
              <span>{l.label}</span>
              <span className="font-mono">{l.amount.toLocaleString('he-IL')} ₪</span>
            </li>
          ))}
        </ul>
        <p className="text-lg font-black text-[#001A4D]">סה״כ: {pendingForSign.total.toLocaleString('he-IL')} ₪</p>
        <SignaturePad onChange={setSig} />
        <button
          type="button"
          disabled={busy || !sig}
          onClick={() => void signQuote()}
          className="min-h-12 w-full max-w-xs rounded-[32px] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
          style={{ backgroundColor: MEUHEDET.orange }}
        >
          {busy ? 'שומר…' : 'אשר והפק חוזה'}
        </button>
        {msg ? <p className="text-center text-sm font-bold text-[#001A4D]">{msg}</p> : null}
      </section>
    );
  }

  if (!canEditQuotes) return null;

  return (
    <section className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 rounded-[32px] border border-gray-200 bg-white p-6 sm:p-8" dir="rtl">
      <h2 className="text-xl font-black text-[#001A4D]">הצעות מחיר</h2>
      <div className="flex w-full max-w-md flex-col gap-4">
        <label className="text-sm font-bold text-gray-700">
          כותרת
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-[32px] border border-gray-200 px-4 py-3 text-center"
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={lineLabel}
            onChange={(e) => setLineLabel(e.target.value)}
            placeholder="תיאור שורה"
            className="min-h-12 flex-1 rounded-[32px] border border-gray-200 px-4 py-3 text-sm"
          />
          <input
            value={lineAmount}
            onChange={(e) => setLineAmount(e.target.value)}
            placeholder="סכום"
            type="text"
            inputMode="decimal"
            className="min-h-12 w-full rounded-[32px] border border-gray-200 px-4 py-3 text-sm sm:w-32"
          />
          <button type="button" onClick={addLine} className="min-h-12 rounded-[32px] bg-gray-100 px-4 text-sm font-bold">
            הוסף
          </button>
        </div>
        {lines.length > 0 ? (
          <ul className="text-sm">
            {lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-4 py-1">
                <span>{l.label}</span>
                <span>{l.amount.toLocaleString('he-IL')} ₪</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-center font-black text-[#001A4D]">סה״כ טיוטה: {totalPreview.toLocaleString('he-IL')} ₪</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveDraft()}
          className="min-h-12 rounded-[32px] px-6 font-black text-white"
          style={{ backgroundColor: MEUHEDET.blue }}
        >
          שמירת טיוטה
        </button>
      </div>

      <ul className="flex w-full max-w-lg flex-col gap-4">
        {quotes.map((q) => (
          <li
            key={q.id}
            className="flex flex-col items-center justify-center gap-3 rounded-[32px] border border-gray-100 p-4 text-center"
          >
            <p className="font-bold text-[#001A4D]">{q.title}</p>
            <p className="text-xs text-gray-500">סטטוס: {q.status}</p>
            {q.status === 'draft' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void sendForSignature(q)}
                className="min-h-11 rounded-[32px] px-6 text-sm font-black text-white"
                style={{ backgroundColor: MEUHEDET.orange }}
              >
                שלח לחתימת לקוח
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {msg ? <p className="text-center text-sm font-bold">{msg}</p> : null}
    </section>
  );
}
