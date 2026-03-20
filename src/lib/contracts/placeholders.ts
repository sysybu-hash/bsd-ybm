/**
 * Replace {{key}} placeholders in contract HTML (server + client safe).
 */
export type ContractPlaceholderValues = {
  projectName: string;
  projectBudget: string;
  projectStartDate: string;
  projectEndDate: string;
  companyName: string;
  clientName?: string;
};

const DEFAULTS: ContractPlaceholderValues = {
  projectName: '—',
  projectBudget: '—',
  projectStartDate: '—',
  projectEndDate: '—',
  companyName: '—',
  clientName: '—',
};

export function fillContractTemplate(html: string, values: Partial<ContractPlaceholderValues>): string {
  const v = { ...DEFAULTS, ...values };
  let out = html;
  const map: Record<string, string> = {
    projectName: v.projectName,
    project_name: v.projectName,
    projectBudget: v.projectBudget,
    budget: v.projectBudget,
    projectStartDate: v.projectStartDate,
    projectEndDate: v.projectEndDate,
    companyName: v.companyName,
    clientName: v.clientName ?? '—',
    client_name: v.clientName ?? '—',
  };
  for (const [key, val] of Object.entries(map)) {
    out = out.split(`{{${key}}}`).join(val);
  }
  return out;
}

export const CONTRACT_PLACEHOLDER_HELP = [
  '{{projectName}}',
  '{{project_name}}',
  '{{budget}}',
  '{{projectBudget}}',
  '{{projectStartDate}}',
  '{{projectEndDate}}',
  '{{companyName}}',
  '{{clientName}}',
  '{{client_name}}',
].join(' · ');
