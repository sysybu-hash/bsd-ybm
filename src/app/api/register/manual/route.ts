import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { PRIMARY_COMPANY_ID } from '@/services/firestore/seedService';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function registrationCompanyId(): string {
  return (
    process.env.NEXT_PUBLIC_REGISTRATION_COMPANY_ID?.trim() ||
    process.env.SYNC_DEFAULT_COMPANY_ID?.trim() ||
    PRIMARY_COMPANY_ID
  );
}

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: 'הרשמה זמנית אינה זמינה (שרת ללא Firebase Admin).' },
      { status: 503 }
    );
  }

  let body: {
    fullName?: string;
    email?: string;
    phone?: string;
    companyRole?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'גוף בקשה לא תקין' }, { status: 400 });
  }

  const fullName = (body.fullName ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const phone = (body.phone ?? '').trim();
  const companyRole = (body.companyRole ?? '').trim().toLowerCase();

  if (fullName.length < 2) {
    return NextResponse.json({ error: 'נא למלא שם מלא' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'כתובת אימייל לא תקינה' }, { status: 400 });
  }
  if (phone.length < 6) {
    return NextResponse.json({ error: 'נא למלא מספר טלפון תקין' }, { status: 400 });
  }
  if (companyRole !== 'client' && companyRole !== 'employee') {
    return NextResponse.json({ error: 'נא לבחור תפקיד: לקוח או עובד' }, { status: 400 });
  }

  const companyId = registrationCompanyId();

  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    try {
      await auth.getUserByEmail(email);
      return NextResponse.json({ error: 'כתובת האימייל כבר רשומה במערכת' }, { status: 409 });
    } catch (e: unknown) {
      const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: string }).code) : '';
      if (code !== 'auth/user-not-found') {
        throw e;
      }
    }

    const queueCol = db.collection('companies').doc(companyId).collection('registrationQueue');
    const pendingSnap = await queueCol.where('email', '==', email).limit(25).get();
    const alreadyPending = pendingSnap.docs.some((d) => d.data().status === 'pending');
    if (alreadyPending) {
      return NextResponse.json(
        { error: 'כבר קיימת בקשה ממתינה עבור אימייל זה' },
        { status: 409 }
      );
    }

    const docRef = queueCol.doc();
    await docRef.set({
      provider: 'manual',
      status: 'pending',
      applicantUid: null,
      email,
      displayName: fullName,
      phone,
      companyRole,
      requestedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      message:
        'Your request has been submitted and is waiting for Admin approval. הבקשה נשלחה וממתינה לאישור מנהל.',
      queueId: docRef.id,
    });
  } catch (err) {
    console.error('manual register error', err);
    return NextResponse.json({ error: 'שגיאת שרת, נסו שוב מאוחר יותר' }, { status: 500 });
  }
}
