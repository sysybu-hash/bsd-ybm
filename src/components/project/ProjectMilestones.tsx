'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getDb, projectMilestonesRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { MilestoneStatus, ProjectMilestoneDoc } from '@/types/projectMilestone';
import { MILESTONE_STATUS_LABELS } from '@/types/projectMilestone';

const ORANGE = '#FF8C00';
const BLUE = '#004694';

type MilestoneSeedRow = Pick<ProjectMilestoneDoc, 'title' | 'targetDate' | 'status' | 'order'>;

const DEFAULT_SEED: MilestoneSeedRow[] = [
  { title: 'שלד', targetDate: '', status: 'pending', order: 0 },
  { title: 'חשמל', targetDate: '', status: 'pending', order: 1 },
  { title: 'טיח', targetDate: '', status: 'pending', order: 2 },
  { title: 'גמר', targetDate: '', status: 'pending', order: 3 },
];

type Row = ProjectMilestoneDoc & { id: string };

export default function ProjectMilestones({
  companyId,
  projectId,
}: {
  companyId: string;
  projectId: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId || !projectId) {
      setRows([]);
      return;
    }
    const q = query(projectMilestonesRef(companyId, projectId), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Row[] = [];
        snap.forEach((d) => {
          const data = d.data() as ProjectMilestoneDoc;
          list.push({ ...data, id: d.id });
        });
        setRows(list);
        setError(null);
      },
      () => setError('לא ניתן לטעון אבני דרך')
    );
    return () => unsub();
  }, [companyId, projectId]);

  const progress = useMemo(() => {
    if (rows.length === 0) return 0;
    const done = rows.filter((r) => r.status === 'completed').length;
    return Math.round((done / rows.length) * 100);
  }, [rows]);

  const seedDefaults = async () => {
    if (!isFirebaseConfigured() || rows.length > 0) return;
    setBusy(true);
    setError(null);
    try {
      const ref = projectMilestonesRef(companyId, projectId);
      for (const m of DEFAULT_SEED) {
        await addDoc(ref, {
          ...m,
          companyId,
          projectId,
          targetDate: m.targetDate || new Date().toISOString().slice(0, 10),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שמירה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: string, data: Partial<ProjectMilestoneDoc>) => {
    setBusy(true);
    try {
      const r = doc(getDb(), 'companies', companyId, 'projects', projectId, 'milestones', id);
      await updateDoc(r, {
        ...data,
        updatedAt: serverTimestamp(),
        ...(data.status === 'completed' ? { completedAt: serverTimestamp() } : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'עדכון נכשל');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="flex w-full max-w-2xl flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-6 pt-safe pb-safe sm:p-8"
      aria-labelledby="milestones-heading"
    >
      <h2 id="milestones-heading" className="text-center text-lg font-black text-[#004694]">
        יעדי פרויקט — אבני דרך
      </h2>

      <div className="relative h-4 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${ORANGE}, #ffb347)`,
            boxShadow: `0 0 16px ${ORANGE}, 0 0 28px ${ORANGE}66`,
          }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
      <p className="text-center text-xs font-bold text-gray-500">{progress}% הושלמו</p>

      {error && (
        <p className="w-full rounded-4xl border border-red-100 bg-red-50 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-center text-sm text-gray-500">אין אבני דרך. טען תבנית בסיסית.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void seedDefaults()}
            className="min-h-12 rounded-4xl px-8 font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: BLUE, boxShadow: `0 0 20px ${BLUE}44` }}
          >
            טען שלד · חשמל · טיח · גמר
          </button>
        </div>
      )}

      <ul className="flex w-full flex-col gap-4">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-white p-4 sm:flex-row sm:p-6"
          >
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <span className="font-black text-[#1a1a1a]">{r.title}</span>
              <label className="flex flex-col items-center gap-2 text-xs text-gray-500">
                יעד
                <input
                  type="date"
                  value={r.targetDate?.slice(0, 10) ?? ''}
                  onChange={(e) => void patch(r.id, { targetDate: e.target.value })}
                  className="min-h-11 rounded-4xl border border-gray-200 px-4 text-center text-sm"
                  disabled={busy}
                />
              </label>
            </div>
            <select
              value={r.status}
              disabled={busy}
              onChange={(e) =>
                void patch(r.id, { status: e.target.value as MilestoneStatus })
              }
              className="min-h-12 rounded-4xl border border-gray-200 bg-[#FDFDFD] px-4 text-center text-sm font-bold"
            >
              {(Object.keys(MILESTONE_STATUS_LABELS) as MilestoneStatus[]).map((s) => (
                <option key={s} value={s}>
                  {MILESTONE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}
