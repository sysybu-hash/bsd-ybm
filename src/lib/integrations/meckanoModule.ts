/**
 * Meckano is opt-in: `companies/{id}/settings/integrations.meckano.active === true`
 * Legacy: `companies/{id}.meckanoIntegrationActive` when `meckano.active` is unset.
 */

export type MeckanoModuleCompanyRoot = {
  meckanoIntegrationActive?: unknown;
};

export function isMeckanoModuleEnabled(
  integrationsDoc: Record<string, unknown> | undefined,
  companyRoot: MeckanoModuleCompanyRoot | undefined
): boolean {
  const nested = integrationsDoc?.meckano;
  if (
    nested &&
    typeof nested === 'object' &&
    nested !== null &&
    !Array.isArray(nested) &&
    'active' in nested
  ) {
    return (nested as { active?: boolean }).active === true;
  }
  return Boolean(companyRoot?.meckanoIntegrationActive);
}
