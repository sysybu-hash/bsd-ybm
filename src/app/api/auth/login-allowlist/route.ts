import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { isEmailAllowedForLogin } from '@/lib/loginAllowlist';

async function extraWhitelistFromFirestore(): Promise<string[]> {
  if (!isFirebaseAdminConfigured()) return [];
  try {
    const snap = await getAdminFirestore().doc('bsdErpBrain/config').get();
    const raw = snap.data()?.whitelistEmails;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((e: unknown) => String(e).trim().toLowerCase())
      .filter((e: string) => e.length > 0 && e.includes('@'));
  } catch {
    return [];
  }
}

/**
 * Verifies Firebase ID token and checks email against ALLOWED_LOGIN_EMAILS.
 * GET with `Authorization: Bearer <idToken>`.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ allowed: false, reason: 'missing_token' }, { status: 401 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({
      allowed: null as boolean | null,
      reason: 'admin_not_configured',
    });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = decoded.email ?? null;
    const normalized = email?.trim().toLowerCase() ?? '';
    const extra = await extraWhitelistFromFirestore();
    const allowed =
      isEmailAllowedForLogin(email) || (normalized.length > 0 && extra.includes(normalized));
    return NextResponse.json({ allowed, email: email ?? undefined });
  } catch {
    return NextResponse.json({ allowed: false, reason: 'invalid_token' }, { status: 401 });
  }
}
