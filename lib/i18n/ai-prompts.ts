import {
  LOCALE_AI_LANGUAGE_NAMES,
  normalizeLocale,
  type AppLocale,
} from "./config";

/** גרסת סכימת JSON — חייב לזהות עם DocumentScanCache.schemaVersion */
export const DOCUMENT_JSON_SCHEMA_VERSION = 2;

export function getDocumentJsonInstruction(locale: string): string {
  const loc = normalizeLocale(locale) as AppLocale;
  const lang = LOCALE_AI_LANGUAGE_NAMES[loc] ?? "English";
  return `Analyze the document for BSD-YBM. Return ONLY a JSON object (no markdown), with this exact shape:
{"vendor": string, "total": number, "date": string, "docType": string, "summary": string, "lineItems": Array<{"description": string, "quantity"?: number, "unitPrice"?: number, "lineTotal"?: number, "sku"?: string}>}

Rules for lineItems:
- For invoices, receipts, quotes — extract EVERY product/line with description and price when visible.
- If no line items exist, use "lineItems": [].
- Prefer unitPrice as price per single unit; lineTotal as full line amount if clearer.
- description MUST be in ${lang}.

All human-readable string values in the JSON (vendor, docType, summary, line item descriptions, and any natural-language date text) MUST be written in ${lang}.
`;
}

export function getAiChatSystemPrefix(contextJson: string, locale: string): string {
  const loc = normalizeLocale(locale) as AppLocale;
  const lang = LOCALE_AI_LANGUAGE_NAMES[loc] ?? "English";
  return `You are the BSD-YBM assistant. Answer clearly and concisely in ${lang}. Context (JSON):\n${contextJson.slice(0, 100_000)}\n\nQuestion:\n`;
}
