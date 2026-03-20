import { MASTER_ADMIN_EMAIL_NORMALIZED } from '@/lib/platformOwners';

/** Canonical owner identity (יוחנן בוקשפן — platform vault). */
export const OWNER_VAULT_EMAIL = MASTER_ADMIN_EMAIL_NORMALIZED;

/**
 * Master key — Owner Vault & crown nav only for this Google account.
 * (Not the same as `systemRole: master_admin` on other emails.)
 */
export const IS_OWNER = (email: string | null | undefined): boolean =>
  (email?.trim().toLowerCase() ?? '') === OWNER_VAULT_EMAIL;
