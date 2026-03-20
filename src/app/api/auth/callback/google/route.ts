import { NextRequest, NextResponse } from 'next/server';
import { PUBLIC_SITE_URL } from '@/lib/site';

/**
 * Registered redirect URI for Google Cloud OAuth clients (bsd-ybm.co.il).
 * Firebase Auth typically uses the hosted handler; this route satisfies
 * “Authorized redirect URIs” entries and forwards users to the app.
 */
export async function GET(request: NextRequest) {
  const base = PUBLIC_SITE_URL || 'https://www.bsd-ybm.co.il';
  const url = new URL('/login', base);
  const code = request.nextUrl.searchParams.get('code');
  const err = request.nextUrl.searchParams.get('error');
  if (err) url.searchParams.set('oauth_error', err);
  if (code) url.searchParams.set('oauth_code', '1');
  return NextResponse.redirect(url);
}
