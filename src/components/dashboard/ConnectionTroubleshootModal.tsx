'use client';

import React from 'react';
import { X } from 'lucide-react';

const ORANGE = '#FF8C00';
const BRAND = '#004694';

type Props = {
  open: boolean;
  onClose: () => void;
  browserOnline: boolean;
  firebaseConfigured: boolean;
  userSignedIn: boolean;
  firestoreState: 'unknown' | 'ok' | 'fail';
  apiHealthOk: boolean | null;
  lastHealthMessage?: string;
};

export default function ConnectionTroubleshootModal({
  open,
  onClose,
  browserOnline,
  firebaseConfigured,
  userSignedIn,
  firestoreState,
  apiHealthOk,
  lastHealthMessage,
}: Props) {
  if (!open) return null;

  const rows: Array<{ label: string; ok: boolean; hint: string }> = [
    {
      label: 'חיבור דפדפן לאינטרנט',
      ok: browserOnline,
      hint: 'בדוק רשת Wi‑Fi / סלולר.',
    },
    {
      label: 'Firebase מוגדר באתר',
      ok: firebaseConfigured,
      hint: 'ודא ש־NEXT_PUBLIC_FIREBASE_* מוגדרים ב־.env.local.',
    },
    {
      label: 'משתמש מחובר',
      ok: userSignedIn,
      hint: 'התחבר מחדש עם Google.',
    },
    {
      label: 'Firestore (האזנה חיה)',
      ok: firestoreState === 'ok',
      hint:
        firestoreState === 'unknown'
          ? 'ממתין לאימות חיבור…'
          : 'בדוק חוקי אבטחה ופרויקט Firebase.',
    },
    {
      label: 'API שרת (בריאות)',
      ok: apiHealthOk === true,
      hint:
        apiHealthOk === null
          ? 'בודק חיבור לשרת…'
          : lastHealthMessage || 'בדוק שרת הפיתוח / Neon DATABASE_URL.',
    },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="סגור"
        className="fixed inset-0 z-[100] bg-black/20 pt-safe px-safe"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-[110] flex max-h-[min(90dvh,40rem)] w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
        dir="rtl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 flex-row-reverse items-center justify-between gap-4 border-b border-gray-100 p-4 sm:p-6 sm:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[32px] text-gray-500 transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
            aria-label="סגור חלון"
          >
            <X className="h-6 w-6 shrink-0" />
          </button>
          <h2 className="min-w-0 flex-1 text-right text-lg font-black text-[#1a1a1a] sm:text-xl" style={{ color: BRAND }}>
            אבחון חיבור
          </h2>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-6 sm:pt-4">
          {rows.map((row) => {
            const apiUnknown = row.label.startsWith('API') && apiHealthOk === null;
            const fsUnknown = row.label.startsWith('Firestore') && firestoreState === 'unknown';
            const neutral = apiUnknown || fsUnknown;
            return (
            <li
              key={row.label}
              className="flex flex-row-reverse items-center justify-between gap-4 rounded-[32px] border border-gray-100 p-4"
            >
              <div className="min-w-0 flex-1 text-right">
                <p className="font-bold text-[#1a1a1a]">{row.label}</p>
                <p className="mt-1 text-sm text-gray-500">{row.hint}</p>
              </div>
              <span
                className="mt-0 h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: neutral ? '#94a3b8' : row.ok ? '#22c55e' : '#ef4444',
                  boxShadow: neutral
                    ? '0 0 8px #94a3b8'
                    : row.ok
                      ? '0 0 10px #22c55e'
                      : '0 0 10px #ef4444',
                }}
              />
            </li>
            );
          })}
        </ul>

        <div className="shrink-0 border-t border-gray-100 p-4 pb-safe sm:p-6 sm:pt-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary-empire min-h-12 w-full rounded-[32px] py-4 text-base font-bold text-white transition-opacity active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
            style={{ backgroundColor: ORANGE }}
          >
            רענן דף
          </button>
        </div>
      </div>
    </>
  );
}
