/**
 * BSD-YBM platform ownership — master admin bootstrap (email allow-list).
 * Firestore `systemRole: master_admin` is optional; this email always receives master privileges when signed in.
 */

export const MASTER_ADMIN_EMAIL_NORMALIZED = 'sysybu@gmail.com';

/** Display / PDF branding (Phase 13 branding enforcer uses these). */
export const PLATFORM_BRANDING = {
  legalName: 'BSD-YBM AI Solutions',
  chairman: 'Yohanan Bukshpan',
  chairmanPhone: '+972525640021',
  website: 'https://www.bsd-ybm.co.il',
  websiteDisplay: 'www.bsd-ybm.co.il',
} as const;

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === MASTER_ADMIN_EMAIL_NORMALIZED;
}

export function isMasterAdminUser(opts: {
  email: string | null | undefined;
  systemRole: string | null | undefined;
}): boolean {
  if (isMasterAdminEmail(opts.email)) return true;
  return opts.systemRole === 'master_admin';
}
