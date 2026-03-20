'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useSubscription } from '@/hooks/useSubscription';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { fillContractTemplate } from '@/lib/contracts/placeholders';
import SignaturePad from '@/components/contracts/SignaturePad';
import { renderSignedContractPdfBlob, type SignedContractPdfMeta } from '@/services/reports/PdfGeneratorService';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

function formatSignedAtAsiaJerusalem(d: Date): string {
  return d.toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    dateStyle: 'full',
    timeStyle: 'long',
  });
}

type ProjectSnap = {
  name?: string;
  plSummary?: { budgetedCost?: number };
  budget?: number;
  budgetedTotal?: number;
  startDate?: string;
  endDate?: string;
  targetEndDate?: string;
  contractSignedAt?: unknown;
  contractPdfStoragePath?: string;
};

export default function ContractSignOff({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { companyId, companies } = useCompany();
  const { branding } = useSubscription();

  const isClient = useMemo(
    () => Boolean(companyId && companies.some((c) => c.companyId === companyId && c.role === 'client')),
    [companyId, companies]
  );

  const [templateHtml, setTemplateHtml] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectSnap | null>(null);
  const [filled, setFilled] = useState('');
  const [sig, setSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) return;
    const tref = doc(getDb(), 'companies', companyId, 'templates', 'contract');
    const unsub = onSnapshot(tref, (snap) => {
      const d = snap.data() as { bodyHtml?: string } | undefined;
      setTemplateHtml(d?.bodyHtml ?? null);
    });
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !projectId || !isFirebaseConfigured()) return;
    const pref = doc(getDb(), 'companies', companyId, 'projects', projectId);
    const unsub = onSnapshot(pref, (snap) => {
      setProject(snap.exists() ? (snap.data() as ProjectSnap) : null);
    });
    return () => unsub();
  }, [companyId, projectId]);

  useEffect(() => {
    if (!templateHtml || !project) {
      setFilled('');
      return;
    }
    const pl = project.plSummary ?? {};
    const budgetRaw =
      typeof pl.budgetedCost === 'number'
        ? pl.budgetedCost
        : typeof project.budgetedTotal === 'number'
          ? project.budgetedTotal
          : typeof project.budget === 'number'
            ? project.budget
            : 0;
    const budget =
      budgetRaw > 0
        ? Math.round(budgetRaw).toLocaleString('he-IL')
        : '—';
    const html = fillContractTemplate(templateHtml, {
      projectName: String(project.name ?? projectId),
      projectBudget: budget,
      projectStartDate: String(project.startDate ?? '—'),
      projectEndDate: String(project.endDate ?? project.targetEndDate ?? '—'),
      companyName: branding.legalName || branding.displayName || 'BSD-YBM AI Solutions',
      clientName: user?.displayName || user?.email || '—',
    });
    setFilled(html);
  }, [templateHtml, project, projectId, branding.displayName, branding.legalName, user?.displayName, user?.email]);

  const alreadySigned = Boolean(project?.contractSignedAt);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user || !companyId || !projectId || isClient || !project?.contractPdfStoragePath) {
        setDownloadUrl(null);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch(
          `/api/contracts/download-url?${new URLSearchParams({ companyId, projectId })}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const j = await res.json();
        if (!cancelled && res.ok && j.url) setDownloadUrl(j.url);
        else if (!cancelled) setDownloadUrl(null);
      } catch {
        if (!cancelled) setDownloadUrl(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, companyId, projectId, isClient, project?.contractPdfStoragePath]);

  const sign = async () => {
    if (!user || !companyId || !projectId || !sig || !filled) {
      setMsg('חסרה חתימה או תוכן הסכם.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' }).catch(() => null);
      const ipJson = ipRes ? await ipRes.json().catch(() => ({})) : {};
      const ip = typeof (ipJson as { ip?: string }).ip === 'string' ? (ipJson as { ip: string }).ip : '—';

      const meta: SignedContractPdfMeta = {
        bodyHtml: filled,
        signatureDataUrl: sig,
        signedAtIso: formatSignedAtAsiaJerusalem(new Date()),
        ip,
        signerEmail: user.email ?? undefined,
        projectName: String(project?.name ?? projectId),
        companyDisplayName: branding.legalName || branding.displayName || 'BSD-YBM AI Solutions',
        headerLogoUrl: branding.logoUrl,
      };

      const blob = await renderSignedContractPdfBlob(meta);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result ?? ''));
        r.onerror = () => reject(new Error('read_failed'));
        r.readAsDataURL(blob);
      });

      const token = await user.getIdToken();
      const res = await fetch('/api/contracts/complete-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          companyId,
          projectId,
          pdfBase64: dataUrl,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((json as { error?: string }).error ?? 'שמירה נכשלה');
        return;
      }
      setMsg('ההסכם נחתם ונשמר. תודה!');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  if (!companyId) return null;

  if (!templateHtml) {
    return (
      <section
        className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-[32px] border border-amber-200 bg-amber-50/80 p-6 text-center"
        dir="rtl"
      >
        <p className="text-sm font-bold text-amber-900">אין עדיין תבנית הסכם — מנהל המערכת יגדיר בהגדרות → חוזים דיגיטליים.</p>
      </section>
    );
  }

  if (alreadySigned) {
    return (
      <section
        className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-[32px] border border-emerald-200 bg-emerald-50/80 p-6 text-center"
        dir="rtl"
      >
        <p className="text-lg font-black text-emerald-900">הסכם נחתם</p>
        <p className="text-xs text-emerald-800">מסמך PDF מאובטח נשמר במערכת.</p>
        {!isClient && downloadUrl ? (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[32px] px-6 py-3 text-sm font-black text-white"
            style={{ backgroundColor: MEUHEDET.blue }}
          >
            הורדת PDF חתום
          </a>
        ) : null}
      </section>
    );
  }

  if (!isClient) {
    return (
      <section
        className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-[#FDFDFD] p-6 text-center"
        dir="rtl"
      >
        <p className="text-sm font-bold text-gray-700">חתימת לקוח תופיע כאן כאשר משתמש עם הרשאת לקוח ייכנס לפרויקט.</p>
      </section>
    );
  }

  return (
    <section
      className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 rounded-[32px] border border-[#001A4D]/20 bg-white p-6 shadow-sm sm:p-8"
      style={{ boxShadow: '0 8px 32px rgba(0,26,77,0.08)' }}
      dir="rtl"
    >
      <div className="flex flex-col items-center justify-center gap-4">
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt=""
            className="h-16 max-w-[200px] object-contain"
          />
        ) : (
          <span className="text-sm font-black text-[#001A4D]">{branding.displayName || 'BSD-YBM AI Solutions'}</span>
        )}
        <h2 className="text-xl font-black text-[#001A4D]">חדר חתימה דיגיטלית</h2>
      </div>

      <div
        className="max-w-none text-right text-sm leading-relaxed text-[#1a1a1a] [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-[#001A4D] [&_p]:my-2"
        dangerouslySetInnerHTML={{ __html: filled }}
      />

      <div className="w-full border-t border-gray-100 pt-6">
        <p className="mb-4 text-center text-sm font-bold text-[#001A4D]">חתימה</p>
        <SignaturePad onChange={setSig} />
      </div>

      <button
        type="button"
        disabled={busy || !sig}
        onClick={() => void sign()}
        className="min-h-12 w-full max-w-xs rounded-[32px] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
        style={{ backgroundColor: MEUHEDET.orange }}
      >
        {busy ? 'שומר…' : 'אישור וחתימה'}
      </button>
      {msg ? (
        <p className="text-center text-sm font-bold text-[#001A4D]" role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}

