'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  MapPin,
  Settings2,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';

const MODULES = [
  { href: '/dashboard', title: 'דשבורד חי', hint: 'סטטוס ופעולות', icon: LayoutDashboard, color: '#004694' },
  { href: '/dashboard/projects', title: 'פרויקטים', hint: 'רשימה ופרטים', icon: FolderKanban, color: '#004694' },
  { href: '/en/payroll', title: 'מרכז שכר מקאנו', hint: 'שכר ומס', icon: ClipboardList, color: '#22c55e' },
  { href: '/en/reports/location', title: 'עלויות לפי כתובת', hint: 'דוח אתרים', icon: MapPin, color: '#FF8C00' },
  { href: '/dashboard/finance/budget-actual', title: 'תקציב מול ביצוע', hint: 'השוואת תקציב', icon: TrendingUp, color: '#004694' },
  { href: '/dashboard/finance/expenses', title: 'יומן הוצאות', hint: 'חומרים וקבלנים', icon: Wallet, color: '#FF8C00' },
  { href: '/en/settings', title: 'הגדרות ERP', hint: 'מוח ארגוני ומסים', icon: Settings2, color: '#64748b' },
] as const;

export default function EnHomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (loading) return;
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (isFirebaseConfigured() && loading) return null;

  if (isFirebaseConfigured() && user) return null;

  return (
    <div
      className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center bg-[#FDFDFD] p-6 md:p-12"
      dir="rtl"
    >
      <main className="flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <span className="rounded-[32px] border border-[#004694]/20 bg-[#004694]/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#004694]">
            מערכת ניהול לבנייה
          </span>
          <h1 className="text-4xl font-black tracking-tight text-[#001A4D] md:text-5xl">BSD-YBM</h1>
          <p className="max-w-lg text-base leading-relaxed text-gray-600 md:text-lg">
            פרויקטים, שכר עם ניכוי מס אוטומטי, דוח עלויות לפי כתובת אתר, והגדרות ארגון — הכול בזמן אמת ב-Firestore.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-flex min-h-12 items-center justify-center rounded-[32px] bg-[#004694] px-8 py-3 text-sm font-black text-white shadow-md transition-opacity hover:opacity-90"
          >
            התחברות לסביבת העבודה
          </Link>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {MODULES.map(({ href, title, hint, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white p-6 text-center shadow-sm transition-shadow hover:border-[#004694]/30 hover:shadow-md"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[32px] text-white"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 text-center">
                <p className="text-sm font-black text-[#1a1a1a]">{title}</p>
                <p className="text-xs text-gray-400">{hint}</p>
              </div>
            </Link>
          ))}
        </div>

        <footer className="text-xs text-gray-400">
          © {new Date().getFullYear()} BSD-YBM · דיוק · בקרה · מצוינות
        </footer>
      </main>
    </div>
  );
}
