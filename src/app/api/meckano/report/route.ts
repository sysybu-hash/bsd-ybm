import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCompanyStaffNotClient } from '@/lib/server/registrationAuthz';
import { getCompanyMeckanoApiKey } from '@/lib/server/meckanoCompanySettings';
import { assertMeckanoModuleEnabled } from '@/lib/server/meckanoModuleServer';
import { MeckanoClient } from '@/services/meckano/MeckanoClient';
import { isoDateRangeToUnixSeconds } from '@/services/meckano/meckanoDateRange';
import { buildMeckanoReportPayload } from '@/services/meckano/buildMeckanoReportRows';

export async function GET(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const url = new URL(req.url);
  const companyId = (url.searchParams.get('companyId') ?? '').trim();
  const projectId = (url.searchParams.get('projectId') ?? '').trim() || undefined;
  const from = (url.searchParams.get('from') ?? '').trim();
  const to = (url.searchParams.get('to') ?? '').trim();

  if (!companyId || !from || !to) {
    return NextResponse.json({ error: 'Missing companyId, from, or to' }, { status: 400 });
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
    await assertCompanyStaffNotClient(db, uid, companyId, requestEmail);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const mod = await assertMeckanoModuleEnabled(db, companyId);
  if (!mod.ok) {
    return NextResponse.json({ error: 'Meckano integration is disabled for this company' }, { status: 403 });
  }

  const apiKey = await getCompanyMeckanoApiKey(db, companyId);
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Meckano API key not configured for this company (settings/integrations)' },
      { status: 400 }
    );
  }

  try {
    const client = new MeckanoClient({ apiKey });
    const [rawUsers, rawAttendance] = await Promise.all([
      client.getUsers(),
      client.getAttendanceReport(fromTs, toTs),
    ]);

    const payload = await buildMeckanoReportPayload(companyId, rawAttendance, rawUsers, {
      filterProjectId: projectId,
    });

    return NextResponse.json({
      ok: true,
      from_ts: fromTs,
      to_ts: toTs,
      ...payload,
    });
  } catch (e) {
    console.error('Meckano report error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Meckano request failed' },
      { status: 502 }
    );
  }
}
