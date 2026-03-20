'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { addDoc, onSnapshot, orderBy, limit, query } from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { useDashboardDiagnostics } from '@/context/DashboardDiagnosticsContext';
import { companyRuntimeErrorsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

const ORANGE = '#FF8C00';
const BRAND = '#004694';

type FsErr = { id: string; source?: string; message?: string; at?: number };

export default function SystemLogsPage() {
  const { companyId } = useCompany();
  const { user } = useAuth();
  const { errors, clearErrors, recordError } = useDashboardDiagnostics();
  const [fsErrors, setFsErrors] = useState<FsErr[]>([]);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setFsErrors([]);
      return;
    }
    const q = query(companyRuntimeErrorsRef(companyId), orderBy('at', 'desc'), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: FsErr[] = [];
        snap.forEach((d) => {
          const data = d.data() as { source?: string; message?: string; at?: number };
          rows.push({ id: d.id, ...data });
        });
        setFsErrors(rows);
      },
      () => setFsErrors([])
    );
    return () => unsub();
  }, [companyId]);

  const pushTestError = async () => {
    if (!companyId || !user?.uid) return;
    try {
      await addDoc(companyRuntimeErrorsRef(companyId), {
        createdByUid: user.uid,
        source: 'manual-test',
        message: 'שגיאת בדיקה מהדשבורד',
        at: Date.now(),
      });
    } catch (e) {
      recordError('logs-page', e instanceof Error ? e.message : 'Failed to write runtime error');
    }
  };

  return (
    <div className="min-h-full bg-[#FFFFFF] p-4 pb-12 sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[40px] px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#1a1a1a] active:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לדשבורד
        </Link>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl" style={{ color: BRAND }}>
          יומן שגיאות
        </h1>
        <p className="text-gray-500 mt-2">מצב לקוח + שגיאות שדווחו ל־Firestore</p>
      </header>

      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <section className="rounded-[40px] border border-gray-100 bg-white p-4 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            <h2 className="text-lg font-black text-[#1a1a1a] flex-1 min-w-[200px] text-center">
              אירועים מקומיים (סשן נוכחי)
            </h2>
            <button
              type="button"
              onClick={clearErrors}
              className="min-h-12 rounded-[40px] border border-gray-200 px-6 py-3 font-bold text-gray-600 transition-colors active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
            >
              נקה תצוגה
            </button>
          </div>
          {errors.length === 0 ? (
            <p className="text-center text-gray-500">אין שגיאות מקומיות.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {errors.map((e) => (
                <li
                  key={e.id}
                  className="rounded-[40px] border border-gray-100 p-4 text-sm text-gray-700 text-center"
                >
                  <span className="font-bold text-[#1a1a1a]">{e.source}</span>
                  <span className="block text-gray-500 mt-1">{e.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[40px] border border-gray-100 bg-white p-4 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            <h2 className="text-lg font-black text-[#1a1a1a] flex-1 min-w-[200px] text-center">
              Firestore — runtimeErrors
            </h2>
            <button
              type="button"
              onClick={pushTestError}
              className="min-h-12 rounded-[40px] px-6 py-3 font-bold text-white transition-opacity active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ backgroundColor: ORANGE }}
            >
              הוסף שגיאת בדיקה
            </button>
          </div>
          {!companyId && <p className="text-center text-gray-500">בחר חברה כדי לראות שגיאות.</p>}
          {companyId && fsErrors.length === 0 && (
            <p className="text-center text-gray-500">אין רשומות.</p>
          )}
          {companyId && fsErrors.length > 0 && (
            <ul className="flex flex-col gap-3">
              {fsErrors.map((e) => (
                <li
                  key={e.id}
                  className="rounded-[40px] border border-gray-100 p-4 text-sm text-gray-700 text-center"
                >
                  <span className="font-bold text-[#1a1a1a]">{e.source}</span>
                  <span className="block text-gray-500 mt-1">{e.message}</span>
                  {e.at != null && (
                    <span className="block text-xs text-gray-400 mt-2">{new Date(e.at).toLocaleString()}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
