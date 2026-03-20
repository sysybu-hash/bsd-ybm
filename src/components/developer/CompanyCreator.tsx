'use client';

import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { TenantPlan } from '@/types/subscription';

const DEFAULT_PRIMARY = '#004694';
const DEFAULT_SECONDARY = '#C9A227';

type FormState = {
  legalName: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  plan: TenantPlan;
};

const initialForm: FormState = {
  legalName: '',
  displayName: '',
  primaryColor: DEFAULT_PRIMARY,
  secondaryColor: DEFAULT_SECONDARY,
  logoUrl: '',
  plan: 'basic',
};

/**
 * Developer-only: create `companies/{id}` plus `settings/general` and admin membership for the creator.
 */
type CompanyCreatorProps = {
  onCreated?: (companyId: string) => void;
};

export default function CompanyCreator({ onCreated }: CompanyCreatorProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const submit = async () => {
    if (!user) {
      setMessage('יש להתחבר כמפתח.');
      return;
    }
    if (!form.legalName.trim() || !form.displayName.trim()) {
      setMessage('שם משפטי ושם תצוגה נדרשים.');
      return;
    }
    if (!isFirebaseConfigured()) {
      setMessage('Firebase לא מוגדר.');
      return;
    }

    setBusy(true);
    setMessage(null);
    setCreatedId(null);

    try {
      const db = getDb();
      const companiesCol = collection(db, 'companies');
      const newCompanyId = doc(companiesCol).id;
      const batch = writeBatch(db);

      const companyRef = doc(db, 'companies', newCompanyId);
      batch.set(companyRef, {
        legalName: form.legalName.trim(),
        displayName: form.displayName.trim(),
        name: form.displayName.trim(),
        primaryColor: form.primaryColor.trim() || DEFAULT_PRIMARY,
        secondaryColor: form.secondaryColor.trim() || DEFAULT_SECONDARY,
        logoUrl: form.logoUrl.trim() || null,
        plan: form.plan,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, 'companies', newCompanyId, 'settings', 'general'), {
        initializedAt: serverTimestamp(),
        plan: form.plan,
        displayName: form.displayName.trim(),
        logoUrl: form.logoUrl.trim() || null,
        primaryColor: form.primaryColor.trim() || DEFAULT_PRIMARY,
        secondaryColor: form.secondaryColor.trim() || DEFAULT_SECONDARY,
      });

      batch.set(doc(db, 'companies', newCompanyId, 'branding', 'theme'), {
        primaryColor: form.primaryColor.trim() || DEFAULT_PRIMARY,
        secondaryColor: form.secondaryColor.trim() || DEFAULT_SECONDARY,
        logoUrl: form.logoUrl.trim() || null,
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, 'companies', newCompanyId, 'members', user.uid), {
        role: 'admin',
        displayName: user.displayName || user.email || 'Admin',
        active: true,
        companyId: newCompanyId,
        createdAt: serverTimestamp(),
      });

      batch.set(doc(db, 'users', user.uid, 'companies', newCompanyId), {
        companyId: newCompanyId,
        role: 'admin',
        displayName: form.displayName.trim(),
        active: true,
      });

      await batch.commit();
      setCreatedId(newCompanyId);
      setMessage(`חברה נוצרה. מזהה: ${newCompanyId}`);
      setForm(initialForm);
      onCreated?.(newCompanyId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'יצירה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="flex w-full flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="company-creator-heading"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="rounded-4xl bg-[var(--brand-primary,#004694)]/10 p-3">
          <Building2 className="h-8 w-8 text-[var(--brand-primary,#004694)]" aria-hidden />
        </div>
        <h2 id="company-creator-heading" className="text-center text-lg font-black text-[#1a1a1a]">
          יצירת חברה חדשה (BSD-YBM)
        </h2>
        <p className="max-w-md text-center text-xs text-gray-500">
          נרשם מסמך ב־<code className="font-mono">companies/&#123;id&#125;</code>, הגדרות ב־
          <code className="font-mono">settings/general</code>, וחברות מנהל למפתח היוצר.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col items-center justify-center gap-4">
        <label className="flex w-full flex-col items-center gap-2 text-center text-xs font-bold text-gray-600">
          שם משפטי
          <input
            value={form.legalName}
            onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
            className="min-h-12 w-full rounded-4xl border border-gray-200 px-4 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,#FF8C00)]"
            dir="rtl"
            autoComplete="organization"
          />
        </label>
        <label className="flex w-full flex-col items-center gap-2 text-center text-xs font-bold text-gray-600">
          שם תצוגה
          <input
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            className="min-h-12 w-full rounded-4xl border border-gray-200 px-4 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,#FF8C00)]"
            dir="rtl"
          />
        </label>
        <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
          <label className="flex flex-1 flex-col items-center gap-2 text-center text-xs font-bold text-gray-600">
            צבע ראשי
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              className="h-12 w-full min-w-[120px] cursor-pointer rounded-4xl border border-gray-200 bg-[#FDFDFD]"
              aria-label="צבע ראשי"
            />
          </label>
          <label className="flex flex-1 flex-col items-center gap-2 text-center text-xs font-bold text-gray-600">
            צבע משני
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
              className="h-12 w-full min-w-[120px] cursor-pointer rounded-4xl border border-gray-200 bg-[#FDFDFD]"
              aria-label="צבע משני"
            />
          </label>
        </div>
        <label className="flex w-full flex-col items-center gap-2 text-center text-xs font-bold text-gray-600">
          כתובת לוגו (URL)
          <input
            type="url"
            dir="ltr"
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://…"
            className="min-h-12 w-full rounded-4xl border border-gray-200 px-4 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,#FF8C00)]"
          />
        </label>
        <label className="flex w-full flex-col items-center gap-2 text-center text-xs font-bold text-gray-600">
          תוכנית
          <select
            value={form.plan}
            onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as TenantPlan }))}
            className="min-h-12 w-full rounded-4xl border border-gray-200 bg-[#FDFDFD] px-4 text-center text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,#FF8C00)]"
          >
            <option value="basic">Basic — נוכחות, ציר זמן</option>
            <option value="pro">Pro — + פיננסים, דוחות</option>
            <option value="alloy">Alloy — + סריקת AI רב-מנוע, AI Referee</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="min-h-12 w-full max-w-xs rounded-4xl px-8 font-bold text-white shadow-lg transition-opacity disabled:opacity-50"
        style={{
          backgroundColor: 'var(--brand-accent, #FF8C00)',
          boxShadow: '0 0 24px color-mix(in srgb, var(--brand-accent, #FF8C00) 45%, transparent)',
        }}
      >
        {busy ? 'יוצר…' : 'צור חברה'}
      </button>

      {message && (
        <p className="w-full rounded-4xl border border-gray-100 bg-[#FDFDFD] py-3 text-center text-sm text-gray-700">
          {message}
        </p>
      )}
      {createdId && (
        <p className="text-center font-mono text-xs text-gray-500" dir="ltr">
          {createdId}
        </p>
      )}
    </section>
  );
}
