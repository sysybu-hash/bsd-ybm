import { NextResponse } from 'next/server';
import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { IS_OWNER } from '@/lib/ownerVault';

export type OwnerAuthOk = { uid: string; email: string };

/**
 * Hard gate: only `sysybu@gmail.com` (normalized) may call owner orchestration APIs.
 */
export async function requireOwnerBearer(req: Request): Promise<
  { ok: true; auth: OwnerAuthOk } | { ok: false; response: NextResponse }
> {
  if (!isFirebaseAdminConfigured()) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'server_not_configured' }, { status: 503 }),
    };
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = (decoded.email ?? '').trim().toLowerCase();
    if (!IS_OWNER(email)) {
      return { ok: false, response: NextResponse.json({ error: 'forbidden_owner_only' }, { status: 403 }) };
    }
    return { ok: true, auth: { uid: decoded.uid, email } };
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'invalid_token' }, { status: 401 }) };
  }
}
