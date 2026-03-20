/**
 * Template-driven finance export for accounting systems.
 * Heavy deps (xlsx) are loaded only inside async export helpers (client-safe, avoids SSR worker issues).
 */

import type { FinanceDocRow } from '@/services/reports/types';

export type FinanceSoftware = 'hashvashvet' | 'priority' | 'sap' | 'quickbooks' | 'generic_csv';

export type ExportFormat = 'csv' | 'xlsx' | 'json';

/** Canonical BSD-YBM finance fields available for mapping. */
export type BsdFieldKey =
  | 'date'
  | 'amount'
  | 'currency'
  | 'vendor'
  | 'supplierId'
  | 'tax'
  | 'projectId'
  | 'category'
  | 'type'
  | 'description'
  | 'hours'
  | 'teamMemberName'
  | 'recordId';

/** Maps each BSD field → target column header in the export file. */
export type FieldMapping = Partial<Record<BsdFieldKey, string>>;

export type SoftwareExportTemplate = {
  software: FinanceSoftware;
  labelHe: string;
  labelEn: string;
  /** Default column headers for this software */
  defaultMapping: FieldMapping;
  /** Stable column order (only keys present in merged mapping are emitted). */
  columnOrder: BsdFieldKey[];
};

function str(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

export function extractBsdField(row: FinanceDocRow, key: BsdFieldKey): string {
  const r = row.raw;
  switch (key) {
    case 'date':
      return row.createdAtLabel;
    case 'amount':
      return String(Number(row.amount) || 0);
    case 'currency':
      return str(r.currency ?? 'ILS');
    case 'vendor':
      return row.vendor;
    case 'supplierId':
      return str(r.supplierId ?? r.supplier_id ?? row.vendor);
    case 'tax':
      return str(r.tax ?? r.vat ?? r.vatAmount ?? r.vat_amount ?? '');
    case 'projectId':
      return row.projectId;
    case 'category':
      return row.category;
    case 'type':
      return row.type;
    case 'description':
      return str(r.description ?? r.memo ?? r.notes ?? row.category);
    case 'hours':
      return row.hours;
    case 'teamMemberName':
      return row.teamMemberName;
    case 'recordId':
      return row.id;
    default:
      return '';
  }
}

export const EXPORT_TEMPLATES: Record<FinanceSoftware, SoftwareExportTemplate> = {
  hashvashvet: {
    software: 'hashvashvet',
    labelHe: 'חשבשבת',
    labelEn: 'Hashvashvet',
    defaultMapping: {
      recordId: 'מסמך',
      date: 'תאריך',
      amount: 'סכום',
      tax: 'מע״מ',
      supplierId: 'ספק',
      projectId: 'מחלקה',
      category: 'קטגוריה',
      description: 'פירוט',
    },
    columnOrder: [
      'recordId',
      'date',
      'amount',
      'tax',
      'supplierId',
      'projectId',
      'category',
      'description',
    ],
  },
  priority: {
    software: 'priority',
    labelHe: 'Priority',
    labelEn: 'Priority',
    defaultMapping: {
      date: 'DocumentDate',
      supplierId: 'SupplierCode',
      amount: 'Amount',
      tax: 'VAT',
      projectId: 'ProjectCode',
      category: 'ExpenseType',
      description: 'Details',
      currency: 'Currency',
    },
    columnOrder: ['date', 'supplierId', 'amount', 'tax', 'currency', 'projectId', 'category', 'description'],
  },
  sap: {
    software: 'sap',
    labelHe: 'SAP',
    labelEn: 'SAP',
    defaultMapping: {
      date: 'BUDAT',
      amount: 'WRBTR',
      currency: 'WAERS',
      supplierId: 'LIFNR',
      tax: 'MWSKZ',
      projectId: 'KOSTL',
      category: 'SGTXT',
      description: 'XREF1',
      recordId: 'BELNR',
    },
    columnOrder: ['recordId', 'date', 'amount', 'currency', 'supplierId', 'tax', 'projectId', 'category', 'description'],
  },
  quickbooks: {
    software: 'quickbooks',
    labelHe: 'QuickBooks',
    labelEn: 'QuickBooks',
    defaultMapping: {
      date: 'Date',
      vendor: 'Vendor',
      amount: 'Amount',
      tax: 'Sales Tax',
      category: 'Category',
      projectId: 'Class',
      description: 'Memo',
      type: 'Transaction Type',
    },
    columnOrder: ['date', 'vendor', 'amount', 'tax', 'category', 'projectId', 'description', 'type'],
  },
  generic_csv: {
    software: 'generic_csv',
    labelHe: 'CSV גנרי (Excel)',
    labelEn: 'Generic CSV (Excel)',
    defaultMapping: {
      recordId: 'id',
      date: 'date',
      amount: 'amount',
      currency: 'currency',
      vendor: 'vendor',
      tax: 'tax',
      projectId: 'project_id',
      category: 'category',
      type: 'type',
      description: 'description',
      hours: 'hours',
      teamMemberName: 'team_member',
    },
    columnOrder: [
      'recordId',
      'date',
      'amount',
      'currency',
      'vendor',
      'tax',
      'projectId',
      'category',
      'type',
      'description',
      'hours',
      'teamMemberName',
    ],
  },
};

export function mergeFieldMapping(
  software: FinanceSoftware,
  userOverride?: FieldMapping | null
): FieldMapping {
  const base = { ...EXPORT_TEMPLATES[software].defaultMapping };
  if (!userOverride) return base;
  return { ...base, ...userOverride };
}

export type MappedExportRow = Record<string, string>;

/** One flat row per finance line using resolved column titles. */
export function mapRowsForExport(rows: FinanceDocRow[], mapping: FieldMapping, order: BsdFieldKey[]): MappedExportRow[] {
  const keys = order.filter((k) => mapping[k]?.trim());
  return rows.map((row) => {
    const out: MappedExportRow = {};
    for (const k of keys) {
      const title = mapping[k]?.trim();
      if (!title) continue;
      out[title] = extractBsdField(row, k);
    }
    return out;
  });
}

function csvEscape(cell: string): string {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function buildCsvFromMappedRows(mapped: MappedExportRow[], headers: string[]): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of mapped) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? '')).join(','));
  }
  return `\uFEFF${lines.join('\n')}`;
}

