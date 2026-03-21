'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import EnSignedInGate from '@/components/en/EnSignedInGate';
import { useCompany } from '@/context/CompanyContext';
import { bsdErpBrainConfigRef, companyErpSettingsBrainRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

type Brain = {
  whitelistEmails?: string[];
  defaultTaxPercent?: number;
  referenceDailyRate?: number;
};

type CompanyErp = {
  taxPercent?: number;
  referenceDailyRate?: number;
};

function EnSettingsInner() {
  const { companyId, companies, isMasterAdmin, isCompanyAdmin } = useCompany();
  const isClient =
    Boolean(companyId) &&
    companies.some((c) => c.companyId === companyId && c.role === 'client');

  const [whitelistText, setWhitelistText] = useState('');
  const [globalTax, setGlobalTax] = useState('10');
  const [globalRate, setGlobalRate] = useState('0');
  const [brainMsg, setBrainMsg] = useState<string | null>(null);

  const [coTax, setCoTax] = useState('');
  const [coRate, setCoRate] = useState('');
  const [coMsg, setCoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !isMasterAdmin) return;
    return onSnapshot(bsdErpBrainConfigRef(), (snap) => {
      const d = (snap.data() as Brain) ?? {};
      setWhitelistText((d.whitelistEmails ?? []).join('\n'));
      setGlobalTax(String(d.defaultTaxPercent ?? 10));
      setGlobalRate(String(d.referenceDailyRate ?? 0));
    });
  }, [isMasterAdmin]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || isClient) return;
    const ref = companyErpSettingsBrainRef(companyId);
    return onSnapshot(ref, (snap) => {
      const d = (snap.data() as CompanyErp) ?? {};
      setCoTax(d.taxPercent != null ? String(d.taxPercent) : '');
      setCoRate(d.referenceDailyRate != null ? String(d.referenceDailyRate) : '');
    });
  }, [companyId, isClient]);

  const saveBrain = async () => {
    setBrainMsg(null);
    if (!isFirebaseConfigured() || !isMasterAdmin) return;
    const emails = whitelistText
      .split(/[\n,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((e) => e.includes('@'));
    const tax = Number(globalTax.replace(/,/g, ''));
    const rate = Number(globalRate.replace(/,/g, ''));
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      setBrainMsg('אחוז מס חייב להיות בין 0 ל־100.');
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      setBrainMsg('תעריף יומי חייב להיות מספר תקין.');
      return;
    }
    try {
      await setDoc(bsdErpBrainConfigRef(), {
        whitelistEmails: emails,
        defaultTaxPercent: tax,
        referenceDailyRate: rate,
        updatedAt: serverTimestamp(),
      });
      setBrainMsg('נשמר. הרשימה הלבנה מתמזגת עם סביבת השרת בבדיקת ההתחברות הבאה.');
    } catch {
      setBrainMsg('השמירה נכשלה.');
    }
  };

  const saveCompany = async () => {
    setCoMsg(null);
    if (!companyId || !isFirebaseConfigured() || !isCompanyAdmin || isClient) return;
    const tax = coTax.trim() === '' ? null : Number(coTax.replace(/,/g, ''));
    const rate = coRate.trim() === '' ? null : Number(coRate.replace(/,/g, ''));
    if (tax != null && (!Number.isFinite(tax) || tax < 0 || tax > 100)) {
      setCoMsg('מס חייב להיות 0–100 או ריק לברירת מחדל גלובלית.');
      return;
    }
    if (rate != null && (!Number.isFinite(rate) || rate < 0)) {
      setCoMsg('תעריף לא תקין.');
      return;
    }
    try {
      await setDoc(companyErpSettingsBrainRef(companyId), {
        taxPercent: tax ?? undefined,
        referenceDailyRate: rate ?? undefined,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setCoMsg('ברירות המחדל של החברה נשמרו.');
    } catch {
      setCoMsg('השמירה נכשלה.');
    }
  };

  const canSeeAnything = isMasterAdmin || (isCompanyAdmin && companyId && !isClient);

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 pb-20 text-[#1a1a1a] sm:p-8 md:p-12" dir="rtl">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">bsd-ybm</p>
          <h1 className="text-3xl font-black text-[#001A4D] sm:text-4xl">הגדרות ERP ומוח מערכת</h1>
          <p className="max-w-md text-sm text-gray-500">
            רשימת אימיילים מורשים (מתמזגת עם סביבת השרת בהתחברות), מס ברירת מחדל ותעריף יומי ייחוס — לשכר ולחישובים.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-[32px] border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-[#004694] shadow-sm hover:bg-gray-50"
            >
              דשבורד
            </Link>
            <Link
              href="/en/payroll"
              className="inline-flex min-h-12 items-center justify-center rounded-[32px] border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-[#004694] shadow-sm hover:bg-gray-50"
            >
              מקאנו שכר
            </Link>
          </div>
        </header>

        {!canSeeAnything && (
          <section className="rounded-[32px] border border-gray-200 bg-white p-8 text-center text-gray-500">
            נדרשת הרשאת מנהל חברה או מאסטר כדי לערוך הגדרות ERP.
          </section>
        )}

        {isMasterAdmin && (
          <section className="flex flex-col gap-6 rounded-[32px] border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-center text-lg font-black text-[#004694]">מאסטר — רשימה לבנה וקבועים גלובליים</h2>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
              אימיילים מורשים (שורה לכל כתובת)
              <textarea
                value={whitelistText}
                onChange={(e) => setWhitelistText(e.target.value)}
                rows={6}
                className="rounded-[32px] border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-700"
                placeholder="user@company.com"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                מס ברירת מחדל % (ניכוי בשכר)
                <input
                  value={globalTax}
                  onChange={(e) => setGlobalTax(e.target.value)}
                  className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                תעריף יומי ייחוס (₪)
                <input
                  value={globalRate}
                  onChange={(e) => setGlobalRate(e.target.value)}
                  className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3"
                />
              </label>
            </div>
            {brainMsg && <p className="text-center text-sm text-amber-700">{brainMsg}</p>}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void saveBrain()}
                className="min-h-12 rounded-[32px] border border-[#004694] bg-[#004694] px-8 py-3 font-black text-white hover:opacity-90"
              >
                שמירת הגדרות מאסטר
              </button>
            </div>
          </section>
        )}

        {isCompanyAdmin && companyId && !isClient && (
          <section className="flex flex-col gap-6 rounded-[32px] border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-center text-lg font-black text-[#004694]">עקיפות לפי חברה</h2>
            <p className="text-center text-xs text-slate-500">מזהה חברה: {companyId}</p>
            <p className="text-center text-sm text-gray-500">
              השאירו ריק כדי להשתמש בברירות המחדל הגלובליות מהמאסטר (ממוזג דרך ה-API לשכר).
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                אחוז מס לחברה זו
                <input
                  value={coTax}
                  onChange={(e) => setCoTax(e.target.value)}
                  placeholder="למשל 12"
                  className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-600">
                תעריף יומי ייחוס (₪)
                <input
                  value={coRate}
                  onChange={(e) => setCoRate(e.target.value)}
                  className="min-h-12 rounded-[32px] border border-gray-200 bg-white px-4 py-3"
                />
              </label>
            </div>
            {coMsg && <p className="text-center text-sm text-emerald-700">{coMsg}</p>}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void saveCompany()}
                className="min-h-12 rounded-[32px] bg-[#004694] px-8 py-3 font-black text-white hover:opacity-90"
              >
                שמירת ברירות מחדל לחברה
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function EnSettingsPage() {
  return (
    <EnSignedInGate>
      <EnSettingsInner />
    </EnSignedInGate>
  );
}
