import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCanApproveRegistrations } from '@/lib/server/registrationAuthz';
import { getCompanyMeckanoApiKey } from '@/lib/server/meckanoCompanySettings';
import { assertMeckanoModuleEnabled } from '@/lib/server/meckanoModuleServer';
import { MeckanoClient } from '@/services/meckano/MeckanoClient';
import { isoDateRangeToUnixSeconds } from '@/services/meckano/meckanoDateRange';
import { processMeckanoAttendanceForCompany } from '@/services/events/EventPipeline';

type Body = {
  companyId?: string;
  projectId?: string;
  from?: string;
  to?: string;
};

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const companyId = (body.companyId ?? '').trim();
  const projectId = (body.projectId ?? '').trim();
  const from = (body.from ?? '').trim();
  const to = (body.to ?? '').trim();

  if (!companyId || !projectId || !from || !to) {
    return NextResponse.json({ error: 'Missing companyId, projectId, from, or to' }, { status: 400 });
  }

  let fromTs: number;
  let toTs: number;
  try {
    const r = isoDateRangeToUnixSeconds(from, to);
    fromTs = r.from_ts;
    toTs = r.to_ts;
  } catch {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
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
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    await assertCanApproveRegistrations(db, uid, companyId, requestEmail);
  } catch {
    return NextResponse.json({ error: 'Forbidden — admin required to sync P&L' }, { status: 403 });
  }

  const mod = await assertMeckanoModuleEnabled(db, companyId);
  if (!mod.ok) {
    return NextResponse.json({ error: 'Meckano integration is disabled for this company' }, { status: 403 });
  }

  const apiKey = await getCompanyMeckanoApiKey(db, companyId);
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Meckano API key not configured for this company' },
      { status: 400 }
    );
  }

  try {
    const client = new MeckanoClient({ apiKey });
    const rawAttendance = await client.getAttendanceReport(fromTs, toTs);
    const result = await processMeckanoAttendanceForCompany(companyId, rawAttendance, {
      filterProjectId: projectId,
    });

    if (result.ok && !result.skipped) {
      await db.collection('companies').doc(companyId).set(
        {
          meckanoLastSyncedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      ok: result.ok && !result.skipped,
      skipped: result.skipped,
      reason: result.reason,
      rowsProcessed: result.rowsProcessed,
      financeLinesWritten: result.financeLinesWritten,
      projectUpdates: result.projectUpdates,
      errors: result.errors,
    });
  } catch (e) {
    console.error('Meckano sync-pl error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sync failed' },
      { status: 502 }
    );
  }
}
