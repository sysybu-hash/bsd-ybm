import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminBucket, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertClientMayAccessProject } from '@/lib/server/registrationAuthz';
import { WhatsAppService } from '@/services/notifications/WhatsAppService';

export const runtime = 'nodejs';

type Body = {
  companyId?: string;
  projectId?: string;
  pdfBase64?: string;
};

function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || '—';
  return req.headers.get('x-real-ip')?.trim() || '—';
}

export async function POST(req: Request) {
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
  const projectId = (body.projectId ?? '').trim();
  const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64.trim() : '';

  if (!companyId || !projectId || !pdfBase64) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  try {
    await assertClientMayAccessProject(db, uid, companyId, projectId, email);
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const projRef = db.collection('companies').doc(companyId).collection('projects').doc(projectId);
  const projSnap = await projRef.get();
  if (!projSnap.exists) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }
  const pdata = projSnap.data() as Record<string, unknown>;
  if (pdata.contractSignedAt) {
    return NextResponse.json({ error: 'already_signed' }, { status: 409 });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
  } catch {
    return NextResponse.json({ error: 'invalid_pdf' }, { status: 400 });
  }
  if (buffer.length < 80 || buffer.length > 12_000_000) {
    return NextResponse.json({ error: 'pdf_size' }, { status: 400 });
  }

  const ip = clientIp(req);
  const ts = Date.now();
  const storagePath = `companies/${companyId}/projects/${projectId}/contracts/${ts}.pdf`;

  try {
    const bucket = getAdminBucket();
    await bucket.file(storagePath).save(buffer, {
      contentType: 'application/pdf',
      resumable: false,
      metadata: {
        metadata: {
          companyId,
          projectId,
          signerUid: uid,
          signedAt: new Date(ts).toISOString(),
        },
      },
    });
  } catch (e) {
    console.error('[complete-sign] storage', e);
    return NextResponse.json({ error: 'storage_failed' }, { status: 502 });
  }

  await projRef.set(
    {
      contractSignedAt: FieldValue.serverTimestamp(),
      contractSignerUid: uid,
      contractSignerEmail: email ?? null,
      contractSignerIp: ip,
      contractPdfStoragePath: storagePath,
      contractPlatform: 'bsd-ybm',
    },
    { merge: true }
  );

  const coSnap = await db.collection('companies').doc(companyId).get();
  const co = coSnap.data() as Record<string, unknown> | undefined;
  const displayName = String(co?.displayName ?? co?.name ?? 'BSD-YBM');
  const projectName = String(pdata.name ?? projectId);
  const notifyPhone = String(co?.contractNotifyPhoneE164 ?? '').trim();

  const signedAtJerusalem = new Date(ts).toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  if (notifyPhone) {
    await WhatsAppService.sendContractSignedAlert({
      contractorPhoneE164: notifyPhone,
      projectName,
      companyDisplayName: displayName,
      signedAtIso: signedAtJerusalem,
    });
  } else {
    console.info('[complete-sign] Set companies/' + companyId + '.contractNotifyPhoneE164 for WhatsApp alerts.');
  }

  return NextResponse.json({
    ok: true,
    storagePath,
  });
}
