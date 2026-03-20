/**
 * Anomaly detection — BOQ vs actual spend, field logs vs supplier quantities (Phase 14.0).
 * Threshold default: discrepancy > 10% triggers "red light" classification.
 */

import type { DraftBoqLine } from '@/services/ai/BlueprintAnalyzer';

export const DEFAULT_DISCREPANCY_THRESHOLD = 0.1;

export type AnomalyKind = 'boq_vs_invoices' | 'field_vs_supplier' | 'aggregate_spend';

export type AnomalySignal = {
  kind: AnomalyKind;
  /** 0–100 */
  discrepancyPct: number;
  title: string;
  detail: string;
  meta?: Record<string, unknown>;
};

function pctDiff(a: number, b: number): number {
  const base = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  return Math.abs(a - b) / base;
}

/** Sum BOQ line totals (prefers lineTotalNis, else quantity * unitRateNis). */
export function sumDraftBoqNis(lines: DraftBoqLine[]): number {
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
 * Compare total BOQ estimate vs Σ invoice / expense totals for the same project.
 */
export function detectBoqVsInvoiceDiscrepancy(opts: {
  boqTotalNis: number;
  invoiceTotalNis: number;
  threshold?: number;
  projectId?: string;
}): AnomalySignal | null {
  const th = opts.threshold ?? DEFAULT_DISCREPANCY_THRESHOLD;
  const boq = opts.boqTotalNis;
  const inv = opts.invoiceTotalNis;
  if (!Number.isFinite(boq) || !Number.isFinite(inv) || boq <= 0) {
    return null;
  }
  const d = pctDiff(boq, inv);
  if (d <= th) return null;
  return {
    kind: 'boq_vs_invoices',
    discrepancyPct: Math.round(d * 1000) / 10,
    title: 'סטייה BOQ מול חשבוניות',
    detail: `סה״כ BOQ משוער ${boq.toLocaleString('he-IL')} ₪ מול ביצוע/חשבוניות ${inv.toLocaleString('he-IL')} ₪ (סטייה ${(d * 100).toFixed(1)}%).`,
    meta: { projectId: opts.projectId, boqTotalNis: boq, invoiceTotalNis: inv },
  };
}

/**
 * e.g. concrete m³ from field log vs supplier invoice line.
 */
export function detectFieldVsSupplierMismatch(opts: {
  fieldQuantity: number;
  supplierQuantity: number;
  commodityLabel: string;
  threshold?: number;
  projectId?: string;
}): AnomalySignal | null {
  const th = opts.threshold ?? DEFAULT_DISCREPANCY_THRESHOLD;
  const a = opts.fieldQuantity;
  const b = opts.supplierQuantity;
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0) {
    return null;
  }
  const d = pctDiff(a, b);
  if (d <= th) return null;
  return {
    kind: 'field_vs_supplier',
    discrepancyPct: Math.round(d * 1000) / 10,
    title: `אי-התאמה כמות — ${opts.commodityLabel}`,
    detail: `מהשטח/יומן: ${a} מול ספק/חשבונית: ${b} (סטייה ${(d * 100).toFixed(1)}%).`,
    meta: { projectId: opts.projectId, fieldQuantity: a, supplierQuantity: b },
  };
}

export function anyCriticalAnomaly(signals: AnomalySignal[]): boolean {
  return signals.some((s) => s.discrepancyPct > (DEFAULT_DISCREPANCY_THRESHOLD * 100));
}
