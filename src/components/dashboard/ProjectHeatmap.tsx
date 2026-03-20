'use client';

import React, { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { LayoutGrid } from 'lucide-react';
import { companyProjectsRef, getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { MilestoneStatus } from '@/types/projectMilestone';

type BudgetLed = 'good' | 'warn' | 'bad' | 'muted';
type ScheduleLed = 'good' | 'warn' | 'bad' | 'muted';

export type HeatmapRow = {
  id: string;
  name: string;
  budget: number;
  actual: number;
  budgetLed: BudgetLed;
  scheduleLed: ScheduleLed;
  milestoneLabel: string;
};

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
      ? Number(budgetRaw)
      : actual > 0
        ? actual * 1.18
        : 0;
  return { actual, budget };
}

function budgetLedFor(actual: number, budget: number): BudgetLed {
  if (budget <= 0 && actual <= 0) return 'muted';
  if (budget <= 0) return actual > 0 ? 'warn' : 'muted';
  if (actual > budget * 1.005) return 'bad';
  if (actual > budget * 0.92) return 'warn';
  return 'good';
}

function parseDayStartMs(iso: string): number {
  const t = Date.parse(`${iso}T00:00:00`);
  return Number.isFinite(t) ? t : 0;
}

type MileAgg = { total: number; completed: number; overdue: boolean };

function scheduleLedFor(agg: MileAgg | undefined, todayMs: number): ScheduleLed {
  if (!agg || agg.total === 0) return 'muted';
  if (agg.overdue) return 'bad';
  if (agg.completed >= agg.total) return 'good';
  const ratio = agg.completed / agg.total;
  if (ratio >= 0.5) return 'warn';
  return 'warn';
}

function ledStyle(tone: BudgetLed | ScheduleLed): CSSProperties {
  switch (tone) {
    case 'good':
      return {
        backgroundColor: '#22c55e',
        boxShadow: '0 0 14px rgba(34, 197, 94, 0.75), 0 0 28px rgba(34, 197, 94, 0.35)',
      };
    case 'bad':
      return {
        backgroundColor: '#ef4444',
        boxShadow: '0 0 14px rgba(239, 68, 68, 0.75), 0 0 28px rgba(239, 68, 68, 0.35)',
      };
    case 'warn':
      return {
        backgroundColor: 'var(--brand-accent, #FF8C00)',
        boxShadow:
          '0 0 14px var(--brand-glow, rgba(0, 70, 148, 0.45)), 0 0 24px color-mix(in srgb, var(--brand-accent) 40%, transparent)',
      };
    default:
      return {
        backgroundColor: '#cbd5e1',
        boxShadow: '0 0 8px rgba(148, 163, 184, 0.5)',
      };
  }
}

function Led({ tone, label }: { tone: BudgetLed | ScheduleLed; label: string }) {
  const style = ledStyle(tone);

  return (
    <span className="flex flex-col items-center justify-center gap-2">
      <span
        className="h-4 w-4 shrink-0 rounded-full border border-white/60"
        style={style}
        title={label}
        aria-label={label}
      />
      <span className="text-[10px] font-bold text-gray-500">{label}</span>
    </span>
  );
}

export default function ProjectHeatmap({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<HeatmapRow[]>([]);
  const [loading, setLoading] = useState(true);

  const todayMs = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || !companyId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getDb();
    let projectsSnap: Map<string, Record<string, unknown>> = new Map();
    let mileByProject: Map<string, MileAgg> = new Map();

    const merge = () => {
      const out: HeatmapRow[] = [];
      projectsSnap.forEach((data, id) => {
        const { actual, budget } = projectActualVsBudget(data);
        const name = String(data.name ?? id);
        const agg = mileByProject.get(id);
        const scheduleLed = scheduleLedFor(agg, todayMs);
        const budgetLed = budgetLedFor(actual, budget);
        const mLabel = agg && agg.total > 0 ? `${agg.completed}/${agg.total}` : '—';
        out.push({
          id,
          name,
          budget,
          actual,
          budgetLed,
          scheduleLed,
          milestoneLabel: mLabel,
        });
      });
      out.sort((a, b) => b.actual - a.actual);
      setRows(out);
      setLoading(false);
    };

    const unsubP = onSnapshot(
      companyProjectsRef(companyId),
      (snap) => {
        const m = new Map<string, Record<string, unknown>>();
        snap.forEach((d) => m.set(d.id, d.data() as Record<string, unknown>));
        projectsSnap = m;
        merge();
      },
      () => {
        setRows([]);
        setLoading(false);
      }
    );

    const qM = query(collectionGroup(db, 'milestones'), where('companyId', '==', companyId));
    const unsubM = onSnapshot(
      qM,
      (snap) => {
        const map = new Map<string, MileAgg>();
        snap.forEach((d) => {
          const x = d.data() as {
            projectId?: string;
            status?: MilestoneStatus;
            targetDate?: string;
          };
          const pid = String(x.projectId ?? '');
          if (!pid) return;
          if (!map.has(pid)) map.set(pid, { total: 0, completed: 0, overdue: false });
          const row = map.get(pid)!;
          row.total += 1;
          if (x.status === 'completed') {
            row.completed += 1;
          } else {
            const td = x.targetDate ? parseDayStartMs(x.targetDate) : 0;
            if (td > 0 && td < todayMs) row.overdue = true;
          }
        });
        mileByProject = map;
        merge();
      },
      () => {
        mileByProject = new Map();
        merge();
      }
    );

    return () => {
      unsubP();
      unsubM();
    };
  }, [companyId, todayMs]);

  const go = (projectId: string) => {
    router.push(`/dashboard/projects/${encodeURIComponent(projectId)}`);
  };

  return (
    <section
      className="empire-shimmer-gold dashboard-tile-shimmer mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-6 pt-safe pb-safe sm:p-8"
      aria-labelledby="heatmap-heading"
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          className="rounded-4xl p-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--brand-primary, #004694) 10%, white)',
            boxShadow: '0 0 20px var(--brand-glow, rgba(0, 70, 148, 0.2))',
          }}
        >
          <LayoutGrid className="h-8 w-8" style={{ color: 'var(--brand-primary, #004694)' }} aria-hidden />
        </div>
        <h2 id="heatmap-heading" className="text-center text-lg font-black sm:text-xl" style={{ color: 'var(--brand-primary, #004694)' }}>
          מפת חום — כל הפרויקטים
        </h2>
        <p className="max-w-md text-center text-xs text-gray-500">
          לחצו על שורה לציר זמן הפרויקט · נורות תקציב ולו&quot;ז (אבני דרך)
        </p>
      </div>

      {loading && <p className="text-center text-sm text-gray-400">טוען…</p>}

      {!loading && rows.length === 0 && (
        <p className="rounded-4xl border border-gray-100 bg-white py-8 text-center text-sm text-gray-400">אין פרויקטים.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="w-full overflow-x-auto px-safe">
          <table className="w-full min-w-[320px] border-separate border-spacing-0 text-center">
            <thead>
              <tr>
                <th className="rounded-4xl rounded-b-none border border-b-0 border-gray-100 bg-white py-4 text-xs font-black text-gray-600">
                  פרויקט
                </th>
                <th className="border border-b-0 border-gray-100 bg-white py-4 text-xs font-black text-gray-600">תכנון</th>
                <th className="border border-b-0 border-gray-100 bg-white py-4 text-xs font-black text-gray-600">ביצוע</th>
                <th className="border border-b-0 border-gray-100 bg-white py-4 text-xs font-black text-gray-600">חיווי תקציב</th>
                <th className="border border-b-0 border-gray-100 bg-white py-4 text-xs font-black text-gray-600">חיווי לו&quot;ז</th>
                <th className="rounded-4xl rounded-b-none border border-b-0 border-gray-100 bg-white py-4 text-xs font-black text-gray-600">
                  אבני דרך
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50/80"
                  onClick={() => go(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      go(r.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`פתח ציר זמן: ${r.name}`}
                >
                  <td
                    className={`border border-gray-100 bg-white px-4 py-4 text-sm font-bold ${
                      i === rows.length - 1 ? 'rounded-4xl rounded-t-none border-t-0' : 'border-b-0'
                    }`}
                    style={{ color: 'var(--brand-primary, #004694)' }}
                  >
                    {r.name}
                  </td>
                  <td
                    className={`border border-gray-100 bg-white px-2 py-4 text-xs font-mono ${i === rows.length - 1 ? 'border-t-0' : 'border-b-0'}`}
                  >
                    {Math.round(r.budget).toLocaleString('he-IL')} ₪
                  </td>
                  <td
                    className={`border border-gray-100 bg-white px-2 py-4 text-xs font-mono ${i === rows.length - 1 ? 'border-t-0' : 'border-b-0'}`}
                  >
                    {Math.round(r.actual).toLocaleString('he-IL')} ₪
                  </td>
                  <td className={`border border-gray-100 bg-white px-4 py-4 ${i === rows.length - 1 ? 'border-t-0' : 'border-b-0'}`}>
                    <Led tone={r.budgetLed} label="תקציב" />
                  </td>
                  <td className={`border border-gray-100 bg-white px-4 py-4 ${i === rows.length - 1 ? 'border-t-0' : 'border-b-0'}`}>
                    <Led tone={r.scheduleLed} label="לו&quot;ז" />
                  </td>
                  <td
                    className={`border border-gray-100 bg-white px-2 py-4 text-xs font-bold text-gray-600 ${i === rows.length - 1 ? 'rounded-4xl rounded-t-none border-t-0' : 'border-b-0'}`}
                  >
                    {r.milestoneLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
