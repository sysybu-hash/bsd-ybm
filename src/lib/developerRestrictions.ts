/**
 * Phase 33 — developers see architecture / debug tools but not live ERP surfaces.
 * `isMasterAdmin` includes owner email + explicit master_admin role.
 */
export function isDeveloperErpExcluded(isDeveloper: boolean, isMasterAdmin: boolean): boolean {
  return Boolean(isDeveloper && !isMasterAdmin);
}
