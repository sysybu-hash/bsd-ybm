'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderKanban,
  HardHat,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Receipt,
  Settings,
  Wallet,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { getFirebaseAuth } from '@/lib/firebase';

const MINIMAL_LAYOUT_PREFIXES = ['/en/denied', '/en/legal', '/en/terms'] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === '/en') return pathname === '/en' || pathname === '/en/';
  if (href === '/dashboard/projects') return pathname.startsWith('/dashboard/projects');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function EnErpShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const minimal = MINIMAL_LAYOUT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const { user, loading } = useAuth();
  const { companies, companyId } = useCompany();
  const isClient = useMemo(
    () => Boolean(companyId) && companies.some((c) => c.companyId === companyId && c.role === 'client'),
    [companies, companyId],
  );
  const [fabOpen, setFabOpen] = useState(false);

  if (minimal) {
    return <>{children}</>;
  }

  const nav = [
    { href: '/en', label: 'דשבורד', icon: LayoutDashboard },
    { href: '/dashboard/projects', label: 'פרויקטים', icon: FolderKanban },
    { href: '/en/payroll', label: 'מקאנו שכר', icon: Wallet },
    { href: '/en/reports/location', label: 'דוחות אתר', icon: MapPin },
    { href: '/en/settings', label: 'הגדרות', icon: Settings },
  ] as const;

  const signOutClick = () => void signOut(getFirebaseAuth());

  return (
    <div className="flex min-h-screen" dir="rtl">
      <aside
        className="fixed inset-y-0 start-0 z-40 flex w-64 flex-col border-e border-gray-100 bg-white p-6 shadow-xl"
        aria-label="ניווט bsd-ybm"
      >
        <div className="flex flex-col items-center justify-center gap-4 pb-8">
          <Link href="/en" className="text-center text-xl font-black tracking-tight text-[#001A4D]">
            bsd-ybm
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-4" aria-label="מודולי ERP">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-12 items-center justify-center gap-4 rounded-[32px] px-4 py-3 text-sm font-bold transition-colors ${
                  active
                    ? 'bg-[#FF8C00] text-white shadow-md'
                    : 'border border-gray-100 text-gray-600 hover:border-[#004694]/30 hover:bg-[#004694]/5 hover:text-[#004694]'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center justify-center gap-4 border-t border-gray-100 pt-6">
          {!loading && user ? (
            <>
              <Link
                href="/en/legal"
                className="text-center text-xs font-semibold text-gray-400 underline-offset-4 hover:text-[#004694] hover:underline"
              >
                מסמכים משפטיים
              </Link>
              <button
                type="button"
                onClick={signOutClick}
                className="flex min-h-12 w-full items-center justify-center gap-4 rounded-[32px] border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                התנתקות
              </button>
            </>
          ) : (
            <Link
              href="/login?next=%2Fen"
              className="flex min-h-12 w-full items-center justify-center gap-4 rounded-[32px] bg-[#004694] px-4 py-3 text-sm font-black text-white"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              כניסה
            </Link>
          )}
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col ps-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-center border-b border-gray-100 bg-white px-6 backdrop-blur-sm md:px-12">
          <span className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500">bsd-ybm · מערכת</span>
        </header>
        <main className="flex flex-1 flex-col bg-white p-6 pb-24 md:p-12">{children}</main>
      </div>

      {user && !isClient ? (
        <>
          {fabOpen ? (
            <div
              className="fixed bottom-24 end-6 z-50 flex min-w-[200px] flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white p-6 shadow-xl"
              role="menu"
              aria-label="הוספה מהירה"
            >
              <Link
                href="/dashboard/finance/expenses"
                onClick={() => setFabOpen(false)}
                className="flex min-h-12 w-full items-center justify-center gap-4 rounded-[32px] border border-gray-200 px-4 py-3 text-sm font-bold text-[#1a1a1a] hover:bg-gray-50"
                role="menuitem"
              >
                <Receipt className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
                הוצאה
              </Link>
              <Link
                href="/dashboard/projects/new"
                onClick={() => setFabOpen(false)}
                className="flex min-h-12 w-full items-center justify-center gap-4 rounded-[32px] bg-orange-500 px-4 py-3 text-sm font-black text-white hover:bg-orange-600"
                role="menuitem"
              >
                <HardHat className="h-4 w-4 shrink-0" aria-hidden />
                פרויקט חדש
              </Link>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setFabOpen((o) => !o)}
            className="fixed bottom-6 end-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-900/50 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
            aria-expanded={fabOpen}
            aria-label="פתיחת תפריט הוספה מהירה"
          >
            <Plus className="h-8 w-8" strokeWidth={2.5} aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}
