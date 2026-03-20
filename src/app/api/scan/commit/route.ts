import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCanApproveRegistrations } from '@/lib/server/registrationAuthz';
import { commitScanInvoiceToPl, type ScanInvoiceCommitPayload } from '@/services/events/EventPipeline';

type Body = {
  companyId?: string;
  batchId?: string;
  projectId?: string;
  fields?: {
    supplierName?: string;
    invoiceDate?: string;
    totalAmount?: string;
    vatAmount?: string;
    projectName?: string;
    category?: string;
  };
};

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'Firebase Admin לא מוגדר' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'נדרש אימות' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'גוף לא תקין' }, { status: 400 });
  }

  const companyId = (body.companyId ?? '').trim();
  const batchId = (body.batchId ?? '').trim();
  const projectId = (body.projectId ?? '').trim();
  const f = body.fields ?? {};

  if (!companyId || !batchId || !projectId) {
    return NextResponse.json({ error: 'חסר companyId, batchId או projectId' }, { status: 400 });
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
    return NextResponse.json({ error: 'טוקן לא תקף' }, { status: 401 });
  }

  try {
    await assertCanApproveRegistrations(db, uid, companyId, requestEmail);
  } catch {
    return NextResponse.json({ error: 'אין הרשאה לשמירה ל־P&L' }, { status: 403 });
  }

  const payload: ScanInvoiceCommitPayload = {
    companyId,
    batchId,
    projectId,
    supplierName: String(f.supplierName ?? ''),
    invoiceDate: String(f.invoiceDate ?? ''),
    totalAmount: String(f.totalAmount ?? ''),
    vatAmount: String(f.vatAmount ?? ''),
    projectLabel: String(f.projectName ?? ''),
    category: String(f.category ?? ''),
  };

  const res = await commitScanInvoiceToPl(payload);
  if (!res.ok) {
    return NextResponse.json({ error: res.error ?? 'שמירה נכשלה' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, financeId: res.financeId });
}