export function buildJsonFromMappedRows(mapped: MappedExportRow[]): string {
  return JSON.stringify(mapped, null, 2);
}

export type ExportArtifact = {
  blob: Blob;
  filename: string;
  mime: string;
};

/**
 * Produce downloadable artifact. XLSX uses dynamic import('xlsx') — call only from client after user gesture.
 */
export async function exportFinanceDataset(
  rows: FinanceDocRow[],
  software: FinanceSoftware,
  format: ExportFormat,
  mappingOverride?: FieldMapping | null
): Promise<ExportArtifact> {
  const template = EXPORT_TEMPLATES[software];
  const mapping = mergeFieldMapping(software, mappingOverride);
  const keys = template.columnOrder.filter((k) => mapping[k]?.trim());
  const headers = keys.map((k) => mapping[k]!.trim());
  const mapped = mapRowsForExport(rows, mapping, template.columnOrder);

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `bsd-ybm-${software}-${stamp}`;

  if (format === 'json') {
    const body = buildJsonFromMappedRows(mapped);
    return {
      blob: new Blob([body], { type: 'application/json;charset=utf-8' }),
      filename: `${base}.json`,
      mime: 'application/json',
    };
  }

  if (format === 'csv') {
    const csv = buildCsvFromMappedRows(mapped, headers);
    return {
      blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      filename: `${base}.csv`,
      mime: 'text/csv',
    };
  }

  if (format === 'xlsx') {
    const XLSX = await import('xlsx');
    const sheetData = [headers, ...mapped.map((r) => headers.map((h) => r[h] ?? ''))];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Finances');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return {
      blob: new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      filename: `${base}.xlsx`,
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  throw new Error(`Unsupported format: ${format}`);
}

export function triggerBrowserDownload(artifact: ExportArtifact): void {
  const url = URL.createObjectURL(artifact.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = artifact.filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
