import { NextResponse } from 'next/server';
import type { Timestamp } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertMasterAdmin } from '@/lib/server/registrationAuthz';
import { isMeckanoModuleEnabled } from '@/lib/integrations/meckanoModule';

export const runtime = 'nodejs';

function whatsappIngestActive(data: Record<string, unknown> | undefined): boolean {
  if (!data) return false;
  const w = data.whatsappIngest;
  if (w && typeof w === 'object' && w !== null && 'active' in w) {
    return (w as { active?: boolean }).active === true;
  }
  const w2 = data.whatsapp;
  if (w2 && typeof w2 === 'object' && w2 !== null && 'ingestActive' in w2) {
    return (w2 as { ingestActive?: boolean }).ingestActive === true;
  }
  return false;
}

export async function GET(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 });
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

  const companiesSnap = await db.collection('companies').limit(48).get();

  const tenants: {
    companyId: string;
    displayName: string;
    netProfitAggregate: number;
    meckanoActive: boolean;
    whatsappIngestActive: boolean;
    projectRows: { id: string; name: string; budgeted: number; actual: number; netProfit: number }[];
  }[] = [];

  const anomalies: {
    id: string;
    companyId: string;
    companyLabel: string;
    message: string;
    discrepancyPct: number;
    projectId: string;
    createdAt: string | null;
  }[] = [];

  for (const c of companiesSnap.docs) {
    const companyId = c.id;
    const root = c.data() as Record<string, unknown>;
    const displayName =
      String(root.displayName ?? root.name ?? companyId).slice(0, 120) || companyId;

    const intSnap = await db.collection('companies').doc(companyId).collection('settings').doc('integrations').get();
    const intData = intSnap.exists ? (intSnap.data() as Record<string, unknown>) : undefined;
    const meckanoActive = isMeckanoModuleEnabled(intData, root);
    const wa = whatsappIngestActive(intData);

    const projSnap = await db.collection('companies').doc(companyId).collection('projects').limit(60).get();
    const projectRows: {
      id: string;
      name: string;
      budgeted: number;
      actual: number;
      netProfit: number;
    }[] = [];
    let netProfitAggregate = 0;

    projSnap.forEach((p) => {
      const data = p.data();
      const pl = (data.plSummary as Record<string, unknown> | undefined) ?? {};
      const L = typeof pl.laborCosts === 'number' ? pl.laborCosts : 0;
      const M = typeof pl.materialCosts === 'number' ? pl.materialCosts : 0;
      const actual = Math.round((L + M) * 100) / 100;
      const budgetedRaw =
        typeof pl.budgetedCost === 'number'
          ? pl.budgetedCost
          : typeof data.budgetedTotal === 'number'
            ? data.budgetedTotal
            : typeof data.budget === 'number'
              ? data.budget
              : null;
      const budgeted =
        budgetedRaw != null && budgetedRaw > 0
          ? Math.round(Number(budgetedRaw) * 100) / 100
          : actual > 0
            ? Math.round(actual * 1.18 * 100) / 100
            : 0;
      const netProfit = Math.round((budgeted - actual) * 100) / 100;
      netProfitAggregate += netProfit;
      projectRows.push({
        id: p.id,
        name: String(data.name ?? p.id),
        budgeted,
        actual,
        netProfit,
      });
    });

    tenants.push({
      companyId,
      displayName,
      netProfitAggregate: Math.round(netProfitAggregate * 100) / 100,
      meckanoActive,
      whatsappIngestActive: wa,
      projectRows,
    });

    const anSnap = await db
      .collection('companies')
      .doc(companyId)
      .collection('anomalySignals')
      .where('active', '==', true)
      .limit(4)
      .get();

    anSnap.forEach((d) => {
      const x = d.data();
      const sigs = (x.signals as { title?: string; discrepancyPct?: number }[] | undefined) ?? [];
      const top = sigs[0];
      let createdAt: string | null = null;
      const ca = x.createdAt as Timestamp | undefined;
      if (ca && typeof ca.toDate === 'function') {
        try {
          createdAt = ca.toDate().toISOString();
        } catch {
          createdAt = null;
        }
      }
      anomalies.push({
        id: d.id,
        companyId,
        companyLabel: displayName,
        message: top?.title ?? 'אנומליה',
        discrepancyPct: typeof top?.discrepancyPct === 'number' ? top.discrepancyPct : 0,
        projectId: String(x.projectId ?? ''),
        createdAt,
      });
    });
  }

  anomalies.sort((a, b) => (b.discrepancyPct || 0) - (a.discrepancyPct || 0));

  return NextResponse.json({ ok: true, tenants, anomalies });
}
