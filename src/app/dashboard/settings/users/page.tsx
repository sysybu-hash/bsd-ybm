'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  onSnapshot,
  query,
  where,
  limit,
  writeBatch,
  doc,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { getDb, companyRegistrationQueueRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

const ORANGE = '#FF8C00';
const BRAND = '#004694';

type QueueDoc = {
  id: string;
  applicantUid?: string | null;
  displayName?: string;
  email?: string;
  phone?: string;
  status?: string;
  provider?: string;
  companyRole?: string;
};

type ApprovedUserRow = {
  id: string;
  displayName?: string;
  email?: string;
  systemRole?: string;
  approvedBy?: string;
};

export default function UsersApprovalPage() {
  const { companyId, isCompanyAdmin, isDeveloper, isMasterAdmin, canManageRegistrations } = useCompany();
  const showAllPlatformUsers = isDeveloper || isMasterAdmin;
  const { user } = useAuth();
  const [pending, setPending] = useState<QueueDoc[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUserRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ password: string; email: string } | null>(
    null
  );
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setPending([]);
      return;
    }
    const q = query(
      companyRegistrationQueueRef(companyId),
      where('status', '==', 'pending'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: QueueDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as Omit<QueueDoc, 'id'>;
        rows.push({
          ...data,
          id: d.id,
          applicantUid: data.applicantUid ?? undefined,
        });
      });
      setPending(rows);
    });
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !user?.uid || !canManageRegistrations) {
      setApprovedUsers([]);
      return;
    }
    const db = getDb();
    const q = showAllPlatformUsers
      ? query(collection(db, 'users'), limit(200))
      : query(collection(db, 'users'), where('approvedBy', '==', user.uid), limit(120));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: ApprovedUserRow[] = [];
        snap.forEach((d) => {
          const data = d.data() as ApprovedUserRow;
          rows.push({
            id: d.id,
            displayName: data.displayName,
            email: data.email,
            systemRole: data.systemRole,
            approvedBy: data.approvedBy,
          });
        });
        setApprovedUsers(rows);
      },
      () => setApprovedUsers([])
    );
    return () => unsub();
  }, [user?.uid, canManageRegistrations, showAllPlatformUsers]);

  const approve = async (row: QueueDoc) => {
    if (!companyId || !isCompanyAdmin || !user?.uid) return;
    setBusyId(row.id);
    setApiMessage(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/approve-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyId, queueDocId: row.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiMessage((data as { error?: string }).error || 'אישור נכשל');
        return;
      }

      setApiMessage((data as { message?: string }).message || 'אושר בהצלחה');

      const temp = (data as { temporaryPassword?: string }).temporaryPassword;
      const email = row.email ?? '';
      if (temp && email) {
        setTempPasswordModal({ password: temp, email });
      }
    } finally {
      setBusyId(null);
    }
  };

  const sendInvite = async () => {
    if (!user || !companyId) return;
    const to = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setInviteMsg({ kind: 'err', text: 'נא להזין כתובת אימייל תקינה.' });
      return;
    }
    setInviteBusy(true);
    setInviteMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId,
          email: to,
          role: inviteRole,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setInviteMsg({ kind: 'err', text: data.error || 'שליחה נכשלה' });
        return;
      }
      setInviteMsg({ kind: 'ok', text: data.message || 'ההזמנה נשלחה' });
      setInviteEmail('');
      setInviteModalOpen(false);
      setApiMessage(data.message || 'הזמנה במייל נשלחה בהצלחה.');
    } catch {
      setInviteMsg({ kind: 'err', text: 'שגיאת רשת' });
    } finally {
      setInviteBusy(false);
    }
  };

  const reject = async (row: QueueDoc) => {
    if (!companyId || !isCompanyAdmin || !user?.uid) return;
    setBusyId(row.id);
    try {
      const db = getDb();
      const batch = writeBatch(db);
      batch.set(
        doc(db, 'companies', companyId, 'registrationQueue', row.id),
        {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          rejectedByUid: user.uid,
        },
        { merge: true }
      );
      await batch.commit();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-full bg-[#FFFFFF] p-4 pb-12 sm:p-8 md:p-12" dir="rtl">
      {tempPasswordModal && (
        <>
          <button
            type="button"
            aria-label="סגור"
            className="fixed inset-0 z-[100] bg-black/30"
            onClick={() => setTempPasswordModal(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-[110] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-[40px] border border-gray-100 bg-white p-6 shadow-xl">
            <h3 className="text-center text-lg font-black text-[#1a1a1a]">סיסמה זמנית</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              המייל לא נשלח אוטומטית. העתקו ושלחו ידנית ל־{tempPasswordModal.email}
            </p>
            <div className="mt-4 rounded-[40px] border border-gray-200 bg-gray-50 p-4 text-center font-mono text-sm break-all">
              {tempPasswordModal.password}
            </div>
            <button
              type="button"
              className="mt-6 min-h-12 w-full rounded-[40px] font-bold text-white"
              style={{ backgroundColor: ORANGE }}
              onClick={() => {
                void navigator.clipboard.writeText(tempPasswordModal.password);
              }}
            >
              העתק סיסמה
            </button>
            <button
              type="button"
              className="mt-3 w-full text-sm text-gray-500"
              onClick={() => setTempPasswordModal(null)}
            >
              סגור
            </button>
          </div>
        </>
      )}

      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[40px] px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#1a1a1a] active:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה לדשבורד
        </Link>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl" style={{ color: BRAND }}>
          אישור משתמשים
        </h1>
        <p className="mt-2 text-gray-500">תור הרשמה — סטטוס pending (כולל הרשמה ידנית)</p>
      </header>

      {apiMessage && (
        <p className="mb-4 rounded-[40px] border border-gray-100 bg-gray-50 py-3 text-center text-sm text-gray-700">
          {apiMessage}
        </p>
      )}

      {companyId && isCompanyAdmin && (
        <section className="mx-auto mb-10 flex max-w-2xl flex-col items-center justify-center gap-4 rounded-[32px] border border-[#004694]/15 bg-white p-6 shadow-sm">
          <h2 className="text-center text-lg font-black text-[#1a1a1a]">הזמנת משתמש / מנהל (מייל)</h2>
          <p className="max-w-md text-center text-sm text-gray-500">
            הוספת אימייל לשדות <strong>admins</strong> / <strong>users</strong> במסמך החברה ושליחת הזמנה אוטומטית
            (Golden Helix).
          </p>
          <button
            type="button"
            onClick={() => {
              setInviteModalOpen(true);
              setInviteMsg(null);
            }}
            className="min-h-12 rounded-[32px] px-8 py-3 font-black text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: BRAND }}
          >
            הוספת משתמש — שליחת הזמנה
          </button>
        </section>
      )}

      {inviteModalOpen && companyId && isCompanyAdmin && (
        <>
          <button
            type="button"
            aria-label="סגור"
            className="fixed inset-0 z-[100] bg-black/30"
            onClick={() => !inviteBusy && setInviteModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[110] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-gray-100 bg-white p-6 shadow-xl">
            <h3 className="text-center text-lg font-black text-[#1a1a1a]">הזמנה במייל</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              הזינו אימייל — יישלח מייל לפורטל ויירשם ב־Firestore תחת החברה הנוכחית.
            </p>
            <label className="mt-4 flex w-full flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700">
              תפקיד ברשימה
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value === 'admin' ? 'admin' : 'member')}
                disabled={inviteBusy}
                className="min-h-12 w-full rounded-[32px] border border-gray-200 bg-white px-4 text-center text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              >
                <option value="member">משתמש (users)</option>
                <option value="admin">מנהל חברה (admins)</option>
              </select>
            </label>
            <label className="mt-4 flex w-full flex-col items-center justify-center gap-2 text-sm font-bold text-gray-700">
              אימייל
              <input
                type="email"
                autoComplete="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="min-h-12 w-full rounded-[32px] border border-gray-200 px-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
                placeholder="name@example.com"
                disabled={inviteBusy}
              />
            </label>
            {inviteMsg && (
              <p
                className={`mt-3 text-center text-sm ${inviteMsg.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}
                role="status"
              >
                {inviteMsg.text}
              </p>
            )}
            <div className="mt-6 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                disabled={inviteBusy}
                onClick={() => void sendInvite()}
                className="min-h-12 w-full rounded-[32px] font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: ORANGE }}
              >
                {inviteBusy ? 'שולח…' : 'שלח הזמנה'}
              </button>
              <button
                type="button"
                className="text-sm text-gray-500"
                disabled={inviteBusy}
                onClick={() => setInviteModalOpen(false)}
              >
                ביטול
              </button>
            </div>
          </div>
        </>
      )}

      {!companyId && (
        <p className="text-center text-gray-500">בחר חברה מהמתג בצד כדי לראות את התור.</p>
      )}

      {companyId && !isCompanyAdmin && (
        <p className="text-center text-gray-500">רק אדמין או צוות גלובלי יכולים לאשר בקשות.</p>
      )}

      {canManageRegistrations && (
        <section className="mx-auto mb-12 flex max-w-2xl flex-col gap-4">
          <h2 className="text-center text-xl font-black text-[#1a1a1a]">
            משתמשים באחריותי {showAllPlatformUsers ? '(כל המערכת)' : ''}
          </h2>
          <p className="text-center text-sm text-gray-500">
            {showAllPlatformUsers
              ? 'רשימת דגימה של משתמשים (קריאה גלובלית).'
              : 'משתמשים שאישרת באופן אישי (שדה approvedBy).'}
          </p>
          <ul className="flex flex-col gap-3">
            {approvedUsers.length === 0 && (
              <li className="rounded-[40px] border border-gray-100 bg-white p-6 text-center text-gray-400">
                אין משתמשים להצגה.
              </li>
            )}
            {approvedUsers.map((u) => (
              <li
                key={u.id}
                className="flex flex-col items-center justify-center gap-1 rounded-[40px] border border-gray-100 bg-white p-4 text-center shadow-sm"
              >
                <span className="font-bold text-[#1a1a1a]">{u.displayName || u.id}</span>
                <span className="text-xs text-gray-500">{u.email || u.id}</span>
                {u.systemRole && (
                  <span className="rounded-[40px] bg-[#004694]/10 px-3 py-1 text-xs font-bold text-[#004694]">
                    {u.systemRole}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {companyId && isCompanyAdmin && (
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {pending.length === 0 && (
            <div className="rounded-[40px] border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
              אין משתמשים ממתינים לאישור.
            </div>
          )}
          {pending.map((row) => (
            <div
              key={row.id}
              className="flex flex-col items-center justify-center gap-4 rounded-[40px] border border-gray-100 bg-white p-6 text-center shadow-sm"
            >
              <p className="font-black text-[#1a1a1a]">{row.displayName || 'ללא שם'}</p>
              <p className="text-sm text-gray-500">{row.email || row.applicantUid || row.id}</p>
              {row.phone && <p className="text-sm text-gray-500">טלפון: {row.phone}</p>}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-gray-500">
                <span className="rounded-[40px] border border-gray-200 px-3 py-1">
                  {row.provider === 'manual' ? 'ידני' : 'Google / אחר'}
                </span>
                {row.companyRole && (
                  <span className="rounded-[40px] border border-gray-200 px-3 py-1">
                    {row.companyRole === 'client' ? 'לקוח' : 'עובד'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => approve(row)}
                  className="min-h-12 rounded-[40px] px-6 py-3 font-bold text-white transition-opacity active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
                  style={{ backgroundColor: ORANGE }}
                >
                  {busyId === row.id ? 'מעבד…' : 'אשר'}
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => reject(row)}
                  className="min-h-12 rounded-[40px] border border-gray-200 px-6 py-3 font-bold text-gray-600 transition-colors active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
                >
                  דחה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

