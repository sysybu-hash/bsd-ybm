import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

type Merged = {
  taxPercent: number;
  referenceDailyRate: number;
};

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return fallback;
}

export async function GET(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ taxPercent: 10, referenceDailyRate: 0 } satisfies Merged);
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const companyId = req.nextUrl.searchParams.get('companyId')?.trim() ?? '';
  if (!companyId) {
    return NextResponse.json({ error: 'companyId required' }, { status: 400 });
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const db = getAdminFirestore();

    const member = await db.collection('companies').doc(companyId).collection('members').doc(uid).get();
    if (!member.exists) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const role = member.data()?.role as string | undefined;
    if (role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const brainSnap = await db.doc('bsdErpBrain/config').get();
    const brain = brainSnap.data() ?? {};
    const globalTax = num(brain.defaultTaxPercent, 10);
    const globalRate = num(brain.referenceDailyRate, 0);

    const compSnap = await db.doc(`companies/${companyId}/erpSettings/brain`).get();
    const comp = compSnap.data() ?? {};

    const merged: Merged = {
      taxPercent: typeof comp.taxPercent === 'number' && Number.isFinite(comp.taxPercent) ? comp.taxPercent : globalTax,
      referenceDailyRate:
        typeof comp.referenceDailyRate === 'number' && Number.isFinite(comp.referenceDailyRate)
          ? comp.referenceDailyRate
          : globalRate,
    };

    return NextResponse.json(merged);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
