import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertMasterAdmin } from '@/lib/server/registrationAuthz';

export const runtime = 'nodejs';

type Body = {
  companyId?: string;
  meckanoActive?: boolean;
  whatsappIngestActive?: boolean;
};

export async function PATCH(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const companyId = (body.companyId ?? '').trim();
  if (!companyId) {
    return NextResponse.json({ error: 'missing_company_id' }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  let uid: string;
  let requestEmail: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    requestEmail = decoded.email;
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  try {
    await assertMasterAdmin(db, uid, requestEmail);
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const ref = db.collection('companies').doc(companyId).collection('settings').doc('integrations');
  const snap = await ref.get();
  const cur = (snap.exists ? snap.data() : {}) as Record<string, unknown>;

  if (
    typeof body.meckanoActive !== 'boolean' &&
    typeof body.whatsappIngestActive !== 'boolean'
  ) {
    return NextResponse.json({ error: 'no_updates' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.meckanoActive === 'boolean') {
    const prev =
      cur.meckano && typeof cur.meckano === 'object' && cur.meckano !== null && !Array.isArray(cur.meckano)
        ? { ...(cur.meckano as Record<string, unknown>) }
        : {};
    patch.meckano = { ...prev, active: body.meckanoActive };
  }
  if (typeof body.whatsappIngestActive === 'boolean') {
    const prev =
      cur.whatsappIngest &&
      typeof cur.whatsappIngest === 'object' &&
      cur.whatsappIngest !== null &&
      !Array.isArray(cur.whatsappIngest)
        ? { ...(cur.whatsappIngest as Record<string, unknown>) }
        : {};
    patch.whatsappIngest = { ...prev, active: body.whatsappIngestActive };
  }

  await ref.set(patch, { merge: true });

  return NextResponse.json({
    ok: true,
    companyId,
    meckano: patch.meckano,
    whatsappIngest: patch.whatsappIngest,
  });
}
