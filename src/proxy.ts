import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { normalizeHostHeader, parseTenantHostMap } from '@/lib/tenantHostMap';
import { BSD_DISPLAY_TIMEZONE } from '@/lib/displayTimezone';

const COOKIE_HOST_LOCK = 'bsd_host_lock';
const COOKIE_HOST_TENANT = 'bsd_host_tenant';
const COOKIE_COMPANY = 'bsd_ybm_company';

const ONE_YEAR = 60 * 60 * 24 * 365;

const TIMEZONE_HEADER = 'x-bsd-timezone';

/** CORS for API when called from allowed web origins (preview / multi-domain). */
const ALLOWED_API_ORIGINS = new Set([
  'https://www.bsd-ybm.co.il',
  'https://bsd-ybm.co.il',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

/**
 * Next.js 16+ Proxy (replaces `middleware.ts`).
 * - Tenant host map → company cookies (`CompanyContext`).
 * - API CORS (preflight + simple requests).
 * - Forwards + echoes `x-bsd-timezone: Asia/Jerusalem` for clocks / SSR.
 *
 * Auth remains Firebase client-side; use `AuthContext` + route guards for login redirects.
 *
 * Phase 33 — `/dashboard/owner-zone` is gated in `owner-zone/layout.tsx` (Owner email only);
 * the proxy cannot verify Firebase JWT in the Edge runtime.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get('origin');

  if (pathname.startsWith('/api/') && request.method === 'OPTIONS' && origin && ALLOWED_API_ORIGINS.has(origin)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-drive-sync-secret',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
        [TIMEZONE_HEADER]: BSD_DISPLAY_TIMEZONE,
      },
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TIMEZONE_HEADER, BSD_DISPLAY_TIMEZONE);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  res.headers.set(TIMEZONE_HEADER, BSD_DISPLAY_TIMEZONE);

  if (pathname.startsWith('/api/') && origin && ALLOWED_API_ORIGINS.has(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
  }

  const host = normalizeHostHeader(request.headers.get('host'));
  const map = parseTenantHostMap(process.env.TENANT_HOST_MAP);
  const companyId = host ? map[host] : undefined;

  if (companyId) {
    res.cookies.set(COOKIE_HOST_LOCK, '1', { path: '/', sameSite: 'lax', maxAge: ONE_YEAR });
    res.cookies.set(COOKIE_HOST_TENANT, companyId, { path: '/', sameSite: 'lax', maxAge: ONE_YEAR });
    res.cookies.set(COOKIE_COMPANY, companyId, { path: '/', sameSite: 'lax', maxAge: ONE_YEAR });
  } else {
    res.cookies.set(COOKIE_HOST_LOCK, '', { path: '/', maxAge: 0 });
    res.cookies.set(COOKIE_HOST_TENANT, '', { path: '/', maxAge: 0 });
  }

  return res;
}

/** Default export for tooling / hosts that expect `export default` (named `proxy` is the canonical Next 16 API). */
export default proxy;

/**
 * מקביל ל־`middleware.ts` בדוגמה שלך — אבל ב־Next 16 זה חי ב־`proxy.ts`.
 * - לא מריצים proxy על `/en/legal`, `/en/terms`, `/en/denied` (דפים סטטיים).
 * - לא משללים `api` כאן — ה־proxy מטפל ב־CORS ל־`/api/*`.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|en/legal|en/terms|en/denied|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
