import { NextResponse } from 'next/server';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const DOC_PATH = 'globalLandingBranding/default';

/**
 * Public read — global landing chrome (Owner Vault). Safe: logo URL + colors only.
 */
export async function GET() {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }

  try {
    const db = getAdminFirestore();
    const snap = await db.doc(DOC_PATH).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: true, configured: false });
    }
    const d = snap.data() as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      configured: true,
      logoUrl: typeof d.logoUrl === 'string' && d.logoUrl.trim() ? d.logoUrl.trim() : null,
      primaryColor: typeof d.primaryColor === 'string' && d.primaryColor.trim() ? d.primaryColor.trim() : null,
      secondaryColor: typeof d.secondaryColor === 'string' && d.secondaryColor.trim() ? d.secondaryColor.trim() : null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 });
  }
}
