'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PUBLIC_SITE_URL } from '@/lib/site';

const SITE_ORIGIN = PUBLIC_SITE_URL.replace(/\/$/, '');
const PRIVACY_POLICY_URL = `${SITE_ORIGIN}/en/legal`;
const TERMS_URL = `${SITE_ORIGIN}/en/terms`;

/**
 * דף בית ציבורי — רקע לבן (סגנון Meuhedet). משתמש מחובר מועבר ישירות ל-/dashboard.
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Direct to dashboard — skip the /en intermediate hop
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#FDFDFD] p-8 text-[#001a4d]" dir="rtl">
        <p className="text-center text-sm text-gray-600">bsd-ybm · טוען…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-dvh bg-[#FDFDFD] p-8 text-[#001a4d]" dir="rtl">
        <p className="text-center text-sm text-gray-600">פותחים את לוח הבקרה…</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FDFDFD] text-[#001a4d]" dir="rtl">
      <header className="border-b border-gray-200 bg-[#FDFDFD] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-3xl font-black text-[#004694] md:text-4xl">bsd-ybm</h1>
          <p className="max-w-lg text-sm leading-relaxed text-gray-800">
            פורטל ציבורי · ניהול פרויקטים, שכר, הוצאות ודוחות לענף הבנייה — ממשק נקי, ללא חסימת כניסה לצפייה במידע זה.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-10 md:px-12">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-[32px] bg-[#004694] px-8 py-3 text-sm font-black text-white shadow-sm"
          >
            כניסה למערכת
          </Link>
          <Link
            href="/en"
            className="inline-flex min-h-12 items-center justify-center rounded-[32px] border border-gray-200 bg-white px-8 py-3 text-sm font-bold text-[#004694] shadow-sm"
          >
            כניסה ל־ERP (/en)
          </Link>
        </div>

        <nav
          aria-label="מסמכים משפטיים"
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700"
        >
          <a href={PRIVACY_POLICY_URL} className="min-h-12 font-semibold text-[#004694] underline underline-offset-4">
            מדיניות פרטיות
          </a>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          <a href={PRIVACY_POLICY_URL} lang="en" className="min-h-12 font-semibold text-[#004694] underline underline-offset-4">
            Privacy Policy
          </a>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          <a href={TERMS_URL} className="min-h-12 font-semibold text-[#004694] underline underline-offset-4">
            תנאי שימוש
          </a>
        </nav>

        <p className="mt-12 text-center text-xs text-gray-400">© {new Date().getFullYear()} BSD-YBM · כל הזכויות שמורות</p>
      </main>
    </div>
  );
}
