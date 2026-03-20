/**
 * Legacy invoice / receipt parser — Gemini 1.5 Pro (PDF, images, Excel→text).
 * Server-only.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as XLSX from 'xlsx';
import { Buffer } from 'node:buffer';

const MODEL_ID = 'gemini-1.5-pro';

export type ParsedLegacyLine = {
  transactionDateIso: string | null;
  vendor: string | null;
  totalNis: number | null;
  description: string | null;
  confidenceNotes: string[];
};

export type LegacyFileParseResult = {
  fileName: string;
  invoices: ParsedLegacyLine[];
  rawSnippet?: string;
};

const PROMPT = `You are an accounting assistant for Israeli construction (BSD-YBM). Extract invoice/receipt data from the attached document or text.

Return ONLY valid JSON (no markdown) with this shape:
{
  "invoices": [
    {
      "transactionDateIso": string | null (ISO 8601 date only or full datetime if known),
      "vendor": string | null,
      "totalNis": number | null (total in ILS),
      "description": string | null (short),
      "confidenceNotes": string[] (Hebrew ok)
    }
  ]
}

Rules:
- If multiple invoices appear, return multiple objects.
- If unsure of date, use null and explain in confidenceNotes.
- totalNis must be a number, not a string.
- For Hebrew dates, convert to ISO when possible.
`;

function safeParseJson(text: string): { invoices?: unknown[] } | null {
  const t = text.trim();
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try {
    return JSON.parse(t.slice(a, b + 1)) as { invoices?: unknown[] };
  } catch {
    return null;
  }
}

function coerceLine(x: Record<string, unknown>): ParsedLegacyLine {
  const notes = Array.isArray(x.confidenceNotes)
    ? (x.confidenceNotes as unknown[]).map((n) => String(n))
    : [];
  let total: number | null = null;
  const tr = x.totalNis;
  if (typeof tr === 'number' && Number.isFinite(tr)) total = tr;
  else if (typeof tr === 'string') {
    const n = Number(tr.replace(/[^\d.-]/g, ''));
    if (Number.isFinite(n)) total = n;
  }
  return {
    transactionDateIso: typeof x.transactionDateIso === 'string' ? x.transactionDateIso : null,
    vendor: typeof x.vendor === 'string' ? x.vendor : null,
    totalNis: total,
    description: typeof x.description === 'string' ? x.description : null,
    confidenceNotes: notes,
  };
}

function excelBufferToText(buf: Buffer, maxChars = 14000): string {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const first = wb.SheetNames[0];
  if (!first) return '';
  const sheet = wb.Sheets[first];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return csv.length > maxChars ? `${csv.slice(0, maxChars)}\n…[truncated]` : csv;
}

export async function parseLegacyFileWithGemini(opts: {
  apiKey: string;
  base64: string;
  mimeType: string;
  fileName: string;
}): Promise<LegacyFileParseResult> {
  const genAI = new GoogleGenerativeAI(opts.apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_ID });

  const mime = (opts.mimeType || 'application/octet-stream').toLowerCase();
  const buf = Buffer.from(opts.base64, 'base64');

  let parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
    { text: PROMPT + `\nFile name: ${opts.fileName}` },
  ];

  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    opts.fileName.toLowerCase().endsWith('.xlsx') ||
    opts.fileName.toLowerCase().endsWith('.xls')
  ) {
    const text = excelBufferToText(buf);
    parts.push({ text: `\n--- spreadsheet (csv preview) ---\n${text}` });
  } else {
    parts.push({
      inlineData: {
        mimeType: mime.includes('pdf') ? 'application/pdf' : mime || 'image/png',
        data: opts.base64.replace(/\s/g, ''),
      },
    });
  }

  const res = await model.generateContent(parts);
  const raw = res.response.text();
  const parsed = safeParseJson(raw);
  const invoicesRaw = parsed?.invoices;
  const invoices: ParsedLegacyLine[] = Array.isArray(invoicesRaw)
    ? invoicesRaw
        .map((row) => (row && typeof row === 'object' ? coerceLine(row as Record<string, unknown>) : null))
        .filter(Boolean) as ParsedLegacyLine[]
    : [];

  if (invoices.length === 0) {
    invoices.push({
      transactionDateIso: null,
      vendor: null,
      totalNis: null,
      description: null,
      confidenceNotes: ['לא זוהו שורות — נסו קובץ ברור יותר או עריכה ידנית.'],
    });
  }

  return {
    fileName: opts.fileName,
    invoices,
    rawSnippet: raw.slice(0, 1200),
  };
}
