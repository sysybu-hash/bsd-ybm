import type { FinanceDocRow } from '@/services/reports/types';

export type MonthlyCostSummary = {
  /** YYYY-MM */
  monthKey: string;
  laborTotal: number;
  materialTotal: number;
  otherExpenseTotal: number;
  revenueTotal: number;
  docCount: number;
};

/**
 * Scaffold: aggregates finance lines by calendar month.
 * Extend with timezone rules, VAT, and project filters when accounting export matures.
 */
export function prepareMonthlyLaborVsMaterialSummary(
  rows: FinanceDocRow[],
  year: number,
  month: number
): MonthlyCostSummary {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  let laborTotal = 0;
  let materialTotal = 0;
  let otherExpenseTotal = 0;
  let revenueTotal = 0;
  let docCount = 0;

  for (const r of rows) {
    const raw = r.raw.createdAt as { toDate?: () => Date } | undefined;
    let d: Date | null = null;
    if (raw && typeof raw.toDate === 'function') {
      try {
        d = raw.toDate();
      } catch {
        d = null;
      }
    }
    if (!d || d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;

    docCount += 1;
    const t = r.type.toLowerCase();
    if (t === 'labor' || r.raw.source === 'meckano_sync') {
      laborTotal += r.amount;
    } else if (t === 'material') {
      materialTotal += r.amount;
    } else if (t === 'revenue' || t === 'income' || t === 'הכנסה') {
      revenueTotal += r.amount;
    } else if (r.amount > 0) {
      otherExpenseTotal += r.amount;
    }
  }

  return {
    monthKey,
    laborTotal: Math.round(laborTotal * 100) / 100,
    materialTotal: Math.round(materialTotal * 100) / 100,
    otherExpenseTotal: Math.round(otherExpenseTotal * 100) / 100,
    revenueTotal: Math.round(revenueTotal * 100) / 100,
    docCount,
  };
}
