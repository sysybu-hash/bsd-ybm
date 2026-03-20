'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { readHostTenantLock } from '@/lib/companyCookie';

const ORANGE = '#FF8C00';
const BRAND = '#004694';

type TenantLoginBrand = {
  displayName: string;
  companyLogoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signInWithEmailPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tenantBrand, setTenantBrand] = useState<TenantLoginBrand | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const { locked, companyId } = readHostTenantLock();
    if (!locked || !companyId) return;
    let cancelled = false;
    fetch(`/api/public/tenant-branding?companyId=${encodeURIComponent(companyId)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.ok) return;
        setTenantBrand({
          displayName: String(j.displayName ?? ''),
          companyLogoUrl: typeof j.companyLogoUrl === 'string' && j.companyLogoUrl ? j.companyLogoUrl : null,
          primaryColor: typeof j.primaryColor === 'string' && j.primaryColor ? j.primaryColor : BRAND,
          secondaryColor: typeof j.secondaryColor === 'string' && j.secondaryColor ? j.secondaryColor : ORANGE,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await signInWithEmailPassword(email, password);
      router.replace('/dashboard');
    } catch (e: unknown) {
      const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      setErr(
        code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? 'אימייל או סיסמה שגויים'
          : 'התחברות נכשלה, נסו שוב'
      );
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace('/dashboard');
    } catch {
      setErr('התחברות Google נכשלה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#FDFDFD] px-4 pb-safe pt-8" dir="rtl">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex flex-col items-center justify-center gap-4 text-center">
          {tenantBrand?.companyLogoUrl ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm">
              <img
                src={tenantBrand.companyLogoUrl}
                alt=""
                className="mx-auto h-16 max-w-[220px] object-contain"
              />
              <p className="text-xs font-bold text-gray-500">פורטל לקוח · {tenantBrand.displayName || 'ארגון'}</p>
            </div>
          ) : null}
          <h1
            className="text-2xl font-black text-[#1a1a1a] sm:text-3xl"
            style={{ color: tenantBrand?.primaryColor ?? BRAND }}
          >
            כניסה
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {tenantBrand?.displayName ? `${tenantBrand.displayName} · ` : ''}BSD-YBM AI Solutions
          </p>
        </header>

        {!isConfigured && (
          <p className="rounded-[32px] border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
            Firebase לא מוגדר בסביבה זו.
          </p>
        )}

        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            disabled={busy || !isConfigured}
            onClick={onGoogle}
            className="min-h-12 w-full rounded-[32px] border border-gray-200 font-bold text-[#1a1a1a] transition-colors active:bg-gray-100 disabled:opacity-50"
          >
            המשך עם Google
          </button>

          <div className="my-6 flex items-center justify-center gap-4">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">או</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={onEmailLogin} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              אימייל
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-12 rounded-[32px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]/40"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              סיסמה
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-12 rounded-[32px] border border-gray-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]/40"
                required
              />
            </label>
            {err && <p className="text-center text-sm text-red-600">{err}</p>}
            <button
              type="submit"
              disabled={busy || !isConfigured}
              className="btn-primary-empire min-h-12 rounded-[32px] font-bold text-white transition-opacity active:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: tenantBrand?.secondaryColor ?? ORANGE }}
            >
              {busy ? 'מתחבר…' : 'כניסה עם אימייל'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600">
          אין לך חשבון?{' '}
          <Link
            href="/register"
            className="font-bold text-[#004694] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
          >
            בקשת גישה (הרשמה ידנית)
          </Link>
        </p>

        <div className="flex justify-center">
          <Link
            href="/"
            className="text-sm text-gray-500 transition-colors hover:text-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </main>
  );
}
