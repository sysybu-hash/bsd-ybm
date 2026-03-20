'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useDashboardDiagnostics } from '@/context/DashboardDiagnosticsContext';

const ORANGE = '#FF8C00';
const BRAND = '#004694';

export default function SyncStatusPage() {
  const { recordError } = useDashboardDiagnostics();
  const [health, setHealth] = useState<unknown>(null);
  const [syncResult, setSyncResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const refreshHealth = () => {
    fetch('/api/health', { cache: 'no-store' })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(setHealth)
      .catch((e) => {
        recordError('sync-status', e instanceof Error ? e.message : 'Health fetch failed');
        setHealth({ ok: false, error: String(e) });
      });
  };

  useEffect(() => {
    refreshHealth();
  }, []);

  const runSync = async () => {
    setLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      setSyncResult({ ok: res.ok, json });
      if (!res.ok) recordError('global-sync', (json as { message?: string }).message || 'סנכרון נכשל');
    } catch (e) {
      recordError('global-sync', e instanceof Error ? e.message : 'סנכרון נכשל');
      setSyncResult({ ok: false, error: String(e) });
    } finally {
      setLoading(false);
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
          סטטוס סנכרון מערכת
        </h1>
        <p className="mt-2 text-gray-500">Firebase, שרת API, מסד נתונים ומקאנו</p>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <section className="rounded-[40px] border border-gray-100 bg-white p-4 shadow-sm sm:p-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-black text-[#1a1a1a]">בדיקת בריאות API</h2>
            <button
              type="button"
              onClick={refreshHealth}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[40px] border border-gray-200 px-4 py-2 text-sm font-bold transition-colors active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
            >
              <RefreshCw className="w-4 h-4" />
              רענן
            </button>
          </div>
          <pre className="text-xs bg-gray-50 rounded-[40px] p-4 overflow-auto text-left" dir="ltr">
            {JSON.stringify(health, null, 2)}
          </pre>
        </section>

        <section className="rounded-[40px] border border-gray-100 bg-white p-4 text-center shadow-sm sm:p-8">
          <h2 className="mb-4 text-lg font-black text-[#1a1a1a]">סנכרון גלובלי (Orchestrator)</h2>
          <button
            type="button"
            disabled={loading}
            onClick={runSync}
            className="min-h-12 rounded-[40px] px-8 py-4 font-bold text-white transition-opacity active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694] disabled:opacity-60"
            style={{ backgroundColor: ORANGE }}
          >
            {loading ? 'מריץ…' : 'הרץ סנכרון עכשיו'}
          </button>
          {syncResult != null && (
            <pre className="text-xs bg-gray-50 rounded-[40px] p-4 mt-6 overflow-auto text-left" dir="ltr">
              {JSON.stringify(syncResult, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}
