import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCompanyStaffNotClient } from '@/lib/server/registrationAuthz';

export const runtime = 'nodejs';

function haystack(doc: Record<string, unknown>): string {
  try {
    return JSON.stringify(doc).toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Lightweight OCR archive search: substring match over recent scan documents (server-side only).
 */
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
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  if (!companyId || !q || q.length < 2) {
    return NextResponse.json({ error: 'missing_company_or_query' }, { status: 400 });
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

  const [scanSnap, archiveSnap] = await Promise.all([
    db.collection('companies').doc(companyId).collection('scans').limit(80).get(),
    db.collection('companies').doc(companyId).collection('archiveIndex').limit(120).get(),
  ]);

  const hits: { id: string; preview: string; projectId?: string; source?: string }[] = [];

  scanSnap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const blob = haystack(data);
    if (!blob.includes(q)) return;
    const preview =
      String(data.aiSummary ?? data.summary ?? data.notes ?? data.status ?? d.id).slice(0, 160) ||
      d.id.slice(0, 12);
    hits.push({
      id: d.id,
      preview,
      projectId: typeof data.projectId === 'string' ? data.projectId : undefined,
      source: 'scan',
    });
  });

  archiveSnap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const blob = haystack(data);
    if (!blob.includes(q)) return;
    const preview =
      String(data.preview ?? data.fileName ?? data.ocrText ?? d.id).slice(0, 160) || d.id.slice(0, 12);
    hits.push({
      id: `archive:${d.id}`,
      preview: `[ארכיון] ${preview}`,
      projectId: typeof data.projectId === 'string' ? data.projectId : undefined,
      source: typeof data.source === 'string' ? data.source : 'archive',
    });
  });

  return NextResponse.json({ ok: true, hits: hits.slice(0, 40) });
}
