'use client';

import React, { useMemo, type CSSProperties } from 'react';
import { Crown } from 'lucide-react';
import { useCompanyFinancials, type ProjectHealthRow } from '@/hooks/useCompanyFinancials';
import { useDemoMode } from '@/services/demo/DemoProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { getDemoFinancialBundle } from '@/services/demo/mockSectorData';
import { useLocale } from '@/context/LocaleContext';

type BudgetLed = 'good' | 'bad' | 'muted';
type ScheduleLed = 'good' | 'warn' | 'muted';

export type ExecutiveHeatmapRow = {
  id: string;
  name: string;
  budgetLed: BudgetLed;
  scheduleLed: ScheduleLed;
  workersOnSite: number;
  budget: number;
  actual: number;
};

function budgetLedFor(budget: number, actual: number): BudgetLed {
  if (budget <= 0 && actual <= 0) return 'muted';
  if (budget <= 0) return actual > 0 ? 'bad' : 'muted';
  return actual > budget * 1.01 ? 'bad' : 'good';
}

function scheduleLedFromRatio(ratio: number): ScheduleLed {
  if (ratio >= 0.78) return 'good';
  if (ratio <= 0) return 'muted';
  return 'warn';
}

function scheduleLedReal(p: ProjectHealthRow): ScheduleLed {
  if (p.budgeted <= 0) return 'muted';
  const pace = p.actual / Math.max(p.budgeted, 1);
  return scheduleLedFromRatio(Math.min(1, pace + 0.15));
}

function ledStyle(tone: BudgetLed | ScheduleLed): CSSProperties {
  switch (tone) {
    case 'good':
      return {
        backgroundColor: '#22c55e',
        boxShadow: '0 0 12px rgba(34, 197, 94, 0.65)',
      };
    case 'bad':
      return {
        backgroundColor: '#ef4444',
        boxShadow: '0 0 12px rgba(239, 68, 68, 0.55)',
      };
    case 'warn':
      return {
        backgroundColor: '#f97316',
        boxShadow: '0 0 12px rgba(249, 115, 22, 0.55)',
      };
    default:
      return {
        backgroundColor: '#d1d5db',
        boxShadow: 'none',
        opacity: 0.5,
      };
  }
}

function workersEstimateReal(p: ProjectHealthRow): number {
  if (p.actual <= 0) return 0;
  return Math.min(24, Math.max(1, Math.round(p.actual / 680)));
}

export default function ExecutiveHeatmap() {
  const { dataMode } = useDemoMode();
  const { sector, meckanoModuleEnabled } = useSubscription();
  const { allProjects, loading, companyId } = useCompanyFinancials();
  const { dir, locale, t } = useLocale();

  const rows = useMemo((): ExecutiveHeatmapRow[] => {
    if (dataMode === 'demo') {
      const bundle = getDemoFinancialBundle(sector);
      return bundle.projects.map((p) => ({
        id: p.id,
        name: p.name,
        budget: p.budgeted,
        actual: p.actual,
        budgetLed: budgetLedFor(p.budgeted, p.actual),
        scheduleLed: scheduleLedFromRatio(p.scheduleRatio),
        workersOnSite: p.workersOnSite,
      }));
    }
    return allProjects.map((p) => ({
      id: p.id,
      name: p.name,
      budget: p.budgeted,
      actual: p.actual,
      budgetLed: budgetLedFor(p.budgeted, p.actual),
      scheduleLed: scheduleLedReal(p),
      workersOnSite: workersEstimateReal(p),
    }));
  }, [dataMode, sector, allProjects]);

  const title = t('heatmap.executive.title');
  const subtitle =
    dataMode === 'demo'
      ? locale === 'he'
        ? meckanoModuleEnabled
          ? 'נתוני הדגמה לפי ענף — Meckano ופיננסים סינתטיים'
          : 'נתוני הדגמה לפי ענף — פיננסים סינתטיים'
        : meckanoModuleEnabled
          ? 'Demo sector data — synthetic Meckano & P&L'
          : 'Demo sector data — synthetic financials'
      : locale === 'he'
        ? 'בריאות תקציב, לוח זמנים והערכת עובדים בשטח'
        : 'Budget health, schedule pulse, and on-site worker estimate';

  if (!companyId && dataMode !== 'demo') return null;

  return (
    <section
      className="empire-shimmer-gold dashboard-tile-shimmer w-full rounded-4xl border border-gray-100 bg-[#FDFDFD] p-4 shadow-sm sm:p-8"
      dir={dir}
      aria-labelledby="executive-heatmap-title"
    >
      <div className="mb-6 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex flex-col items-center justify-center gap-2 sm:items-start">
          <div className="flex items-center justify-center gap-3">
            <Crown className="h-8 w-8 shrink-0 text-amber-500" aria-hidden />
            <h2 id="executive-heatmap-title" className="text-xl font-black text-[#1a1a1a] sm:text-2xl">
              {title}
            </h2>
          </div>
          <p className="max-w-xl text-sm text-gray-500">{subtitle}</p>
        </div>
        {dataMode === 'demo' && (
          <span className="rounded-4xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900">
            DEMO
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-4xl border border-gray-100">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-center">
              <th className="p-4 font-bold text-gray-700">{t('heatmap.executive.colProject')}</th>
              <th className="p-4 font-bold text-gray-700">{t('heatmap.executive.colBudget')}</th>
              <th className="p-4 font-bold text-gray-700">{t('heatmap.executive.colSchedule')}</th>
              <th className="p-4 font-bold text-gray-700">{t('heatmap.executive.colWorkers')}</th>
              <th className="p-4 font-bold text-gray-700">{t('heatmap.executive.colBudgetNis')}</th>
              <th className="p-4 font-bold text-gray-700">{t('heatmap.executive.colActualNis')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  …
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  {t('heatmap.executive.empty')}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="p-4 text-center font-semibold text-[#1a1a1a]">{r.name}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center">
                      <span
                        className="inline-block h-4 w-4 rounded-full"
                        style={ledStyle(r.budgetLed)}
                        title={r.budgetLed}
                        aria-label={`budget ${r.budgetLed}`}
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center">
                      <span
                        className="inline-block h-4 w-4 rounded-full"
                        style={ledStyle(r.scheduleLed)}
                        title={r.scheduleLed}
                        aria-label={`schedule ${r.scheduleLed}`}
                      />
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-gray-800">{r.workersOnSite}</td>
                  <td className="p-4 text-center text-gray-600">{r.budget.toLocaleString()}</td>
                  <td className="p-4 text-center text-gray-600">{r.actual.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
