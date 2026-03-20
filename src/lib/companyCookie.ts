/** Syncs tenant id for optional Edge/proxy reads (client-only write). */
const COOKIE = 'bsd_ybm_company';
export const COOKIE_HOST_LOCK = 'bsd_host_lock';
export const COOKIE_HOST_TENANT = 'bsd_host_tenant';
const MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

/** Set by `proxy.ts` when request host matches `TENANT_HOST_MAP`. */
export function readHostTenantLock(): { locked: boolean; companyId: string | null } {
  const locked = readCookie(COOKIE_HOST_LOCK) === '1';
  const companyId = readCookie(COOKIE_HOST_TENANT);
  return { locked, companyId: companyId?.trim() || null };
}

export function syncCompanyCookie(companyId: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE}=${encodeURIComponent(companyId)}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}

export function clearCompanyCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE}=; Path=/; Max-Age=0`;
}
