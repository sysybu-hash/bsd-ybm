import type { AiScanEngineId } from '@/services/events/EventPipeline';
import {
  type InvoiceFieldSet,
  EMPTY_INVOICE_FIELDS,
  ENGINE_LABELS_HE,
} from '@/lib/scan/invoiceFields';

const PREFERRED_ORDER: AiScanEngineId[] = ['gemini', 'mindstudio', 'document_ai', 'textract'];

function hasHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

function looksLikeAmount(s: string): boolean {
  if (!s.trim()) return false;
  const n = parseFloat(s.replace(/,/g, '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0;
}

function looksLikeDate(s: string): boolean {
  return /\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(s);
}

/** Higher = better candidate for "recommended" */
export function scoreInvoiceFields(fields: InvoiceFieldSet): number {
  let score = 0;
  const checks: [keyof InvoiceFieldSet, number][] = [
    ['supplierName', 18],
    ['invoiceDate', 14],
    ['totalAmount', 22],
    ['vatAmount', 10],
    ['projectName', 14],
    ['category', 6],
  ];
  for (const [key, w] of checks) {
    const v = fields[key]?.trim();
    if (v) score += w;
  }
  if (hasHebrew(fields.supplierName)) score += 12;
  if (looksLikeAmount(fields.totalAmount)) score += 14;
  if (looksLikeDate(fields.invoiceDate)) score += 10;
  if (looksLikeAmount(fields.vatAmount)) score += 6;
  if (fields.supplierName.length >= 2 && fields.supplierName.length <= 120) score += 4;
  return score;
}

export type RefereeOutcome = {
  recommendedEngine: AiScanEngineId | null;
  recommendedFields: InvoiceFieldSet;
  scores: Record<string, number>;
  reasoningHe: string;
};

function mergeNonEmpty(base: InvoiceFieldSet, ...sources: InvoiceFieldSet[]): InvoiceFieldSet {
  const keys = Object.keys(base) as (keyof InvoiceFieldSet)[];
  const out = { ...base };
  for (const key of keys) {
    if (out[key]?.trim()) continue;
    for (const src of sources) {
      const v = src[key]?.trim();
      if (v) {
        out[key] = v;
        break;
      }
    }
  }
  return out;
}

export function runAiReferee(
  decodedByEngine: Partial<Record<AiScanEngineId, InvoiceFieldSet>>
): RefereeOutcome {
  const engines = (Object.keys(decodedByEngine) as AiScanEngineId[]).filter(
    (e) => decodedByEngine[e] != null
  );

  if (engines.length === 0) {
    return {
      recommendedEngine: null,
      recommendedFields: { ...EMPTY_INVOICE_FIELDS },
      scores: {},
      reasoningHe:
        'לא נמצאו תוצאות מנועים לניתוח. נא להזין שדות ידנית או להריץ סריקה מחדש.',
    };
  }

  const scores: Record<string, number> = {};
  let best: AiScanEngineId | null = null;
  let bestScore = -1;

  for (const e of engines) {
    const f = decodedByEngine[e]!;
    const s = scoreInvoiceFields(f);
    scores[e] = s;
    if (s > bestScore) {
      bestScore = s;
      best = e;
    } else if (s === bestScore && best != null) {
      const pref = (id: AiScanEngineId) => PREFERRED_ORDER.indexOf(id);
      if (pref(e) < pref(best)) best = e;
    }
  }

  const winner = best!;
  const winnerFields = decodedByEngine[winner]!;
  const others = engines.filter((e) => e !== winner).map((e) => decodedByEngine[e]!);
  const merged = mergeNonEmpty(winnerFields, ...others);

  const label = winner ? ENGINE_LABELS_HE[winner] : '';
  const hebrewBonus = hasHebrew(winnerFields.supplierName) ? 'זוהה טקסט עברי חזק בשם הספק' : 'שדות מלאים יחסית';
  const amountBonus = looksLikeAmount(winnerFields.totalAmount) ? 'סכום כולל בפורמט מספרי תקין' : 'נדרש אימות סכום';

  const confidence = Math.min(99, Math.max(40, Math.round(52 + bestScore * 0.85)));
  const reasoningHe = `מומלץ לפי מנוע ${label}: ציון ${bestScore} נקודות (ביטחון משוער בחילוץ עברית ~${confidence}%) — ${hebrewBonus}; ${amountBonus}. האיחוד משלים שדות חסרים ממנועים אחרים.`;

  return {
    recommendedEngine: winner,
    recommendedFields: merged,
    scores,
    reasoningHe,
  };
}
