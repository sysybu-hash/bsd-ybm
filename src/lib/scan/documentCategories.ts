/**
 * User-selected scan intent — drives Gemini prompts and persisted batch metadata.
 */
export const SCAN_DOCUMENT_CATEGORIES = ['invoice', 'legal_contract', 'technical_drawing'] as const;
export type ScanDocumentCategory = (typeof SCAN_DOCUMENT_CATEGORIES)[number];

export function parseScanDocumentCategory(raw: unknown): ScanDocumentCategory {
  const s = String(raw ?? '').trim();
  if (s === 'invoice' || s === 'legal_contract' || s === 'technical_drawing') return s;
  return 'invoice';
}

export const SCAN_CATEGORY_LABELS: Record<ScanDocumentCategory, { he: string; en: string }> = {
  invoice: { he: 'חשבונית / קבלה', en: 'Invoice / receipt' },
  legal_contract: { he: 'חוזה משפטי', en: 'Legal contract' },
  technical_drawing: { he: 'שרטוט טכני', en: 'Technical drawing' },
};

/**
 * Gemini extraction prompt — generic business / workplace wording (not industry-specific).
 */
export function buildGeminiScanPrompt(category: ScanDocumentCategory = 'invoice'): string {
  switch (category) {
    case 'legal_contract':
      return [
        'Analyze this legal contract document.',
        'Context: business document management (BSD-YBM).',
        'Extract as JSON: parties (names or roles), effective dates, key obligations, payment or fee amounts, termination or renewal terms, and whether signatures appear present.',
        'Return valid JSON only.',
      ].join(' ');
    case 'technical_drawing':
      return [
        'Analyze this technical drawing, plan sheet, or CAD print.',
        'Extract as JSON: sheet title, discipline or trade, scale, revision, drawing or sheet number, project or job reference, and any key dimensions or notes readable on the sheet.',
        'Return valid JSON only.',
      ].join(' ');
    case 'invoice':
    default:
      return [
        'Analyze this business document (invoice, receipt, delivery note, or payment record).',
        'Context: workplace and project operations (BSD-YBM).',
        'Extract as JSON: Provider Name (vendor), Total Amount, Document Date, line items or description summary, and Project or Job reference if present.',
        'Return valid JSON only.',
      ].join(' ');
  }
}
