import { randomUUID } from 'crypto';
import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCompanyStaffNotClient } from '@/lib/server/registrationAuthz';
import type { DraftBoqLine } from '@/services/ai/BlueprintAnalyzer';
import {
  detectBoqVsInvoiceDiscrepancy,
  detectFieldVsSupplierMismatch,
  sumDraftBoqNis,
  type AnomalySignal,
} from '@/services/ai/AnomalyEngine';

export const runtime = 'nodejs';

type Body = {
  companyId?: string;
  projectId?: string;
  fieldConcreteM3?: number;
  supplierConcreteM3?: number;
};

function pickLatestBoqDraft(docs: QueryDocumentSnapshot[]): DraftBoqLine[] {
  let best: { t: number; lines: DraftBoqLine[] } | null = null;
  for (const d of docs) {
    const data = d.data();
    const lines = (data.draftBoq as DraftBoqLine[] | undefined) ?? [];
    const c = data.createdAt;
    let t = 0;
    if (c && typeof c === 'object' && 'toMillis' in c && typeof (c as { toMillis: () => number }).toMillis === 'function') {
      try {
        t = (c as { toMillis: () => number }).toMillis();
      } catch {
        t = 0;
      }
    }
    if (!best || t >= best.t) {
      best = { t, lines };
    }
  }
  return best?.lines ?? [];
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
  if (!companyId || !projectId) {
    return NextResponse.json({ error: 'missing_company_or_project' }, { status: 400 });
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

  const boqSnap = await db
    .collection('companies')
    .doc(companyId)
    .collection('projects')
    .doc(projectId)
    .collection('boqDrafts')
    .limit(40)
    .get();

  const lines = pickLatestBoqDraft(boqSnap.docs);
  const boqTotal = sumDraftBoqNis(lines);

  const finSnap = await db.collection('companies').doc(companyId).collection('finances').get();
  let invoiceTotal = 0;
  finSnap.forEach((doc) => {
    const x = doc.data();
    if (String(x.projectId ?? '') !== projectId) return;
    const t = String(x.type ?? '').toLowerCase();
    if (t === 'revenue' || t === 'income' || t === 'הכנסה') return;
    const a = Number(x.amount) || 0;
    if (a > 0) invoiceTotal += a;
  });
  invoiceTotal = Math.round(invoiceTotal * 100) / 100;

  const signals: AnomalySignal[] = [];
  const boqSig = detectBoqVsInvoiceDiscrepancy({
    boqTotalNis: boqTotal,
    invoiceTotalNis: invoiceTotal,
    projectId,
  });
  if (boqSig) signals.push(boqSig);

  const fc = body.fieldConcreteM3;
  const sc = body.supplierConcreteM3;
  if (typeof fc === 'number' && typeof sc === 'number') {
    const cSig = detectFieldVsSupplierMismatch({
      fieldQuantity: fc,
      supplierQuantity: sc,
      commodityLabel: 'בטון (מ״ק)',
      projectId,
    });
    if (cSig) signals.push(cSig);
  }

  const coll = db.collection('companies').doc(companyId).collection('anomalySignals');
  const existing = await coll.where('active', '==', true).get();
  const batch = db.batch();
  existing.forEach((d) => {
    batch.update(d.ref, { active: false, clearedAt: FieldValue.serverTimestamp() });
  });

  let signalDocId: string | null = null;
  if (signals.length > 0) {
    signalDocId = randomUUID();
    batch.set(coll.doc(signalDocId), {
      active: true,
      projectId,
      signals,
      boqTotalNis: boqTotal,
      invoiceTotalNis: invoiceTotal,
      createdAt: FieldValue.serverTimestamp(),
      createdByUid: uid,
    });
  }

  await batch.commit();

  return NextResponse.json({
    ok: true,
    anomaly: signals.length > 0,
    signals,
    boqTotalNis: boqTotal,
    invoiceTotalNis: invoiceTotal,
    signalDocId,
  });
}
