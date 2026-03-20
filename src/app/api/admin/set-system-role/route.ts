import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { isMasterAdminEmail } from '@/lib/platformOwners';
import type { SystemRole } from '@/types/multitenant';

type Body = {
  targetUid: string;
  /** Only developer may set; use null to clear global staff role */
  systemRole: SystemRole | null;
};

function assertValidBody(body: Body): string | null {
  const uid = (body.targetUid ?? '').trim();
  if (!uid) return 'חסר targetUid';
  if (
    body.systemRole !== null &&
    body.systemRole !== 'developer' &&
    body.systemRole !== 'global_manager' &&
    body.systemRole !== 'master_admin'
  ) {
    return 'systemRole לא חוקי';
  }
  return null;
}

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

  const err = assertValidBody(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  let callerUid: string;
  let callerEmail: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    callerUid = decoded.uid;
    callerEmail = decoded.email;
  } catch {
    return NextResponse.json({ error: 'טוקן לא תקף' }, { status: 401 });
  }

  const callerSnap = await db.collection('users').doc(callerUid).get();
  const callerSr = callerSnap.data()?.systemRole as string | undefined;
  const callerIsDeveloper = callerSr === 'developer';
  const callerIsMasterAdmin = callerSr === 'master_admin' || isMasterAdminEmail(callerEmail);

  if (!callerIsDeveloper && !callerIsMasterAdmin) {
    return NextResponse.json({ error: 'רק מפתח או מנהל ראשי רשאי לעדכן תפקיד מערכת' }, { status: 403 });
  }

  if (callerIsMasterAdmin && !callerIsDeveloper && body.systemRole === 'developer') {
    return NextResponse.json({ error: 'רק מפתח (Developer) רשאי להקצות developer' }, { status: 403 });
  }

  const targetRef = db.collection('users').doc(body.targetUid.trim());
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    return NextResponse.json({ error: 'משתמש יעד לא נמצא' }, { status: 404 });
  }

  if (body.systemRole === null) {
    await targetRef.update({
      systemRole: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await targetRef.set(
      {
        systemRole: body.systemRole,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return NextResponse.json({ ok: true });
}
