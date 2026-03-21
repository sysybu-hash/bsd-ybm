'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Crown, LineChart, Palette, ScrollText, Star } from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import SystemHealthTimeline from '@/components/owner/SystemHealthTimeline';
import { IS_OWNER } from '@/lib/ownerVault';
import { normalizeTenantPlan, type TenantPlan } from '@/types/subscription';

const LANDING_DOC = ['globalLandingBranding', 'default'] as const;
const CHANGELOG = 'developerChangeLog';

type CompanyRow = {
  id: string;
  displayName: string;
  plan: TenantPlan;
  freeForever: boolean;
};

type LogRow = {
  id: string;
  message: string;
  actorEmail: string;
  atLabel: string;
};

export default function OwnerZonePage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [landingLogo, setLandingLogo] = useState('');
  const [landingPrimary, setLandingPrimary] = useState('#c9a227');
  const [landingSecondary, setLandingSecondary] = useState('#004694');
  const [savingLanding, setSavingLanding] = useState(false);
  const [busyCompanyId, setBusyCompanyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const allowed = IS_OWNER(user?.email);

  const loadCompanies = useCallback(async () => {
    if (!isFirebaseConfigured() || !allowed) return;
    setLoadingCompanies(true);
    try {
      const snap = await getDocs(query(collection(getDb(), 'companies'), limit(500)));
      const rows: CompanyRow[] = [];
      snap.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        rows.push({
          id: d.id,
          displayName: String(data.displayName ?? data.name ?? d.id),
          plan: normalizeTenantPlan(data.plan),
          freeForever: data.ownerVaultFreeForever === true,
        });
      });
      rows.sort((a, b) => a.displayName.localeCompare(b.displayName, 'he'));
      setCompanies(rows);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'טעינת חברות נכשלה');
    } finally {
      setLoadingCompanies(false);
    }
  }, [allowed]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !allowed) return;
    const q = query(collection(getDb(), CHANGELOG), orderBy('createdAt', 'desc'), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: LogRow[] = [];
        snap.forEach((d) => {
          const x = d.data() as Record<string, unknown>;
          const ts = x.createdAt;
          let atLabel = '';
          if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
            try {
              atLabel = (ts as { toDate: () => Date }).toDate().toLocaleString('he-IL');
            } catch {
              atLabel = '';
            }
          }
          next.push({
            id: d.id,
            message: String(x.message ?? ''),
            actorEmail: String(x.actorEmail ?? ''),
            atLabel,
          });
        });
        setLogs(next);
      },
      () => setLogs([])
    );
    return () => unsub();
  }, [allowed]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !allowed) return;
    const ref = doc(getDb(), ...LANDING_DOC);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setLandingLogo('');
          setLandingPrimary('#c9a227');
          setLandingSecondary('#004694');
          return;
        }
        const d = snap.data() as Record<string, unknown>;
        setLandingLogo(typeof d.logoUrl === 'string' ? d.logoUrl : '');
        setLandingPrimary(typeof d.primaryColor === 'string' && d.primaryColor.trim() ? d.primaryColor.trim() : '#c9a227');
        setLandingSecondary(
          typeof d.secondaryColor === 'string' && d.secondaryColor.trim() ? d.secondaryColor.trim() : '#004694'
        );
      },
      () => {}
    );
    return () => unsub();
  }, [allowed]);

  const stats = useMemo(() => {
    const byPlan: Record<string, number> = { basic: 0, pro: 0, alloy: 0 };
    let freeForever = 0;
    for (const c of companies) {
      const p = c.freeForever ? 'alloy' : c.plan;
      byPlan[p] = (byPlan[p] ?? 0) + 1;
      if (c.freeForever) freeForever += 1;
    }
    return { total: companies.length, byPlan, freeForever };
  }, [companies]);

  const toggleFreeForever = async (row: CompanyRow) => {
    if (!user || !allowed) return;
    setBusyCompanyId(row.id);
    setMsg(null);
    try {
      await updateDoc(doc(getDb(), 'companies', row.id), {
        ownerVaultFreeForever: !row.freeForever,
      });
      setCompanies((prev) => prev.map((c) => (c.id === row.id ? { ...c, freeForever: !c.freeForever } : c)));
      setMsg(row.freeForever ? 'הוסר מצב VIP חינם לצמיתות.' : 'הוגדר VIP חינם לצמיתות.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'עדכון נכשל');
    } finally {
      setBusyCompanyId(null);
    }
  };

  const saveLanding = async () => {
    if (!user || !allowed) return;
    setSavingLanding(true);
    setMsg(null);
    try {
      await setDoc(doc(getDb(), ...LANDING_DOC), {
        logoUrl: landingLogo.trim() || null,
        primaryColor: landingPrimary.trim(),
        secondaryColor: landingSecondary.trim(),
        updatedAt: serverTimestamp(),
        updatedByEmail: user.email ?? null,
      });
      setMsg('מיתוג דף הנחיתה נשמר (יוצג בציבור דרך ה-API).');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שמירה נכשלה');
    } finally {
      setSavingLanding(false);
    }
  };

  if (!allowed) {
    return null;
  }

  return (
    <div className="min-h-full bg-[#FDFDFD] p-6 pb-24 pt-safe px-safe sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-4xl px-4 text-sm font-bold text-gray-500 transition-colors hover:text-[#001A4D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          חזרה לדשבורד
        </Link>
      </div>

      <header className="mb-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-4xl border-2 border-[#c9a227] bg-gradient-to-br from-[#fff9e6] to-[#f5e6a8] text-[#8a6d1b] shadow-[0_8px_32px_rgba(201,162,39,0.25)]">
          <Crown className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4D]">אזור בעלים (Owner Vault)</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">יוחנן בוקשפן · BSD-YBM — ניהול פלטפורמה בלבד.</p>
        </div>
        <Link
          href="/dashboard/owner-only/ai-coder"
          className="flex min-h-12 items-center justify-center rounded-4xl border border-[#004694]/30 bg-[#004694]/8 px-8 py-3 text-sm font-black text-[#004694] transition-colors hover:bg-[#004694]/12"
        >
          פתיחת AI Development Hub →
        </Link>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8">
        <section className="flex w-full flex-col items-center justify-center gap-6 rounded-4xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-center gap-4 text-[#001A4D]">
            <LineChart className="h-6 w-6" aria-hidden />
            <h2 className="text-lg font-black">תמונת עסק (מנויים)</h2>
          </div>
          {loadingCompanies ? (
            <p className="text-sm text-gray-500">טוען חברות…</p>
          ) : (
            <ul className="grid w-full gap-4 text-center sm:grid-cols-3">
              <li className="rounded-4xl border border-gray-100 bg-[#FDFDFD] p-6">
                <p className="text-3xl font-black text-[#004694]">{stats.total}</p>
                <p className="text-xs font-bold text-gray-500">חברות פעילות ברשימה</p>
              </li>
              <li className="rounded-4xl border border-gray-100 bg-[#FDFDFD] p-6">
                <p className="text-3xl font-black text-[#c9a227]">{stats.freeForever}</p>
                <p className="text-xs font-bold text-gray-500">VIP חינם לצמיתות</p>
              </li>
              <li className="rounded-4xl border border-gray-100 bg-[#FDFDFD] p-6">
                <p className="text-sm font-bold text-gray-700">
                  Basic {stats.byPlan.basic ?? 0} · Pro {stats.byPlan.pro ?? 0} · Alloy {stats.byPlan.alloy ?? 0}
                </p>
                <p className="mt-2 text-xs font-bold text-gray-500">התפלגות תוכניות (כולל VIP כ-Alloy)</p>
              </li>
            </ul>
          )}
        </section>

        <SystemHealthTimeline />

        <section className="flex w-full flex-col items-center justify-center gap-6 rounded-4xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-center gap-4 text-[#001A4D]">
            <Star className="h-6 w-6 text-[#c9a227]" aria-hidden />
            <h2 className="text-lg font-black">VIP — חינם לצמיתות</h2>
          </div>
          <p className="max-w-lg text-center text-xs text-gray-500">
            מפעיל תוכנית Alloy מלאה לחברה ללא חיוב. רק כתובת הבעלים יכולה לשנות שדה זה (Firestore).
          </p>
          <div className="max-h-72 w-full overflow-y-auto rounded-4xl border border-gray-100">
            <ul className="divide-y divide-gray-100">
              {companies.map((c) => (
                <li key={c.id} className="flex flex-col items-center justify-center gap-4 p-4 sm:flex-row sm:justify-between">
                  <div className="text-center sm:text-start">
                    <p className="font-bold text-[#001A4D]">{c.displayName}</p>
                    <p className="text-xs text-gray-500">
                      {c.id} · תוכנית: {c.freeForever ? 'alloy (VIP)' : c.plan}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyCompanyId === c.id}
                    onClick={() => void toggleFreeForever(c)}
                    className={`min-h-12 rounded-4xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 ${
                      c.freeForever ? 'bg-gray-500' : 'bg-[#c9a227]'
                    }`}
                  >
                    {busyCompanyId === c.id ? 'מעדכן…' : c.freeForever ? 'בטל VIP' : 'הפעל VIP חינם'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex w-full flex-col items-center justify-center gap-6 rounded-4xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-center gap-4 text-[#001A4D]">
            <ScrollText className="h-6 w-6" aria-hidden />
            <h2 className="text-lg font-black">יומן שינויים (מפתחים)</h2>
          </div>
          <p className="max-w-lg text-center text-xs text-gray-500">
            רישומים שנשלחים מפאנל המפתח. לתיעוד מה שונה בקוד — המפתח מזין תיאור ידני לאחר כל שינוי משמעותי.
          </p>
          <ul className="w-full space-y-4">
            {logs.length === 0 ? (
              <li className="text-center text-sm text-gray-500">אין רישומים עדיין.</li>
            ) : (
              logs.map((l) => (
                <li key={l.id} className="rounded-4xl border border-gray-100 bg-[#FDFDFD] p-4 text-start">
                  <p className="text-sm text-gray-800">{l.message}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {l.actorEmail} · {l.atLabel || '—'}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="flex w-full flex-col items-center justify-center gap-6 rounded-4xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-center gap-4 text-[#001A4D]">
            <Palette className="h-6 w-6" aria-hidden />
            <h2 className="text-lg font-black">מיתוג דף נחיתה גלובלי</h2>
          </div>
          <p className="max-w-lg text-center text-xs text-gray-500">
            נשמר ב־<code className="rounded bg-gray-100 px-1">globalLandingBranding/default</code> — נקרא בציבור דרך{' '}
            <code className="rounded bg-gray-100 px-1">/api/public/landing-branding</code>.
          </p>
          <div className="flex w-full max-w-md flex-col items-center justify-center gap-4">
            <label className="flex w-full flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700">
              URL לוגו
              <input
                value={landingLogo}
                onChange={(e) => setLandingLogo(e.target.value)}
                className="min-h-12 w-full rounded-4xl border border-gray-200 px-4 py-3 text-center"
                placeholder="https://…"
              />
            </label>
            <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
              <label className="flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700">
                צבע זהב / הדגשה
                <input
                  type="color"
                  value={landingPrimary}
                  onChange={(e) => setLandingPrimary(e.target.value)}
                  className="h-12 w-full max-w-[120px] cursor-pointer rounded-4xl border border-gray-200"
                />
              </label>
              <label className="flex flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700">
                צבע משני
                <input
                  type="color"
                  value={landingSecondary}
                  onChange={(e) => setLandingSecondary(e.target.value)}
                  className="h-12 w-full max-w-[120px] cursor-pointer rounded-4xl border border-gray-200"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={savingLanding}
              onClick={() => void saveLanding()}
              className="min-h-12 w-full max-w-xs rounded-4xl bg-[#004694] px-8 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {savingLanding ? 'שומר…' : 'שמירת מיתוג נחיתה'}
            </button>
          </div>
        </section>

        {msg ? (
          <p className="text-center text-sm font-bold text-[#001A4D]" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
