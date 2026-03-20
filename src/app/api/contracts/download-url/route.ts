import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminBucket, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCompanyStaffNotClient } from '@/lib/server/registrationAuthz';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 });
  }

  const url = new URL(req.url);
  const companyId = (url.searchParams.get('companyId') ?? '').trim();
  const projectId = (url.searchParams.get('projectId') ?? '').trim();
  if (!companyId || !projectId) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 });
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
    await assertCompanyStaffNotClient(db, uid, companyId, requestEmail);
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const proj = await db.collection('companies').doc(companyId).collection('projects').doc(projectId).get();
  const path = proj.data()?.contractPdfStoragePath as string | undefined;
  if (!path) {
    return NextResponse.json({ error: 'no_signed_pdf' }, { status: 404 });
  }

  try {
    const bucket = getAdminBucket();
    const [signedUrl] = await bucket.file(path).getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });
    return NextResponse.json({ ok: true, url: signedUrl });
  } catch (e) {
    console.error('[download-url]', e);
    return NextResponse.json({ error: 'sign_failed' }, { status: 502 });
  }
}
