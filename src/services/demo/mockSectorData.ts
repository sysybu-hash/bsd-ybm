/**
 * High-fidelity demo datasets per sector (projects / P&L style metrics, Meckano-style worker counts).
 * Used when dashboard runs in DEMO data mode — no Firestore reads for financial aggregates.
 */

import type { SectorId } from '@/config/sectorConfigs';
import type { ProjectHealthRow } from '@/hooks/useCompanyFinancials';
import type { FinanceDocRow } from '@/services/reports/types';

export type DemoHeatmapExtras = {
  workersOnSite: number;
  /** Derived schedule LED hint */
  scheduleRatio: number;
};

export type DemoProjectRow = ProjectHealthRow & DemoHeatmapExtras;

export type DemoFinancialBundle = {
  revenue: number;
  expenses: number;
  projects: DemoProjectRow[];
  /** Synthetic finance lines for export demos */
  financeRows: FinanceDocRow[];
};

function demoFinanceRow(partial: Partial<FinanceDocRow> & Pick<FinanceDocRow, 'id' | 'amount' | 'projectId'>): FinanceDocRow {
  return {
    id: partial.id,
    type: partial.type ?? 'expense',
    amount: partial.amount,
    projectId: partial.projectId,
    category: partial.category ?? 'Labor',
    vendor: partial.vendor ?? 'Demo Vendor',
    teamMemberName: partial.teamMemberName ?? '',
    hours: partial.hours ?? '',
    createdAtLabel: partial.createdAtLabel ?? new Date().toISOString().slice(0, 10),
    raw: partial.raw ?? {},
  };
}

const CONSTRUCTION_DEMO: DemoFinancialBundle = {
  revenue: 4280000,
  expenses: 3612000,
  projects: [
    { id: 'demo-c1', name: 'מגדל רוממה — שלד', budgeted: 1200000, actual: 1080000, workersOnSite: 14, scheduleRatio: 0.72 },
    { id: 'demo-c2', name: 'מחסן לוגיסטיקה נגב', budgeted: 890000, actual: 910000, workersOnSite: 9, scheduleRatio: 0.45 },
    { id: 'demo-c3', name: 'בית ספר ממ״ד', budgeted: 2100000, actual: 1950000, workersOnSite: 22, scheduleRatio: 0.88 },
    { id: 'demo-c4', name: 'חניון תת-קרקעי', budgeted: 450000, actual: 420000, workersOnSite: 6, scheduleRatio: 0.6 },
  ],
  financeRows: [
    demoFinanceRow({ id: 'f1', amount: 42000, projectId: 'demo-c1', category: 'Labor', vendor: 'Meckano Rollup', type: 'labor' }),
    demoFinanceRow({ id: 'f2', amount: 12800, projectId: 'demo-c2', category: 'Materials', vendor: 'אגרגטים דרום', type: 'material' }),
    demoFinanceRow({ id: 'f3', amount: 210000, projectId: 'demo-c3', category: 'Labor', vendor: 'צוות שלד', type: 'labor' }),
    demoFinanceRow({ id: 'f4', amount: 95000, projectId: 'demo-c1', category: 'Subcontractor', vendor: 'רותם מעליות', type: 'expense' }),
    demoFinanceRow({ id: 'f5', amount: 180000, projectId: 'demo-c1', category: 'Revenue', vendor: 'Client milestone', type: 'revenue' }),
  ],
};

const RENOVATION_DEMO: DemoFinancialBundle = {
  revenue: 1860000,
  expenses: 1420000,
  projects: [
    { id: 'demo-r1', name: 'דופלק רמת גן — ליבינג', budgeted: 340000, actual: 310000, workersOnSite: 5, scheduleRatio: 0.9 },
    { id: 'demo-r2', name: 'בחירות לקוח — מטבח', budgeted: 120000, actual: 118000, workersOnSite: 3, scheduleRatio: 0.95 },
    { id: 'demo-r3', name: 'כמותי חשמל + צנרת', budgeted: 280000, actual: 305000, workersOnSite: 7, scheduleRatio: 0.4 },
    { id: 'demo-r4', name: 'פנטהאוז הרצליה', budgeted: 920000, actual: 780000, workersOnSite: 11, scheduleRatio: 0.55 },
  ],
  financeRows: [
    demoFinanceRow({ id: 'r1', amount: 45000, projectId: 'demo-r1', category: 'Finish materials', type: 'material' }),
    demoFinanceRow({ id: 'r2', amount: 22000, projectId: 'demo-r2', category: 'Client selections', type: 'expense' }),
    demoFinanceRow({ id: 'r3', amount: 88000, projectId: 'demo-r3', category: 'MEP takeoff', type: 'labor' }),
  ],
};

const PROPERTY_MGMT_DEMO: DemoFinancialBundle = {
  revenue: 960000,
  expenses: 412000,
  projects: [
    { id: 'demo-p1', name: 'מגדל WE — קומות 12–24', budgeted: 120000, actual: 118000, workersOnSite: 4, scheduleRatio: 0.85 },
    { id: 'demo-p2', name: 'חוזה שכירות — משרדים A', budgeted: 80000, actual: 80000, workersOnSite: 0, scheduleRatio: 1 },
    { id: 'demo-p3', name: 'קריאות אחזקה (חודש)', budgeted: 45000, actual: 52000, workersOnSite: 8, scheduleRatio: 0.35 },
    { id: 'demo-p4', name: 'ביטחון + ניקיון', budgeted: 60000, actual: 58000, workersOnSite: 12, scheduleRatio: 0.7 },
  ],
  financeRows: [
    demoFinanceRow({ id: 'p1', amount: 12000, projectId: 'demo-p3', category: 'Maintenance ticket', vendor: 'מעליות שירות', type: 'expense' }),
    demoFinanceRow({ id: 'p2', amount: 80000, projectId: 'demo-p2', category: 'Lease income', vendor: 'Tenant A', type: 'revenue' }),
    demoFinanceRow({ id: 'p3', amount: 24000, projectId: 'demo-p4', category: 'Security', type: 'labor' }),
  ],
};

const ELECTRICAL_DEMO: DemoFinancialBundle = {
  revenue: 1340000,
  expenses: 1010000,
  projects: [
    { id: 'demo-e1', name: 'חשמל כוח — מפעל', budgeted: 520000, actual: 498000, workersOnSite: 10, scheduleRatio: 0.78 },
    { id: 'demo-e2', name: 'לוחות ראשיים + גנרטור', budgeted: 310000, actual: 305000, workersOnSite: 6, scheduleRatio: 0.82 },
    { id: 'demo-e3', name: 'כבלי MV', budgeted: 280000, actual: 292000, workersOnSite: 5, scheduleRatio: 0.5 },
  ],
  financeRows: [
    demoFinanceRow({ id: 'e1', amount: 62000, projectId: 'demo-e1', category: 'Cable tray', type: 'material' }),
    demoFinanceRow({ id: 'e2', amount: 38000, projectId: 'demo-e2', category: 'Labor — Meckano', type: 'labor' }),
  ],
};

const BY_SECTOR: Record<SectorId, DemoFinancialBundle> = {
  CONSTRUCTION: CONSTRUCTION_DEMO,
  RENOVATION: RENOVATION_DEMO,
  PROPERTY_MGMT: PROPERTY_MGMT_DEMO,
  ELECTRICAL: ELECTRICAL_DEMO,
};

export function getDemoFinancialBundle(sector: SectorId): DemoFinancialBundle {
  return BY_SECTOR[sector] ?? CONSTRUCTION_DEMO;
}
