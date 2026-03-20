import { randomUUID } from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCompanyStaffNotClient } from '@/lib/server/registrationAuthz';

export const runtime = 'nodejs';

type Row = {
  amount?: number;
  transactionDateIso?: string | null;
  vendor?: string | null;
  description?: string | null;
  sourceFileName?: string | null;
};

type Body = {
  companyId?: string;
  projectId?: string;
  rows?: Row[];
};

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
  const rows = Array.isArray(body.rows) ? body.rows : [];

  if (!companyId || !projectId || rows.length === 0) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (rows.length > 200) {
    return NextResponse.json({ error: 'too_many_rows' }, { status: 400 });
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

  const batch = db.batch();
  const base = db.collection('companies').doc(companyId).collection('finances');
  let n = 0;

  for (const r of rows) {
    const amount = Number(r.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const id = randomUUID();
    let at = Timestamp.now();
    if (r.transactionDateIso && typeof r.transactionDateIso === 'string') {
      const ms = Date.parse(r.transactionDateIso);
      if (Number.isFinite(ms)) at = Timestamp.fromMillis(ms);
    }
    batch.set(base.doc(id), {
      type: 'expense',
      amount,
      projectId,
      vendor: r.vendor ?? null,
      category: r.description ?? 'ייבוא היסטורי',
      source: 'legacy_import_wizard',
      sourceFileName: r.sourceFileName ?? null,
      datedAt: at,
      /** Back-dated so project timeline reflects invoice date */
      createdAt: at,
      importedAt: FieldValue.serverTimestamp(),
      createdByUid: uid,
      companyId,
    });
    n++;
  }

  if (n === 0) {
    return NextResponse.json({ error: 'no_valid_rows' }, { status: 400 });
  }

  await batch.commit();
  return NextResponse.json({ ok: true, written: n });
}
