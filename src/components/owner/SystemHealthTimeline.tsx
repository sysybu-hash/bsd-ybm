'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Bot, GitBranch, HeartPulse, ScanSearch, Wrench } from 'lucide-react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

const COL = 'sentinelTimeline';

const KIND_LABEL: Record<string, string> = {
  scan_completed: 'סריקה הושלמה',
  error_analysis: 'ניתוח שגיאות',
  hotfix_proposed: 'תיקון מוצע',
  hotfix_pushed: 'דחיפה ל-GitHub',
  error_fixed: 'תיקון הוצע',
  system_optimized: 'מערכת מותאמת',
  ai_coder: 'AI Coder',
  sentinel_run: 'Sentinel',
  sentinel_idle: 'ללא שגיאות',
};

function kindIcon(kind: string) {
  switch (kind) {
    case 'scan_completed':
      return ScanSearch;
    case 'error_analysis':
      return Activity;
    case 'hotfix_pushed':
    case 'hotfix_proposed':
      return GitBranch;
    case 'ai_coder':
      return Bot;
    case 'error_fixed':
    case 'system_optimized':
      return Wrench;
    default:
      return HeartPulse;
  }
}

export default function SystemHealthTimeline() {
  const [rows, setRows] = useState<
    Array<{ id: string; kind: string; title: string; detail: string; atLabel: string }>
  >([]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const q = query(collection(getDb(), COL), orderBy('createdAt', 'desc'), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Array<{ id: string; kind: string; title: string; detail: string; atLabel: string }> = [];
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
            kind: String(x.kind ?? ''),
            title: String(x.title ?? ''),
            detail: String(x.detail ?? ''),
            atLabel,
          });
        });
        setRows(next);
      },
      () => setRows([])
    );
    return () => unsub();
  }, []);

  return (
    <section className="flex w-full flex-col items-center justify-center gap-6 rounded-4xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-center gap-4 text-[#001A4D]">
        <HeartPulse className="h-6 w-6 text-emerald-600" aria-hidden />
        <h2 className="text-lg font-black">בריאות מערכת (Sentinel / AI)</h2>
      </div>
      <p className="max-w-lg text-center text-xs text-gray-500">
        ציר זמן פעולות: סריקות, ניתוח שגיאות, הצעות תיקון ודחיפות ל-GitHub. נכתב ע&quot;י שרת (Cron / APIs).
      </p>
      <ul className="flex w-full max-w-2xl flex-col gap-4">
        {rows.length === 0 ? (
          <li className="rounded-4xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
            אין אירועים עדיין. לאחר הרצת Cron או שימוש ב-AI Coder יופיעו כאן רשומות.
          </li>
        ) : (
          rows.map((r) => {
            const Icon = kindIcon(r.kind);
            const badge = KIND_LABEL[r.kind] || r.kind;
            return (
              <li
                key={r.id}
                className="flex flex-col items-center justify-center gap-3 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-start"
              >
                <div className="flex items-center justify-center gap-4 sm:items-start">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-4xl bg-[#004694]/8 text-[#004694]">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#c9a227]">{badge}</p>
                    <p className="font-black text-[#001A4D]">{r.title}</p>
                    {r.detail ? (
                      <p className="mt-2 line-clamp-4 text-xs text-gray-600 break-words">{r.detail}</p>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-gray-400">{r.atLabel || '—'}</span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
