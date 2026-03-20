import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { FinanceDocRow } from '@/services/reports/types';

function tsLabel(v: unknown): string {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    try {
      return (v as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return '';
    }
  }
  return '';
}

function csvEscape(cell: string): string {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

function snapshotToRows(snap: { forEach: (cb: (d: { id: string; data: () => Record<string, unknown> }) => void) => void }): FinanceDocRow[] {
  const out: FinanceDocRow[] = [];
  snap.forEach((d) => {
    const x = d.data();
    out.push({
      id: d.id,
      type: String(x.type ?? ''),
      amount: Number(x.amount) || 0,
      projectId: String(x.projectId ?? ''),
      category: String(x.category ?? ''),
      vendor: String(x.vendor ?? ''),
      teamMemberName: String(x.teamMemberName ?? ''),
      hours: String(x.hours ?? ''),
      createdAtLabel: tsLabel(x.createdAt),
      raw: x,
    });
  });
  return out;
}

/** UTF-8 BOM + CSV headers for Excel (Hebrew-friendly). */
export function buildFinancesPlCsv(rows: FinanceDocRow[]): string {
  const headers = [
    'id',
    'type',
    'amount',
    'projectId',
    'category',
    'vendor',
    'teamMemberName',
    'hours',
    'createdAt',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.id),
        csvEscape(r.type),
        csvEscape(String(r.amount)),
        csvEscape(r.projectId),
        csvEscape(r.category),
        csvEscape(r.vendor),
        csvEscape(r.teamMemberName),
        csvEscape(r.hours),
        csvEscape(r.createdAtLabel),
      ].join(',')
    );
  }
  return `\uFEFF${lines.join('\n')}`;
}

export async function fetchCompanyFinanceRows(companyId: string): Promise<FinanceDocRow[]> {
  if (!isFirebaseConfigured()) throw new Error('Firebase is not configured');
  const snap = await getDocs(collection(getDb(), 'companies', companyId, 'finances'));
  return snapshotToRows(snap);
}

/** Triggers browser download of P&L / finances CSV for the company. */
export async function downloadFinancesPlCsv(companyId: string, filename?: string): Promise<void> {
  const rows = await fetchCompanyFinanceRows(companyId);
  const csv = buildFinancesPlCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `pl-finances-${companyId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
