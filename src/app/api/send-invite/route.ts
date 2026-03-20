import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';
import { assertCanApproveRegistrations } from '@/lib/server/registrationAuthz';
import { sendTransactionalHtml } from '@/lib/email/sendTransactionalEmail';
import { buildSendInviteEmailHtml, SEND_INVITE_EMAIL_SUBJECT } from '@/lib/email/inviteEmailHtml';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  companyId?: string;
  email?: string;
  /** `admin` → `companies/{id}.admins`, `member` → `users` */
  role?: 'admin' | 'member';
  inviterDisplayName?: string;
};

export async function POST(req: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: 'שרת לא מוגדר' }, { status: 503 });
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

  const companyId = String(body.companyId ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const role = body.role === 'admin' ? 'admin' : 'member';

  if (!companyId || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'חסר companyId או אימייל לא תקין' }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminFirestore();
  let requestEmail: string | undefined;
  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    requestEmail = decoded.email ?? undefined;
  } catch {
    return NextResponse.json({ error: 'טוקן לא תקף' }, { status: 401 });
  }

  try {
    await assertCanApproveRegistrations(db, uid, companyId, requestEmail);
  } catch {
    return NextResponse.json({ error: 'אין הרשאת מנהל לחברה זו' }, { status: 403 });
  }

  const field = role === 'admin' ? 'admins' : 'users';

  let inviterName = String(body.inviterDisplayName ?? '').trim();
  if (!inviterName) {
    try {
      const u = await db.collection('users').doc(uid).get();
      const d = u.data() as Record<string, unknown> | undefined;
      inviterName =
        (typeof d?.displayName === 'string' && d.displayName.trim()) ||
        (typeof d?.name === 'string' && d.name.trim()) ||
        requestEmail?.split('@')[0] ||
        '';
    } catch {
      inviterName = requestEmail?.split('@')[0] || '';
    }
  }
  if (!inviterName) {
    inviterName = (process.env.INVITE_DEFAULT_INVITER_NAME || 'יוחנן בוקשפן').trim() || 'יוחנן בוקשפן';
  }

  const html = buildSendInviteEmailHtml({ inviterDisplayName: inviterName });

  try {
    await sendTransactionalHtml({
      to: email,
      subject: SEND_INVITE_EMAIL_SUBJECT,
      html,
    });
  } catch (e) {
    console.error('[api/send-invite] send failed', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'שליחת המייל נכשלה — בדקו EMAIL_SERVER / RESEND' },
      { status: 502 }
    );
  }

  try {
    await db
      .collection('companies')
      .doc(companyId)
      .set(
        {
          [field]: FieldValue.arrayUnion(email),
          inviteEmailsUpdatedAt: FieldValue.serverTimestamp(),
          lastInviteByUid: uid,
        },
        { merge: true }
      );
  } catch (e) {
    console.error('[api/send-invite] company update', e);
    return NextResponse.json(
      {
        error: 'המייל נשלח אך עדכון רשימת החברה נכשל — פנו לתמיכה',
        sent: true,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: 'ההזמנה נשלחה והאימייל נרשם בחברה' });
}
