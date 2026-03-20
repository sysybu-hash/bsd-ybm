/**
 * Canonical public URLs for BSD-YBM (production + local override via env).
 */

export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bsd-ybm.co.il'
).replace(/\/$/, '');

/** Browser-reachable API base (same origin on Vercel, or explicit in env). */
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL || `${PUBLIC_SITE_URL}/api`).replace(
  /\/$/,
  ''
);

export const LEGAL_BRAND_NAME = 'BSD-YBM AI Solutions';
