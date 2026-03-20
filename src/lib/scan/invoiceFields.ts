import type { AiScanEngineId } from '@/services/events/EventPipeline';

/** Normalized invoice fields for Hebrew UI + P&L commit */
export type InvoiceFieldSet = {
  supplierName: string;
  invoiceDate: string;
  totalAmount: string;
  vatAmount: string;
  projectName: string;
  category: string;
};

export const INVOICE_FIELD_LABELS: Record<keyof InvoiceFieldSet, string> = {
  supplierName: 'שם ספק',
  invoiceDate: 'תאריך חשבונית',
  totalAmount: 'סכום כולל',
  vatAmount: 'סכום מע״מ',
  projectName: 'פרויקט מזוהה',
  category: 'קטגוריה',
};

export const EMPTY_INVOICE_FIELDS: InvoiceFieldSet = {
  supplierName: '',
  invoiceDate: '',
  totalAmount: '',
  vatAmount: '',
  projectName: '',
  category: '',
};

export const ENGINE_LABELS_HE: Record<AiScanEngineId, string> = {
  mindstudio: 'MindStudio OCR',
  gemini: 'Gemini Vision',
  document_ai: 'Google Document AI',
  textract: 'AWS Textract',
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return String(v).trim();
}

/** Strip ```json fences from Gemini responses */
function unwrapJsonText(s: string): string {
  let t = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) t = fence[1].trim();
  return t;
}

function tryParseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const u = unwrapJsonText(text);
    const o = JSON.parse(u) as unknown;
    return asRecord(o);
  } catch {
    return null;
  }
}

function pickFromObject(o: Record<string, unknown>): Partial<InvoiceFieldSet> {
  const supplier =
    str(
      o.providerName ??
        o.ProviderName ??
        o.supplier ??
        o.vendor ??
        o.שם_ספק ??
        o['שם ספק']
    ) || '';
  const date =
    str(
      o.date ??
        o.invoiceDate ??
        o.documentDate ??
        o['תאריך חשבונית'] ??
        o.תאריך
    ) || '';
  const total =
    str(
      o.totalAmount ??
        o.total ??
        o.amount ??
        o['סכום כולל'] ??
        o.sum
    ) || '';
  const vat =
    str(
      o.vatAmount ??
        o.vat ??
        o.VAT ??
        o['מע״מ'] ??
        o['סכום מע״מ']
    ) || '';
  const project =
    str(
      o.projectName ??
        o.project ??
        o.projectId ??
        o['פרויקט מזוהה']
    ) || '';
  const category = str(o.category ?? o['קטגוריה'] ?? o.type) || '';
  return {
    supplierName: supplier,
    invoiceDate: date,
    totalAmount: total,
    vatAmount: vat,
    projectName: project,
    category: category || 'חומרים / חשבונית',
  };
}

/** Heuristic: lines with ₪ or ILS or number pattern */
function extractFromPlainText(blob: string): Partial<InvoiceFieldSet> {
  const text = blob.replace(/\s+/g, ' ').trim();
  const out: Partial<InvoiceFieldSet> = {};
  const money = /(?:₪|ILS|ש״ח)?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:₪|ILS)?/gi;
  const dates =
    /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b|\b(\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/g;
  let m: RegExpExecArray | null;
  const amounts: string[] = [];
  while ((m = money.exec(text)) !== null) {
    if (m[1]) amounts.push(m[1].replace(/,/g, ''));
  }
  if (amounts.length > 0) {
    out.totalAmount = amounts.sort((a, b) => parseFloat(b) - parseFloat(a))[0] ?? '';
  }
  const dm = dates.exec(text);
  if (dm) out.invoiceDate = dm[1] || dm[2] || '';
  if (/[\u0590-\u05FF]/.test(text)) {
    const words = text.split(/[,.;]/).map((w) => w.trim()).filter(Boolean);
    const heb = words.find((w) => /[\u0590-\u05FF]{3,}/.test(w) && w.length < 80);
    if (heb) out.supplierName = heb;
  }
  if (!out.category) out.category = 'חומרים / חשבונית';
  return out;
}

export function decodeMindStudioSummary(summary: unknown): InvoiceFieldSet {
  const base = { ...EMPTY_INVOICE_FIELDS };
  const root = asRecord(summary) ?? {};
  const inner = asRecord(root.result) ?? root;
  const picked = pickFromObject(inner);
  return { ...base, ...picked };
}

export function decodeGeminiSummary(summary: unknown): InvoiceFieldSet {
  const base = { ...EMPTY_INVOICE_FIELDS };
  if (typeof summary === 'string') {
    const obj = tryParseJsonObject(summary);
    if (obj) return { ...base, ...pickFromObject(obj) };
    return { ...base, ...extractFromPlainText(summary) };
  }
  const rec = asRecord(summary);
  if (rec) {
    const text = str(rec.text ?? rec.result);
    if (text) {
      const obj = tryParseJsonObject(text);
      if (obj) return { ...base, ...pickFromObject(obj) };
      return { ...base, ...extractFromPlainText(text) };
    }
    return { ...base, ...pickFromObject(rec) };
  }
  return base;
}

export function decodeDocumentAiSummary(summary: unknown): InvoiceFieldSet {
  const base = { ...EMPTY_INVOICE_FIELDS };
  const rec = asRecord(summary);
  if (!rec) return { ...base, ...extractFromPlainText(String(summary)) };

  const doc = asRecord(rec.document);
  const text =
    str(doc?.text) ||
    str(rec.text) ||
    JSON.stringify(rec).slice(0, 8000);
  const entities = doc?.entities;
  const picked: Partial<InvoiceFieldSet> = { ...extractFromPlainText(text) };
  if (Array.isArray(entities)) {
    for (const e of entities) {
      const er = asRecord(e);
      const type = str(er?.type).toLowerCase();
      const mention = str(er?.mentionText);
      if (!mention) continue;
      if (type.includes('total') || type.includes('amount')) picked.totalAmount = mention;
      if (type.includes('date')) picked.invoiceDate = mention;
      if (type.includes('supplier') || type.includes('vendor')) picked.supplierName = mention;
    }
  }
  return { ...base, ...picked, category: picked.category || 'חומרים / חשבונית' };
}

export function decodeTextractSummary(summary: unknown): InvoiceFieldSet {
  const base = { ...EMPTY_INVOICE_FIELDS };
  const rec = asRecord(summary);
  const lines = rec?.summary;
  if (Array.isArray(lines)) {
    const text = lines.map((x) => String(x)).join('\n');
    return { ...base, ...extractFromPlainText(text) };
  }
  return { ...base, ...extractFromPlainText(JSON.stringify(summary)) };
}

export function decodeEngineSummary(engine: AiScanEngineId, summary: unknown): InvoiceFieldSet {
  switch (engine) {
    case 'mindstudio':
      return decodeMindStudioSummary(summary);
    case 'gemini':
      return decodeGeminiSummary(summary);
    case 'document_ai':
      return decodeDocumentAiSummary(summary);
    case 'textract':
      return decodeTextractSummary(summary);
    default:
      return { ...EMPTY_INVOICE_FIELDS };
  }
}
