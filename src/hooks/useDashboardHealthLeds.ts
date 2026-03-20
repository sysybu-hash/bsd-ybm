'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  collectionGroup,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { getDb, companyProjectsRef, companyScansRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { MilestoneStatus } from '@/types/projectMilestone';

const DAY_MS = 86400000;

function tsToMs(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as Timestamp).toMillis === 'function') {
    try {
      return (v as Timestamp).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

function parseDayStartMs(iso: string): number {
  const t = Date.parse(`${iso}T00:00:00`);
  return Number.isFinite(t) ? t : 0;
}

function projectActualVsBudget(data: Record<string, unknown>): { actual: number; budget: number } {
  const pl = (data.plSummary as Record<string, unknown> | undefined) ?? {};
  const L = typeof pl.laborCosts === 'number' ? pl.laborCosts : 0;
  const M = typeof pl.materialCosts === 'number' ? pl.materialCosts : 0;
  const actual = L + M;
  const budgetRaw =
    typeof pl.budgetedCost === 'number'
      ? pl.budgetedCost
      : typeof data.budgetedTotal === 'number'
        ? data.budgetedTotal
        : typeof data.budget === 'number'
          ? data.budget
          : null;
  const budget =
    budgetRaw != null && budgetRaw > 0
      ? budgetRaw
      : actual > 0
        ? actual * 1.18
        : 0;
  return { actual, budget };
}

/**
 * Real-time signals for dashboard LEDs (selected company).
 */
export function useDashboardHealthLeds() {
  const { companyId } = useCompany();
  const [overBudget, setOverBudget] = useState(false);
  const [milestoneOverdue, setMilestoneOverdue] = useState(false);
  const [staleClientTasks, setStaleClientTasks] = useState(0);
  const [pendingScanApprovals, setPendingScanApprovals] = useState(0);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setOverBudget(false);
      setMilestoneOverdue(false);
      setStaleClientTasks(0);
      setPendingScanApprovals(0);
      return;
    }

    const db = getDb();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const unsubProj = onSnapshot(
      companyProjectsRef(companyId),
      (snap) => {
        let ob = false;
        snap.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const { actual, budget } = projectActualVsBudget(data);
          if (budget > 0 && actual > budget * 1.005) ob = true;
        });
        setOverBudget(ob);
      },
      () => setOverBudget(false)
    );

    const qMile = query(collectionGroup(db, 'milestones'), where('companyId', '==', companyId));
    const unsubMile = onSnapshot(
      qMile,
      (snap) => {
        let overdue = false;
        snap.forEach((d) => {
          const x = d.data() as {
            status?: MilestoneStatus;
            targetDate?: string;
          };
          if (x.status === 'completed') return;
          const td = x.targetDate ? parseDayStartMs(x.targetDate) : 0;
          if (td > 0 && td < todayMs) overdue = true;
        });
        setMilestoneOverdue(overdue);
      },
      () => setMilestoneOverdue(false)
    );

    const qTasks = query(
      collectionGroup(db, 'communications'),
      where('companyId', '==', companyId),
      where('kind', '==', 'task')
    );
    const unsubTasks = onSnapshot(
      qTasks,
      (snap) => {
        const now = Date.now();
        let n = 0;
        snap.forEach((d) => {
          const x = d.data() as {
            internal?: boolean;
            visibility?: string;
            acknowledgedAt?: unknown;
            createdAt?: unknown;
          };
          if (x.internal === true || x.visibility === 'internal') return;
          if (x.acknowledgedAt) return;
          const created = tsToMs(x.createdAt);
          if (created && now - created > 24 * DAY_MS) n += 1;
        });
        setStaleClientTasks(n);
      },
      () => setStaleClientTasks(0)
    );

    const unsubScans = onSnapshot(
      companyScansRef(companyId),
      (snap) => {
        let n = 0;
        snap.forEach((d) => {
          const x = d.data() as { status?: string; engineResults?: unknown };
          if (x.status === 'committed_to_pl') return;
          if (x.engineResults != null) n += 1;
        });
        setPendingScanApprovals(n);
      },
      () => setPendingScanApprovals(0)
    );

    return () => {
      unsubProj();
      unsubMile();
      unsubTasks();
      unsubScans();
    };
  }, [companyId]);

  return useMemo(
    () => ({
      companyId,
      /** RED: budget breach or overdue milestone */
      projectHealthCritical: overBudget || milestoneOverdue,
      overBudget,
      milestoneOverdue,
      /** ORANGE: client tasks open >24h without ack */
      staleClientTasks,
      staleClientTaskActive: staleClientTasks > 0,
      /** BLUE pulse: scans awaiting P&L commit */
      pendingScanApprovals,
      scanReviewActive: pendingScanApprovals > 0,
    }),
    [
      companyId,
      overBudget,
      milestoneOverdue,
      staleClientTasks,
      pendingScanApprovals,
    ]
  );
}
