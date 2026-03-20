'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

type Hit = { id: string; preview: string; projectId?: string };

export default function ArchiveSearchPage() {
  const { user } = useAuth();
  const { companyId } = useCompany();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) setQ(initial);
  }, []);

  const run = useCallback(async () => {
    if (!user || !companyId || q.trim().length < 2) {
      setMsg('בחרו חברה והקלידו לפחות 2 תווים.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const token = await user.getIdToken();
      const url = `/api/search/scans?${new URLSearchParams({ companyId, q: q.trim() })}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((json as { error?: string }).error ?? 'חיפוש נכשל');
        setHits([]);
        return;
      }
      setHits((json as { hits?: Hit[] }).hits ?? []);
      setMsg(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
      setHits([]);
    } finally {
      setBusy(false);
    }
  }, [user, companyId, q]);

  return (
    <div className="min-h-full bg-[#F4F5F7] p-6 pb-28 pt-safe px-safe sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-bold text-gray-500 hover:text-[#001A4D]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          חזרה לדשבורד
        </Link>
      </div>

      <header className="mb-8 flex flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-[32px] p-3" style={{ backgroundColor: `${MEUHEDET.blue}18` }}>
          <Search className="h-8 w-8" style={{ color: MEUHEDET.blue }} aria-hidden />
        </div>
        <h1 className="text-2xl font-black text-[#001A4D]">ארכיון OCR חכם</h1>
        <p className="max-w-lg text-sm text-gray-600">
          חיפוש טקסטואלי בסריקות ובארכיון (כולל קבצים שסונכרנו מ־Google Drive דרך ה־API).
        </p>
      </header>

      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void run())}
          placeholder="הקלידו מילת חיפוש…"
          className="w-full rounded-[32px] border border-gray-200 px-4 py-3 text-center text-sm font-bold"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="min-h-12 w-full max-w-xs rounded-[32px] px-6 py-3 text-sm font-black text-white disabled:opacity-50"
          style={{ backgroundColor: MEUHEDET.orange }}
        >
          {busy ? 'מחפש…' : 'חיפוש'}
        </button>
        {msg ? <p className="text-center text-sm font-bold text-red-700">{msg}</p> : null}
      </div>

      <ul className="mx-auto mt-10 flex max-w-2xl flex-col items-center justify-center gap-4">
        {hits.map((h) => (
          <li
            key={h.id}
            className="w-full rounded-[32px] border border-gray-200 bg-white p-4 text-center shadow-sm"
          >
            <p className="font-mono text-xs text-gray-500">{h.id.slice(0, 12)}…</p>
            <p className="mt-2 text-sm text-[#001A4D]">{h.preview}</p>
            {h.projectId ? (
              <Link
                href={`/dashboard/projects/${h.projectId}`}
                className="mt-2 inline-block text-xs font-bold text-[#FF7F00] underline-offset-4 hover:underline"
              >
                לפרויקט
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
