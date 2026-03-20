import { NextResponse } from 'next/server';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

/**
 * Public read of non-secret tenant chrome (custom-domain login / client portal).
 * Does not expose API keys or member lists.
 */
export async function GET(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const companyId = new URL(req.url).searchParams.get('companyId')?.trim();
  if (!companyId) {
    return NextResponse.json({ error: 'missing_company' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const cref = db.collection('companies').doc(companyId);
  const [snap, themeSnap] = await Promise.all([cref.get(), cref.collection('branding').doc('theme').get()]);

  if (!snap.exists) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const d = snap.data() as Record<string, unknown>;
  const t = themeSnap.exists ? (themeSnap.data() as Record<string, unknown>) : {};

  const logoFromTheme = typeof t.companyLogoUrl === 'string' && t.companyLogoUrl.trim() ? t.companyLogoUrl.trim() : '';
  const logoFromRoot =
    (typeof d.companyLogoUrl === 'string' && d.companyLogoUrl.trim() ? d.companyLogoUrl.trim() : '') ||
    (typeof d.logoUrl === 'string' && d.logoUrl.trim() ? d.logoUrl.trim() : '');

  const primary =
    (typeof t.primaryColor === 'string' && t.primaryColor.trim() ? t.primaryColor.trim() : null) ||
    (typeof d.primaryColor === 'string' && d.primaryColor.trim() ? d.primaryColor.trim() : null) ||
    '#004694';
  const secondary =
    (typeof t.secondaryColor === 'string' && t.secondaryColor.trim() ? t.secondaryColor.trim() : null) ||
    (typeof d.secondaryColor === 'string' && d.secondaryColor.trim() ? d.secondaryColor.trim() : null) ||
    '#C9A227';

  return NextResponse.json({
    ok: true,
    displayName: String(d.displayName ?? d.name ?? ''),
    companyLogoUrl: logoFromTheme || logoFromRoot || null,
    primaryColor: primary,
    secondaryColor: secondary,
  });
}
