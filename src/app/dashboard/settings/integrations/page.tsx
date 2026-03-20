'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useLocale } from '@/context/LocaleContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { isMeckanoModuleEnabled } from '@/lib/integrations/meckanoModule';

const BRAND = '#004694';

function pickStoredKey(d: Record<string, unknown> | undefined): boolean {
  if (!d) return false;
  const k = [d.meckanoApiKey, d.meckanoKey, d.key].find((x) => typeof x === 'string' && (x as string).trim());
  return Boolean(k);
}

export default function CompanyIntegrationsSettingsPage() {
  const { companyId, isCompanyAdmin } = useCompany();
  const { user } = useAuth();
  const { t, dir } = useLocale();

  const [keyInput, setKeyInput] = useState('');
  const [integrationsData, setIntegrationsData] = useState<Record<string, unknown> | undefined>(undefined);
  const [companyMeckanoLegacy, setCompanyMeckanoLegacy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [moduleBusy, setModuleBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [lastTestEmployeeCount, setLastTestEmployeeCount] = useState<number | null>(null);

  const hasStoredKey = pickStoredKey(integrationsData);
  const moduleOn = useMemo(
    () =>
      isMeckanoModuleEnabled(integrationsData, {
        meckanoIntegrationActive: companyMeckanoLegacy,
      }),
    [integrationsData, companyMeckanoLegacy]
  );

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setIntegrationsData(undefined);
      return;
    }
    const ref = doc(getDb(), 'companies', companyId, 'settings', 'integrations');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setIntegrationsData(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined);
      },
      () => setIntegrationsData(undefined)
    );
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setCompanyMeckanoLegacy(false);
      return;
    }
    const cref = doc(getDb(), 'companies', companyId);
    const unsub = onSnapshot(
      cref,
      (snap) => {
        const d = snap.data() as Record<string, unknown> | undefined;
        setCompanyMeckanoLegacy(Boolean(d?.meckanoIntegrationActive));
      },
      () => setCompanyMeckanoLegacy(false)
    );
    return () => unsub();
  }, [companyId]);

  const persistMeckanoActive = async (active: boolean) => {
    if (!user?.uid || !companyId) return;
    setModuleBusy(true);
    setBanner(null);
    try {
      const db = getDb();
      const batch = writeBatch(db);
      batch.set(
        doc(db, 'companies', companyId, 'settings', 'integrations'),
        {
          meckano: { active },
          updatedAt: serverTimestamp(),
          updatedByUid: user.uid,
        },
        { merge: true }
      );
      batch.set(
        doc(db, 'companies', companyId),
        {
          meckanoIntegrationActive: active,
          meckanoIntegrationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await batch.commit();
      setBanner({ kind: 'ok', text: t('settings.integrations.meckanoOptInSaved') });
    } catch {
      setBanner({ kind: 'err', text: t('settings.integrations.saveFail') });
    } finally {
      setModuleBusy(false);
    }
  };

  const runTest = async () => {
    setBanner(null);
    setLastTestEmployeeCount(null);
    if (!user || !companyId) return;
    setTesting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/meckano/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          apiKey: keyInput.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        employeeCount?: number;
      };
      if (!res.ok) {
        setBanner({ kind: 'err', text: data.error || t('settings.integrations.testFail') });
        return;
      }
      if (data.ok) {
        setLastTestEmployeeCount(typeof data.employeeCount === 'number' ? data.employeeCount : null);
        setBanner({
          kind: 'ok',
          text:
            `${t('settings.integrations.testOk')}` +
            (typeof data.employeeCount === 'number'
              ? ` — ${t('settings.integrations.employees')}: ${data.employeeCount}`
              : ''),
        });
      } else {
        setBanner({ kind: 'err', text: data.error || t('settings.integrations.testFail') });
      }
    } catch {
      setBanner({ kind: 'err', text: t('settings.integrations.testFail') });
    } finally {
      setTesting(false);
    }
  };

  const saveKey = async () => {
    setBanner(null);
    if (!user?.uid || !companyId) return;
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setBanner({ kind: 'err', text: t('settings.integrations.saveFail') });
      return;
    }
    setSaving(true);
    try {
      const db = getDb();
      const batch = writeBatch(db);
      batch.set(
        doc(db, 'companies', companyId, 'settings', 'integrations'),
        {
          meckanoApiKey: trimmed,
          meckano: { active: true },
          updatedAt: serverTimestamp(),
          updatedByUid: user.uid,
        },
        { merge: true }
      );
      batch.set(
        doc(db, 'companies', companyId),
        {
          meckanoIntegrationActive: true,
          meckanoIntegrationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await batch.commit();
      setKeyInput('');
      setBanner({ kind: 'ok', text: t('settings.integrations.saveOk') });
    } catch {
      setBanner({ kind: 'err', text: t('settings.integrations.saveFail') });
    } finally {
      setSaving(false);
    }
  };

  if (!isCompanyAdmin) {
    return (
      <div
        className="min-h-full bg-[#FDFDFD] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12"
        dir={dir}
      >
        <p className="text-center text-gray-600">{t('settings.integrations.adminOnly')}</p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-4xl px-6 text-sm font-bold text-[#004694]"
          >
            <ArrowRight className="h-4 w-4" />
            {t('settings.integrations.back')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-full bg-gradient-to-b from-[#FDFDFD] via-[#f8fafc] to-[#eef2f7] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12"
      dir={dir}
    >
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-4xl px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" />
          {t('settings.integrations.back')}
        </Link>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center gap-3 text-center">
        <div
          className="rounded-4xl border border-white/50 bg-white/50 p-4 shadow-lg backdrop-blur-xl"
          style={{ boxShadow: `0 12px 48px color-mix(in srgb, ${BRAND} 12%, transparent)` }}
        >
          <Sparkles className="h-9 w-9" style={{ color: BRAND }} aria-hidden />
        </div>
        <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl" style={{ color: BRAND }}>
          {t('settings.integrations.title')}
        </h1>
        <p className="max-w-lg text-sm text-gray-600">{t('settings.integrations.subtitle')}</p>
      </header>

      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6">
        {banner && (
          <div
            className={`w-full rounded-4xl border px-4 py-3 text-center text-sm font-semibold backdrop-blur-md ${
              banner.kind === 'ok'
                ? 'border-emerald-200/60 bg-emerald-50/80 text-emerald-900'
                : 'border-red-200/60 bg-red-50/80 text-red-900'
            }`}
            role="status"
          >
            {banner.text}
          </div>
        )}

        <section
          className="flex w-full flex-col items-center justify-center gap-6 rounded-4xl border border-white/50 bg-white/55 p-6 shadow-[0_12px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8"
        >
          <div className="flex w-full max-w-md flex-col items-center justify-center gap-4">
            <span className="text-center text-sm font-bold text-gray-700">
              {t('settings.integrations.meckanoOptIn')}
            </span>
            <p className="text-center text-xs text-gray-500">{t('settings.integrations.meckanoOptInHint')}</p>
            <button
              type="button"
              role="switch"
              aria-checked={moduleOn}
              disabled={moduleBusy || !companyId || !user}
              onClick={() => void persistMeckanoActive(!moduleOn)}
              className="flex min-h-12 w-full max-w-xs items-center justify-center rounded-4xl border border-gray-200 bg-[#FDFDFD] px-6 text-sm font-black text-[#1a1a1a] transition-opacity disabled:opacity-50"
            >
              {moduleBusy ? '…' : moduleOn ? t('settings.integrations.meckanoOn') : t('settings.integrations.meckanoOff')}
            </button>
          </div>

          <label className="flex w-full flex-col items-center justify-center gap-3 text-center">
            <span className="text-sm font-bold text-gray-700">{t('settings.integrations.keyLabel')}</span>
            <input
              type="password"
              autoComplete="off"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              disabled={!moduleOn}
              placeholder={t('settings.integrations.keyPlaceholder')}
              className="min-h-12 w-full max-w-md rounded-4xl border border-gray-200/80 bg-white/90 px-4 py-3 text-center text-sm text-[#1a1a1a] shadow-inner backdrop-blur-sm disabled:opacity-50"
            />
          </label>

          {!moduleOn && (
            <p className="text-center text-xs font-medium text-amber-800">{t('settings.integrations.meckanoEnableFirst')}</p>
          )}

          {hasStoredKey && (
            <p className="mt-4 text-center text-xs font-medium text-gray-500">{t('settings.integrations.keyHintStored')}</p>
          )}

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              disabled={testing || !companyId || !user || !moduleOn}
              onClick={() => void runTest()}
              className="inline-flex min-h-12 min-w-[160px] items-center justify-center rounded-4xl border border-gray-200/80 bg-white/80 px-6 text-sm font-bold text-[#1a1a1a] shadow-sm backdrop-blur-md transition-opacity disabled:opacity-50"
            >
              {testing ? '…' : t('settings.integrations.test')}
            </button>
            <button
              type="button"
              disabled={saving || !companyId || !user || !keyInput.trim() || !moduleOn}
              onClick={() => void saveKey()}
              className="inline-flex min-h-12 min-w-[160px] items-center justify-center rounded-4xl px-6 text-sm font-bold text-white shadow-lg transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: BRAND,
                boxShadow: `0 8px 28px color-mix(in srgb, ${BRAND} 35%, transparent)`,
              }}
            >
              {saving ? '…' : t('settings.integrations.save')}
            </button>
          </div>

          {lastTestEmployeeCount != null && (
            <p className="mt-6 text-center text-xs text-gray-500">
              {t('settings.integrations.employees')}: {lastTestEmployeeCount}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
