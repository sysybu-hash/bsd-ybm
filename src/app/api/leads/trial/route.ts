import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  business_sector?: string;
  registration_type?: string;
  idToken?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'server_not_configured' }, { status: 503 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim().slice(0, 120);
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone ?? '').trim().slice(0, 40);
  const business_sector = String(body.business_sector ?? '').trim().slice(0, 64);

  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: 'invalid_name' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }
  if (phone.length < 6) {
    return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
  }
  if (business_sector.length < 2) {
    return NextResponse.json({ ok: false, error: 'invalid_sector' }, { status: 400 });
  }

  const registration_type = body.registration_type === 'demo' ? 'demo' : 'trial';

  const db = getAdminFirestore();

  let profileApplied = false;
  let appliedRegistrationType: 'trial' | 'demo' | undefined;

  const trialEndsAt =
    registration_type === 'trial'
      ? Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : null;

  const leadRef = await db.collection('leads').add({
    name,
    email,
    phone,
    business_sector,
    registration_type,
    status: 'pending_lead',
    createdAt: FieldValue.serverTimestamp(),
    source: registration_type === 'demo' ? 'demo_registration' : 'trial_registration',
    ...(registration_type === 'trial'
      ? {
          trialPlanDays: 7,
          scanLimit: 10,
          trialEndsAt,
        }
      : {
          trialPlanDays: null,
          scanLimit: null,
          trialEndsAt: null,
        }),
  });

  const token = typeof body.idToken === 'string' ? body.idToken.trim() : '';
  if (token) {
    try {
      const auth = getAdminAuth();
      const decoded = await auth.verifyIdToken(token);
      const userEmail = (decoded.email ?? '').toLowerCase();
      if (userEmail && userEmail === email) {
        if (registration_type === 'trial') {
          await db.collection('users').doc(decoded.uid).set(
            {
              accountTier: 'trial',
              trialExpiresAt: trialEndsAt,
              scanQuota: 10,
              scansUsed: 0,
              isTrialUser: false,
              trialLeadId: leadRef.id,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          await db.collection('users').doc(decoded.uid).set(
            {
              accountTier: 'demo',
              isTrialUser: true,
              trialLeadId: leadRef.id,
              trialExpiresAt: FieldValue.delete(),
              scanQuota: FieldValue.delete(),
              scansUsed: FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        profileApplied = true;
        appliedRegistrationType = registration_type;
      }
    } catch {
      // ignore invalid token — lead still created
    }
  }

  return NextResponse.json({
    ok: true,
    leadId: leadRef.id,
    profileApplied,
    appliedRegistrationType,
    trialUserApplied: appliedRegistrationType === 'demo',
  });
}
