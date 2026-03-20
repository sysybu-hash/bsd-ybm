'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const ORANGE = '#FF8C00';
const BRAND = '#004694';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyRole, setCompanyRole] = useState<'client' | 'employee' | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('נא למלא שם מלא');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('כתובת אימייל לא תקינה');
      return;
    }
    if (phone.trim().length < 6) {
      setError('נא למלא מספר טלפון תקין');
      return;
    }
    if (companyRole !== 'client' && companyRole !== 'employee') {
      setError('נא לבחור תפקיד');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/register/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          companyRole,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || 'שליחה נכשלה');
        return;
      }
      setDone(true);
    } catch {
      setError('שגיאת רשת, נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#FDFDFD] px-4 pb-safe pt-8" dir="rtl">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="text-center">
          <h1 className="text-2xl font-black text-[#1a1a1a] sm:text-3xl" style={{ color: BRAND }}>
            בקשת גישה
          </h1>
          <p className="mt-2 text-sm text-gray-500">הרשמה ידנית — לאחר אישור מנהל תקבלו פרטי כניסה</p>
        </header>

        {done ? (
          <div className="rounded-[40px] border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-lg font-bold text-[#1a1a1a]">הבקשה נשלחה</p>
            <p className="mt-4 text-gray-600">
              Your request has been submitted and is waiting for Admin approval.
            </p>
            <p className="mt-2 text-gray-600">הבקשה נשלחה וממתינה לאישור מנהל המערכת.</p>
            <Link
              href="/login"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[40px] px-8 py-3 font-bold text-white"
              style={{ backgroundColor: ORANGE }}
            >
              מעבר לדף כניסה
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4 rounded-[40px] border border-gray-100 bg-white p-6 shadow-sm sm:gap-5 sm:p-8"
          >
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              שם מלא
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="min-h-12 rounded-[40px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]/40"
                autoComplete="name"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              אימייל
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-12 rounded-[40px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]/40"
                autoComplete="email"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              טלפון
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-h-12 rounded-[40px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]/40"
                autoComplete="tel"
                required
              />
            </label>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-medium text-gray-700">תפקיד בחברה</legend>
              <label className="flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-[40px] border border-gray-200 px-4 py-3 has-[:checked]:border-[#004694] has-[:checked]:bg-[#004694]/5">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={companyRole === 'client'}
                  onChange={() => setCompanyRole('client')}
                  className="h-4 w-4 accent-[#FF8C00]"
                />
                <span className="font-medium">לקוח</span>
              </label>
              <label className="flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-[40px] border border-gray-200 px-4 py-3 has-[:checked]:border-[#004694] has-[:checked]:bg-[#004694]/5">
                <input
                  type="radio"
                  name="role"
                  value="employee"
                  checked={companyRole === 'employee'}
                  onChange={() => setCompanyRole('employee')}
                  className="h-4 w-4 accent-[#FF8C00]"
                />
                <span className="font-medium">עובד</span>
              </label>
            </fieldset>

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="min-h-12 rounded-[40px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: ORANGE }}
            >
              {busy ? 'שולח…' : 'שלח בקשה'}
            </button>
          </form>
        )}

        <div className="flex flex-col items-center gap-3 text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="font-bold text-[#004694] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
          >
            כבר יש לך חשבון? כניסה
          </Link>
          <Link href="/" className="hover:text-[#1a1a1a]">
            דף הבית
          </Link>
        </div>
      </div>
    </main>
  );
}
