'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  addDoc,
  collectionGroup,
  collection,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { SystemRole } from '@/types/multitenant';
import CompanyCreator from '@/components/developer/CompanyCreator';

const ORANGE = '#FF8C00';
const BRAND = '#004694';

type QueueRow = {
  id: string;
  companyId: string;
  displayName?: string;
  email?: string;
  status?: string;
  provider?: string;
};

type UserRow = {
  id: string;
  displayName?: string;
  email?: string;
  approvedBy?: string;
  systemRole?: string;
};

function companyIdFromQueuePath(path: string): string | null {
  const parts = path.split('/');
  const i = parts.indexOf('companies');
  if (i >= 0 && parts[i + 1]) return parts[i + 1];
  return null;
}

export default function DeveloperPanelPage() {
  const { user } = useAuth();
  const {
    isDeveloper,
    isMasterAdmin,
    setCompanyId,
    staffDirectory,
    enterCompanyImpersonation,
  } = useCompany();
  const canAccessPanel = isDeveloper || isMasterAdmin;
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [targetUid, setTargetUid] = useState('');
  const [rolePick, setRolePick] = useState<SystemRole | 'clear'>('global_manager');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [changeNote, setChangeNote] = useState('');
  const [changeBusy, setChangeBusy] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured() || !canAccessPanel) {
      setQueue([]);
      return;
    }
    const q = query(collectionGroup(getDb(), 'registrationQueue'), where('status', '==', 'pending'), limit(80));
    const unsub = onSnapshot(q, (snap) => {
      const rows: QueueRow[] = [];
      snap.forEach((d) => {
        const cid = companyIdFromQueuePath(d.ref.path);
        if (!cid) return;
        const data = d.data() as DocumentData;
        rows.push({
          id: d.id,
          companyId: cid,
          displayName: data.displayName,
          email: data.email,
          status: data.status,
          provider: data.provider,
        });
      });
      setQueue(rows);
    });
    return () => unsub();
  }, [canAccessPanel]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !canAccessPanel) {
      setUsers([]);
      return;
    }
    const q = query(collection(getDb(), 'users'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const rows: UserRow[] = [];
      snap.forEach((d) => {
        const data = d.data() as DocumentData;
        rows.push({
          id: d.id,
          displayName: data.displayName,
          email: data.email,
          approvedBy: data.approvedBy,
          systemRole: data.systemRole,
        });
      });
      setUsers(rows);
    });
    return () => unsub();
  }, [canAccessPanel]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (a.email || a.id).localeCompare(b.email || b.id, 'he'));
  }, [users]);

  const sortedTenants = useMemo(() => {
    return [...staffDirectory].sort((a, b) =>
      a.displayName.localeCompare(b.displayName, 'he', { sensitivity: 'base' })
    );
  }, [staffDirectory]);

  const setSystemRole = async () => {
    if (!user || !targetUid.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const token = await user.getIdToken();
      const systemRole = rolePick === 'clear' ? null : rolePick;
      const res = await fetch('/api/admin/set-system-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUid: targetUid.trim(), systemRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((data as { error?: string }).error || 'עדכון נכשל');
        return;
      }
      setMsg('תפקיד מערכת עודכן.');
      setTargetUid('');
    } finally {
      setBusy(false);
    }
  };

  if (!canAccessPanel) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#FDFDFD] p-8" dir="rtl">
        <p className="text-center text-gray-500">גישה למפתח / מנהל ראשי בלבד.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FDFDFD] p-4 pb-12 sm:p-8 md:p-12" dir="rtl">
      <div className="mb-8 flex items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[32px] px-3 text-sm font-bold text-gray-500 transition-colors hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה לדשבורד
        </Link>
      </div>

      <header className="mb-8 flex flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-[32px] bg-[#004694]/10 p-3">
          <Shield className="h-8 w-8 text-[#004694]" aria-hidden />
        </div>
        <h1 className="text-2xl font-black sm:text-3xl" style={{ color: BRAND }}>
          {isDeveloper ? 'לוח בקרה — מפתח' : 'לוח בקרה — מנהל ראשי'}
        </h1>
        <p className="text-sm text-gray-500">תור הרשמה בכל החברות · משתמשים · תפקידי מערכת</p>
      </header>

      {msg && (
        <p className="mx-auto mb-6 max-w-xl rounded-[32px] border border-gray-100 bg-white py-3 text-center text-sm text-gray-700">
          {msg}
        </p>
      )}

      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-8">
        <CompanyCreator onCreated={(id) => setCompanyId(id)} />

        {isDeveloper && (
          <section className="w-full rounded-4xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-center text-lg font-black text-[#1a1a1a]">דיירים גלובליים — צפייה כחברה (מפתח)</h2>
            <p className="mb-6 text-center text-xs text-gray-500">
              מציג את כל החברות ב־Firestore. לחצו &quot;כניסה כחברה&quot; לצפייה כמנהל הדייר.
            </p>
            <ul className="flex flex-col gap-4">
              {sortedTenants.length === 0 && (
                <li className="rounded-4xl border border-gray-100 py-8 text-center text-gray-400">
                  אין רשימת דיירים (או אין הרשאת קריאה).
                </li>
              )}
              {sortedTenants.map((row) => (
                <li
                  key={row.companyId}
                  className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 bg-[#FDFDFD] p-4 sm:flex-row sm:justify-between sm:px-6"
                >
                  <div className="flex flex-col items-center justify-center gap-1 text-center sm:items-start sm:text-right">
                    <span className="font-black text-[#1a1a1a]">{row.displayName}</span>
                    <span className="font-mono text-xs text-gray-400" dir="ltr">
                      {row.companyId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      enterCompanyImpersonation(row.companyId);
                      setMsg(`צפייה בדייר: ${row.displayName}`);
                    }}
                    className="flex min-h-12 w-full max-w-xs items-center justify-center rounded-4xl px-6 text-sm font-bold text-white sm:w-auto"
                    style={{
                      backgroundColor: 'var(--brand-primary, #004694)',
                      boxShadow: '0 0 20px var(--brand-glow, rgba(0,70,148,0.4))',
                    }}
                  >
                    כניסה כחברה
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="w-full rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-center text-lg font-black text-[#1a1a1a]">הגדרת תפקיד מערכת</h2>
          <p className="mb-6 text-center text-sm text-gray-500">
            מפתח: כל התפקידים. מנהל ראשי: <code className="font-mono">global_manager</code>,{' '}
            <code className="font-mono">master_admin</code>, או הסרה — לא ניתן להקצות{' '}
            <code className="font-mono">developer</code>.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <input
              type="text"
              dir="ltr"
              placeholder="UID משתמש"
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              className="min-h-12 w-full max-w-md rounded-[32px] border border-gray-200 px-4 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
            />
            <select
              value={rolePick}
              onChange={(e) => setRolePick(e.target.value as SystemRole | 'clear')}
              className="min-h-12 w-full max-w-xs rounded-[32px] border border-gray-200 px-4 text-center text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00] sm:w-auto"
            >
              <option value="global_manager">global_manager</option>
              <option value="master_admin">master_admin</option>
              {isDeveloper && <option value="developer">developer</option>}
              <option value="clear">הסר תפקיד גלובלי</option>
            </select>
            <button
              type="button"
              disabled={busy || !targetUid.trim()}
              onClick={() => void setSystemRole()}
              className="min-h-12 w-full max-w-xs rounded-[32px] px-6 font-bold text-white transition-opacity disabled:opacity-50 sm:w-auto"
              style={{ backgroundColor: ORANGE }}
            >
              {busy ? 'שומר…' : 'עדכן'}
            </button>
          </div>
        </section>

        <section className="w-full rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-center text-lg font-black text-[#1a1a1a]">תור הרשמה (כל החברות)</h2>
          <ul className="flex flex-col gap-4">
            {queue.length === 0 && (
              <li className="rounded-[32px] border border-gray-100 py-8 text-center text-gray-400">
                אין בקשות ממתינות (או אין הרשאת קריאה).
              </li>
            )}
            {queue.map((row) => (
              <li
                key={`${row.companyId}-${row.id}`}
                className="flex flex-col items-center justify-center gap-1 rounded-[32px] border border-gray-100 p-4 text-center"
              >
                <span className="font-bold text-[#1a1a1a]">{row.displayName || row.id}</span>
                <span className="text-xs text-gray-500">{row.email}</span>
                <span className="text-xs font-mono text-gray-400">
                  company: {row.companyId} · {row.provider === 'manual' ? 'ידני' : 'google'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {isDeveloper && (
          <section className="w-full rounded-[32px] border border-amber-100 bg-amber-50/40 p-6 shadow-sm sm:p-8">
            <h2 className="mb-2 text-center text-lg font-black text-[#1a1a1a]">יומן שינויים → Owner Vault</h2>
            <p className="mb-4 text-center text-xs text-gray-600">
              תארו בקצרה מה שיניתם בקוד או בתצורה — יופיע באזור הבעלים לאחר שמירה.
            </p>
            <textarea
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              rows={4}
              placeholder="למשל: עדכון API סריקה, תיקון ניווט דשבורד…"
              className="mb-4 min-h-24 w-full rounded-[32px] border border-gray-200 bg-white p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              dir="rtl"
            />
            <div className="flex flex-col items-center justify-center gap-4">
              <button
                type="button"
                disabled={changeBusy || !changeNote.trim()}
                onClick={async () => {
                  if (!user || !changeNote.trim()) return;
                  setChangeBusy(true);
                  setMsg(null);
                  try {
                    await addDoc(collection(getDb(), 'developerChangeLog'), {
                      message: changeNote.trim().slice(0, 4000),
                      actorEmail: user.email ?? '',
                      actorUid: user.uid,
                      createdAt: serverTimestamp(),
                    });
                    setChangeNote('');
                    setMsg('נרשם ביומן הבעלים.');
                  } catch (e) {
                    setMsg(e instanceof Error ? e.message : 'שמירת יומן נכשלה');
                  } finally {
                    setChangeBusy(false);
                  }
                }}
                className="min-h-12 w-full max-w-xs rounded-[32px] px-6 font-bold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                {changeBusy ? 'שומר…' : 'שליחה ליומן הבעלים'}
              </button>
            </div>
          </section>
        )}

        <section className="w-full rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-center text-lg font-black text-[#1a1a1a]">משתמשים (דגימה)</h2>
          <p className="mb-4 text-center text-xs text-gray-400">עד 200 מסמכים — ללא סינון</p>
          <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
            {sortedUsers.map((u) => (
              <li
                key={u.id}
                className="flex flex-col items-center justify-center gap-1 rounded-[32px] border border-gray-50 bg-[#FDFDFD] px-3 py-2 text-center text-xs sm:flex-row sm:text-sm"
              >
                <span className="font-mono text-gray-600">{u.id}</span>
                <span className="text-gray-500">{u.email || '—'}</span>
                {u.systemRole && (
                  <span className="rounded-[32px] px-2 py-0.5 font-bold text-white" style={{ backgroundColor: BRAND }}>
                    {u.systemRole}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
