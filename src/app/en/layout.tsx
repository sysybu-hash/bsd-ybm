'use client';

import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'דשבורד' },
  { href: '/dashboard/projects', label: 'פרויקטים' },
  { href: '/en/payroll', label: 'מקאנו שכר' },
  { href: '/en/reports/location', label: 'דוחות אתר' },
  { href: '/en/settings', label: 'הגדרות' },
] as const;

export default function EnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#1a1a1a]" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-[#FDFDFD] shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 px-4 py-3 sm:justify-between sm:gap-6 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 font-black text-[#001A4D] hover:opacity-80"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[32px] text-xs font-black text-white shadow"
              style={{ background: 'linear-gradient(135deg,#001A4D 0%,#004694 100%)' }}
            >
              B
            </span>
            <span className="hidden text-base sm:block">BSD-YBM</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="ניווט ERP">
            {NAV.map(({ href, label }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-[32px] px-4 py-2 text-sm font-bold transition-colors ${
                    active
                      ? 'bg-[#004694]/10 text-[#004694]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#004694]'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-[32px] border border-[#004694]/30 bg-white px-4 py-2 text-xs font-bold text-[#004694] shadow-sm transition-colors hover:bg-[#004694]/5"
          >
            כניסה
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
}
