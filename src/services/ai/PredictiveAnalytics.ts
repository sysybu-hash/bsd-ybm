/**
 * Profitability forecaster — historical supplier/unit hints → estimated project cost (Phase 14.0).
 */

import type { DraftBoqLine } from '@/services/ai/BlueprintAnalyzer';

export type HistoricalPriceRow = {
  /** Normalized key: description/category fragment */
  key: string;
  unitRateNis: number;
  weight?: number;
};

/** Tokenize Hebrew/English description for coarse matching. */
export function normalizeBoqKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6)
    .join('|');
}

export function sumDraftBoqWithRates(lines: DraftBoqLine[]): number {
  let s = 0;
  for (const L of lines) {
    if (typeof L.lineTotalNis === 'number' && Number.isFinite(L.lineTotalNis)) {
      s += L.lineTotalNis;
      continue;
    }
    const q = L.quantity;
    const r = L.unitRateNis;
    if (typeof q === 'number' && typeof r === 'number' && Number.isFinite(q) && Number.isFinite(r)) {
      s += q * r;
    }
  }
  return Math.round(s * 100) / 100;
}

/**
 * Build a simple price book from past expense rows (e.g. finances docs: vendor + amount + category).
 */
export function buildHistoricalUnitRatesFromFinances(
  rows: { description?: string; category?: string; amount: number }[]
): Map<string, number> {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const label = String(r.description ?? r.category ?? 'expense').trim();
    if (!label || !Number.isFinite(r.amount) || r.amount <= 0) continue;
    const key = normalizeBoqKey(label) || 'general';
    const cur = acc.get(key) ?? { sum: 0, n: 0 };
    cur.sum += r.amount;
    cur.n += 1;
    acc.set(key, cur);
  }
  const out = new Map<string, number>();
  acc.forEach((v, k) => {
    out.set(k, Math.round((v.sum / v.n) * 100) / 100);
  });
  return out;
}

/**
 * When line has no rate, estimate cost using historical median-like map (fallback: quantity * defaultRate).
 */
export function estimateProjectCostFromDraft(
  lines: DraftBoqLine[],
  priceBook: Map<string, number>,
  defaultUnitRateNis = 180
): { estimatedCostNis: number; matchedLines: number; unmatchedLines: number } {
  let estimated = 0;
  let matched = 0;
  let unmatched = 0;

  for (const L of lines) {
    if (typeof L.lineTotalNis === 'number' && Number.isFinite(L.lineTotalNis) && L.lineTotalNis > 0) {
      estimated += L.lineTotalNis;
      matched++;
      continue;
    }
    const q = typeof L.quantity === 'number' && Number.isFinite(L.quantity) ? L.quantity : 0;
    const nk = normalizeBoqKey(L.description);
    let rate = nk ? priceBook.get(nk) : undefined;
    if (rate == null) {
      for (const [k, v] of priceBook) {
        if (nk && (k.includes(nk.split('|')[0] ?? '') || nk.includes(k.split('|')[0] ?? ''))) {
          rate = v;
          break;
        }
      }
    }
    if (rate == null) {
      rate =
        typeof L.unitRateNis === 'number' && Number.isFinite(L.unitRateNis) && L.unitRateNis > 0
          ? L.unitRateNis
          : defaultUnitRateNis;
      unmatched++;
    } else {
      matched++;
    }
    estimated += q * rate;
  }

  return {
    estimatedCostNis: Math.round(estimated * 100) / 100,
    matchedLines: matched,
    unmatchedLines: unmatched,
  };
}

export function suggestEstimatedProfitBadge(opts: {
  budgetOrRevenueNis: number;
  estimatedCostNis: number;
}): { label: string; profitNis: number; tone: 'positive' | 'negative' | 'neutral' } {
  const profit = Math.round((opts.budgetOrRevenueNis - opts.estimatedCostNis) * 100) / 100;
  if (profit > 0) {
    return {
      label: `הערכת רווח: ${profit.toLocaleString('he-IL')} ₪`,
      profitNis: profit,
      tone: 'positive',
    };
  }
  if (profit < 0) {
    return {
      label: `הערכת גירעון: ${Math.abs(profit).toLocaleString('he-IL')} ₪`,
      profitNis: profit,
      tone: 'negative',
    };
  }
  return { label: 'איזון משוער', profitNis: 0, tone: 'neutral' };
}
