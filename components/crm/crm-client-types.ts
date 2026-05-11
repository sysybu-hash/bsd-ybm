import type { CompanyType } from "@prisma/client";

export type InvoiceRow = {
  id: string;
  type: string;
  number: number;
  clientName: string;
  amount: number;
  vat: number;
  total: number;
  status: string;
  date: string;
  dueDate: string | null;
  items: { desc: string; qty: number; price: number }[];
  createdAt: string;
};

export type ErpSummary = {
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  invoiceCount: number;
};

export type OrgBillingInfo = {
  name: string;
  address: string | null;
  taxId: string | null;
  companyType: CompanyType;
  isReportable: boolean;
};

export type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  value: number | null;
  status: string;
  project: { id: string; name: string } | null;
  createdAt: string;
  issuedDocuments?: InvoiceRow[];
  erp?: ErpSummary;
};

export type ProjectRow = {
  id: string;
  name: string;
  isActive: boolean;
  activeFrom: string | null;
  activeTo: string | null;
};

export type CrmView = "pipeline" | "list" | "projects" | "automations";

export type StatusKey = "LEAD" | "ACTIVE" | "PROPOSAL" | "CLOSED_WON" | "CLOSED_LOST";

export type ModalMode = "add" | "edit";
export type ModalState = { mode: ModalMode; contact?: ContactRow; defaultStatus?: StatusKey };
