'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { DraftBoqLine } from '@/services/ai/BlueprintAnalyzer';
import {
  estimateProjectCostFromDraft,
  suggestEstimatedProfitBadge,
  sumDraftBoqWithRates,
} from '@/services/ai/PredictiveAnalytics';
import { MEUHEDET } from '@/components/shell/meuhedet-theme';

type DraftDoc = {
  id: string;
  draftBoq: DraftBoqLine[];
  createdAt: unknown;
  scaleDetected: string | null;
};

export default function ProjectBoqDraftsPanel({
  companyId,
  projectId,
}: {
  companyId: string;
  projectId: string;
}) {
  const [drafts, setDrafts] = useState<DraftDoc[]>([]);
  const [budgetNis, setBudgetNis] = useState(0);

  useEffect(() => {
    if (!companyId || !projectId || !isFirebaseConfigured()) return;
    const db = getDb();
    const pref = collection(db, 'companies', companyId, 'projects', projectId, 'boqDrafts');
    const unsub = onSnapshot(pref, (snap) => {
      const list: DraftDoc[] = [];
      snap.forEach((d) => {
        const x = d.data();
        list.push({
          id: d.id,
          draftBoq: (x.draftBoq as DraftBoqLine[]) ?? [],
          createdAt: x.createdAt,
          scaleDetected: typeof x.scaleDetected === 'string' ? x.scaleDetected : null,
        });
      });
      setDrafts(list);
    });
    const pRef = doc(db, 'companies', companyId, 'projects', projectId);
    const unsubP = onSnapshot(pRef, (s) => {
      if (!s.exists()) {
        setBudgetNis(0);
        return;
      }
      const data = s.data();
      const pl = (data.plSummary as Record<string, unknown> | undefined) ?? {};
      const b =
        typeof pl.budgetedCost === 'number'
          ? pl.budgetedCost
          : typeof data.budgetedTotal === 'number'
            ? data.budgetedTotal
            : typeof data.budget === 'number'
              ? data.budget
              : 0;
      setBudgetNis(typeof b === 'number' && b > 0 ? b : 0);
    });
    return () => {
      unsub();
      unsubP();
    };
  }, [companyId, projectId]);

  const priceBook = useMemo(() => new Map<string, number>(), []);

  if (drafts.length === 0) return null;

  return (
    <section
      className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-6"
      style={{ boxShadow: '0 8px 32px rgba(0,26,77,0.08)' }}
    >
      <h2 className="text-center text-lg font-black text-[#001A4D]">טיוטות BOQ (Gramoshka)</h2>
      <ul className="flex w-full flex-col items-center justify-center gap-4">
        {drafts.map((d) => {
          const lines = d.draftBoq;
          const direct = sumDraftBoqWithRates(lines);
          const est = estimateProjectCostFromDraft(lines, priceBook);
          const costBasis = direct > 0 ? direct : est.estimatedCostNis;
          const badge = suggestEstimatedProfitBadge({
            budgetOrRevenueNis: budgetNis > 0 ? budgetNis : costBasis * 1.12,
            estimatedCostNis: costBasis,
          });
          const toneBg =
            badge.tone === 'positive'
              ? `${MEUHEDET.teal}22`
              : badge.tone === 'negative'
                ? '#fee2e2'
                : '#f4f4f5';
          const toneFg = badge.tone === 'positive' ? MEUHEDET.teal : badge.tone === 'negative' ? '#b91c1c' : '#52525b';
          return (
            <li
              key={d.id}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-[32px] border border-gray-100 bg-[#FDFDFD] p-6 text-center"
            >
              <span className="font-mono text-xs text-gray-500">{d.id.slice(0, 8)}…</span>
              <span className="text-sm text-gray-600">
                {lines.length} שורות · קנה מידה: {d.scaleDetected ?? '—'}
              </span>
              <span
                className="rounded-[32px] px-4 py-2 text-xs font-black"
                style={{ backgroundColor: toneBg, color: toneFg }}
              >
                {badge.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
