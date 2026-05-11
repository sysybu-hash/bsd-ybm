import type { IndustryProfile } from "@/lib/professions/runtime";

export type ClientRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  value: number | null;
  createdAt: string;
  project: { id: string; name: string } | null;
  invoiceCount: number;
  totalBilled: number;
  totalPending: number;
};

export type ProjectRecord = {
  id: string;
  name: string;
  isActive: boolean;
  activeFrom: string | null;
  activeTo: string | null;
  contactCount: number;
  totalValue: number;
  activeDeals: number;
};

export type ClientsWorkspaceV2Props = Readonly<{
  contacts: ClientRecord[];
  projects: ProjectRecord[];
  industryProfile: IndustryProfile;
  organizationId: string;
  userFirstName: string;
  initialHub?: "projects" | "clients";
  initialProjectFilter?: string;
  initialClientId?: string;
  embedBelowSummary?: boolean;
  hideWorkspaceHero?: boolean;
}>;
