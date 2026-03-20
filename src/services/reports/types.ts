/**
 * Payloads for BSD-YBM management reports (PDF / print).
 */

export type ProjectFinancialSnapshot = {
  budget: number;
  actual: number;
  variance: number;
  laborCosts: number;
  materialCosts: number;
};

export type CompletedMilestoneLine = {
  title: string;
  targetDate: string;
};

export type ClientTimelineLine = {
  title: string;
  subtitle: string;
  when: string;
};

/** Single-project status report (client-safe timeline slice). */
export type ProjectStatusReportPayload = {
  generatedAtIso: string;
  projectId: string;
  projectName: string;
  financial: ProjectFinancialSnapshot;
  completedMilestones: CompletedMilestoneLine[];
  clientTimeline: ClientTimelineLine[];
  /** Tenant `company.logoUrl` / `companyLogoUrl` for PDF header; else Golden Helix. */
  headerLogoUrl?: string | null;
};

/** Company-wide executive snapshot for finance dashboard. */
export type ExecutiveFinanceReportPayload = {
  generatedAtIso: string;
  companyId: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  projects: Array<{
    id: string;
    name: string;
    budgeted: number;
    actual: number;
  }>;
  headerLogoUrl?: string | null;
};

export type FinanceDocRow = {
  id: string;
  type: string;
  amount: number;
  projectId: string;
  category: string;
  vendor: string;
  teamMemberName: string;
  hours: string;
  createdAtLabel: string;
  raw: Record<string, unknown>;
};
