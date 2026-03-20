import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCanApproveRegistrations } from '@/lib/server/registrationAuthz';
import { getCompanyMeckanoApiKey } from '@/lib/server/meckanoCompanySettings';
import { MeckanoClient } from '@/services/meckano/MeckanoClient';
import { extractMeckanoUserList } from '@/services/meckano/extractMeckanoUsers';

type Body = {
  companyId?: string;
  /** When omitted or empty, uses key from `settings/integrations` (or env fallback). */
  apiKey?: string;
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
  if (!companyId) {
    return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
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
    return NextResponse.json({ error: 'Forbidden — company admin required' }, { status: 403 });
  }

  const fromBody = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  const stored = await getCompanyMeckanoApiKey(db, companyId);
  const keyToTest = fromBody || stored || '';

  if (!keyToTest) {
    return NextResponse.json(
      { error: 'No API key — paste a key or save one in integrations first' },
      { status: 400 }
    );
  }

  try {
    const client = new MeckanoClient({ apiKey: keyToTest });
    const raw = await client.getUsers();
    const employees = extractMeckanoUserList(raw);
    return NextResponse.json({
      ok: true,
      employeeCount: employees.length,
      usedStoredKey: !fromBody && !!stored,
    });
  } catch (e) {
    console.error('Meckano test error:', e);
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : 'Meckano connection failed',
    });
  }
}
