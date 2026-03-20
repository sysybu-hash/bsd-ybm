/** Global platform role (stored on users/{uid}.systemRole) */
export type SystemRole = 'developer' | 'global_manager' | 'master_admin';

export type CompanyRole = 'admin' | 'manager' | 'member' | 'client';

export type CompanyMembership = {
  companyId: string;
  role: CompanyRole;
  displayName: string;
  active: boolean;
  /** For clients: projects they may access (from companies/{cid}/members/{uid}) */
  allowedProjectIds?: string[];
};

export type TenantScopedEntity = {
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectCommunication = {
  kind: 'message' | 'task';
  body: string;
  createdByUid: string;
  createdAt?: unknown;
  displayName?: string | null;
  /** Denormalized for collection-group queries (LEDs, reporting) */
  companyId?: string;
  projectId?: string;
  /** Optional future upload */
  attachmentName?: string | null;
  /** Staff-only notes — hidden in Client Lounge timeline */
  internal?: boolean;
  visibility?: 'client' | 'internal';
  /** Staff marked task as handled (stops stale-task LED) */
  acknowledgedAt?: unknown;
};

export function isAdminRole(role: CompanyRole): boolean {
  return role === 'admin';
}

export function isGlobalStaffSystemRole(sr: string | null | undefined): boolean {
  return sr === 'developer' || sr === 'global_manager' || sr === 'master_admin';
}
