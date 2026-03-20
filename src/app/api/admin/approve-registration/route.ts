import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { sendWelcomeEmailWithTempPassword } from '@/lib/email/sendCredentialsEmail';
import { generateTempPassword } from '@/lib/auth/tempPassword';
import { assertCanApproveRegistrations } from '@/lib/server/registrationAuthz';
import { PUBLIC_SITE_URL } from '@/lib/site';

type Body = {
  companyId: string;
  queueDocId: string;
};

function siteUrl(): string {
  return PUBLIC_SITE_URL.replace(/\/$/, '');
}

function mapQueueRoleToMemberRole(companyRole: unknown): string {
  if (companyRole === 'client') return 'client';
  return 'member';
}

async function resolveClientProjectIds(db: Firestore, companyId: string): Promise<string[]> {
  const snap = await db.collection('companies').doc(companyId).collection('projects').limit(1).get();
  if (!snap.empty) return [snap.docs[0].id];
  const fallback = (process.env.DEFAULT_CLIENT_PROJECT_ID ?? '').trim();
  return fallback ? [fallback] : [];
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

  const companyId = (body.companyId ?? '').trim();
  const queueDocId = (body.queueDocId ?? '').trim();
  if (!companyId || !queueDocId) {
    return NextResponse.json({ error: 'חסר companyId או queueDocId' }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();

  let adminUid: string;
  let requestEmail: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    adminUid = decoded.uid;
    requestEmail = decoded.email;
  } catch {
    return NextResponse.json({ error: 'טוקן לא תקף' }, { status: 401 });
  }

  try {
    await assertCanApproveRegistrations(db, adminUid, companyId, requestEmail);
  } catch {
    return NextResponse.json({ error: 'אין הרשאת אדמין' }, { status: 403 });
  }

  const queueRef = db
    .collection('companies')
    .doc(companyId)
    .collection('registrationQueue')
    .doc(queueDocId);
  const queueSnap = await queueRef.get();
  if (!queueSnap.exists) {
    return NextResponse.json({ error: 'רשומת תור לא נמצאה' }, { status: 404 });
  }

  const q = queueSnap.data()!;
  if (q.status !== 'pending') {
    return NextResponse.json({ error: 'הרשומה אינה במצב ממתין' }, { status: 400 });
  }

  const companySnap = await db.collection('companies').doc(companyId).get();
  const companyDisplayName = (companySnap.data()?.name as string) || companyId;

  const provider = q.provider === 'manual' ? 'manual' : 'google';

  try {
    if (provider === 'manual') {
      const email = String(q.email ?? '').toLowerCase().trim();
      const displayName = String(q.displayName ?? '').trim();
      const phone = String(q.phone ?? '').trim();
      if (!email || !displayName) {
        return NextResponse.json({ error: 'חסרים אימייל או שם בהרשמה' }, { status: 400 });
      }

      let newUid: string | undefined;
      const tempPassword = generateTempPassword(16);
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password: tempPassword,
          displayName,
          emailVerified: false,
        });
        newUid = userRecord.uid;

        const batch = db.batch();
        batch.set(
          queueRef,
          {
            status: 'approved',
            approvedAt: FieldValue.serverTimestamp(),
            approvedByUid: adminUid,
            approvedApplicantUid: newUid,
          },
          { merge: true }
        );

        const memberRole = mapQueueRoleToMemberRole(q.companyRole);
        const clientProjectIds =
          memberRole === 'client' ? await resolveClientProjectIds(db, companyId) : [];

        batch.set(db.collection('companies').doc(companyId).collection('members').doc(newUid), {
          uid: newUid,
          role: memberRole,
          displayName,
          email,
          phone: phone || null,
          active: true,
          provider: 'manual',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          ...(clientProjectIds.length > 0 ? { allowedProjectIds: clientProjectIds } : {}),
        });

        batch.set(
          db.collection('users').doc(newUid),
          {
            uid: newUid,
            displayName,
            email,
            phone: phone || null,
            approvedBy: adminUid,
            approvedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        batch.set(db.collection('users').doc(newUid).collection('companies').doc(companyId), {
          companyId,
          displayName: companyDisplayName,
          role: memberRole,
          active: true,
          updatedAt: FieldValue.serverTimestamp(),
          ...(clientProjectIds.length > 0 ? { allowedProjectIds: clientProjectIds } : {}),
        });

        await batch.commit();

        const loginUrl = `${siteUrl()}/login`;
        let emailSent = false;
        try {
          emailSent = await sendWelcomeEmailWithTempPassword({
            to: email,
            displayName,
            email,
            temporaryPassword: tempPassword,
            loginUrl,
          });
        } catch (mailErr) {
          console.error('welcome email failed', mailErr);
        }

        return NextResponse.json({
          ok: true,
          uid: newUid,
          emailSent,
          temporaryPassword: emailSent ? undefined : tempPassword,
          message: emailSent
            ? 'המשתמש נוצר ונשלח מייל עם פרטי כניסה.'
            : 'המשתמש נוצר. מייל לא נשלח — העתק את הסיסמה הזמנית מהתגובה או הגדר RESEND_API_KEY.',
        });
      } catch (e) {
        if (newUid) {
          await adminAuth.deleteUser(newUid).catch(() => {});
        }
        throw e;
      }
    }

    // Google (או בקשה עם applicantUid קיים)
    const applicantUid = String(q.applicantUid ?? '').trim();
    if (!applicantUid) {
      return NextResponse.json({ error: 'חסר applicantUid לבקשת Google' }, { status: 400 });
    }

    const displayName = String(q.displayName ?? '').trim() || null;
    const email = String(q.email ?? '').trim().toLowerCase() || null;

    const gMemberRole = mapQueueRoleToMemberRole(q.companyRole);
    const gClientProjectIds =
      gMemberRole === 'client' ? await resolveClientProjectIds(db, companyId) : [];

    const batch = db.batch();
    batch.set(
      queueRef,
      {
        status: 'approved',
        approvedAt: FieldValue.serverTimestamp(),
        approvedByUid: adminUid,
        approvedApplicantUid: applicantUid,
      },
      { merge: true }
    );

    batch.set(db.collection('companies').doc(companyId).collection('members').doc(applicantUid), {
      uid: applicantUid,
      role: gMemberRole,
      displayName,
      email,
      active: true,
      provider: 'google',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(gClientProjectIds.length > 0 ? { allowedProjectIds: gClientProjectIds } : {}),
    });

    batch.set(
      db.collection('users').doc(applicantUid),
      {
        uid: applicantUid,
        displayName,
        email,
        approvedBy: adminUid,
        approvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      db.collection('users').doc(applicantUid).collection('companies').doc(companyId),
      {
        companyId,
        displayName: companyDisplayName,
        role: gMemberRole,
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
        ...(gClientProjectIds.length > 0 ? { allowedProjectIds: gClientProjectIds } : {}),
      },
      { merge: true }
    );

    await batch.commit();

    return NextResponse.json({
      ok: true,
      uid: applicantUid,
      emailSent: false,
      message: 'המשתמש צורף לחברה (Google).',
    });
  } catch (err) {
    console.error('approve-registration', err);
    const msg = err instanceof Error ? err.message : 'שגיאה';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
