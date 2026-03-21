'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Upload, X } from 'lucide-react';
import CompanySwitcher from '@/components/CompanySwitcher';
import LocaleSwitcher from '@/components/dashboard/LocaleSwitcher';
import { DashboardDiagnosticsProvider } from '@/context/DashboardDiagnosticsContext';
import DashboardStatusHeader from '@/components/dashboard/DashboardStatusHeader';
import DashboardSidebarNav from '@/components/dashboard/DashboardSidebarNav';
import DashboardErpGate from '@/components/dashboard/DashboardErpGate';
import DashboardBrandMark from '@/components/dashboard/DashboardBrandMark';
import { useCompany } from '@/context/CompanyContext';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useInactivityTimeoutMs } from '@/hooks/useInactivityTimeoutMs';

/** Slim Meuhedet-style top bar — desktop only, shows above status header */
function DesktopTopBar() {
  const { user } = useAuth();
  const { companyId, companies } = useCompany();
  const companyLabel =
    companies.find((c) => c.companyId === companyId)?.displayName ?? 'BSD-YBM';
  const initials = (user?.displayName ?? user?.email ?? 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="hidden lg:flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-white px-8 py-2.5">
      <span className="text-xs font-semibold text-gray-400 tracking-wide">{companyLabel}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 hidden sm:block">{user?.email ?? ''}</span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg,#001A4D 0%,#004694 100%)' }}
          aria-hidden
        >
          {initials || 'U'}
        </span>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { dir } = useLocale();
  const { requiresCompanySelection, loading: companyLoading, companyId } = useCompany();
  const { user, loading: authLoading, allowlistPending } = useAuth();
  const { timeoutMs } = useInactivityTimeoutMs(user?.uid ?? null, companyId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useInactivityTimer({
    enabled: Boolean(isFirebaseConfigured() && user && !authLoading && !allowlistPending),
    timeoutMs,
    onInactive: () => {
      window.location.assign('/');
    },
  });

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (companyLoading) return;
    if (requiresCompanySelection) {
      router.replace('/select-company');
    }
  }, [companyLoading, requiresCompanySelection, router]);

  /** Client-side auth guard (Firebase session is not in cookies — proxy cannot verify JWT). */
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (authLoading || allowlistPending) return;
    if (!user) {
      router.replace('/login');
    }
  }, [authLoading, allowlistPending, user, router]);

  if (isFirebaseConfigured() && user && (authLoading || allowlistPending)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white" dir={dir}>
        <div className="h-12 w-12 animate-pulse rounded-4xl border border-gray-200 bg-gray-50" aria-hidden />
        <span className="sr-only">בודק הרשאות…</span>
      </div>
    );
  }

  return (
    <DashboardDiagnosticsProvider>
      <div
        className="flex min-h-dvh bg-[#F4F5F7] lg:h-screen lg:min-h-0"
        dir={dir}
      >
        {/* ── Mobile overlay backdrop ── */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="סגור תפריט"
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ══════════════════════════════════════
            PERMANENT DESKTOP SIDEBAR (left)
        ══════════════════════════════════════ */}
        <aside
          id="dashboard-sidebar-desktop"
          className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:gap-4 lg:overflow-y-auto lg:border-r lg:border-gray-100 lg:bg-white lg:p-6 lg:shadow-sm"
          style={{ minHeight: '100vh' }}
        >
          <div className="mb-1 flex flex-col items-center gap-2 px-1">
            <DashboardBrandMark />
            {/* Upload from File — link to company branding/logo settings */}
            <Link
              href="/dashboard/settings/company"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 px-3 py-2 text-xs font-semibold text-gray-400 transition-colors hover:border-[#004694] hover:text-[#004694] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
              title="הוסף/החלף לוגו חברה"
            >
              <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
              הוספה מקובץ
            </Link>
          </div>
          <CompanySwitcher />
          <LocaleSwitcher />
          <DashboardSidebarNav pathname={pathname} onNavigate={() => {}} />
        </aside>

        {/* ══════════════════════════════════════
            MOBILE SIDEBAR (slide-in overlay)
        ══════════════════════════════════════ */}
        <aside
          id="dashboard-sidebar"
          className={`fixed inset-y-0 right-0 z-50 flex h-full w-[min(100vw-2rem,18rem)] flex-col gap-4 overflow-y-auto border-l border-gray-100 bg-white p-6 shadow-xl transition-transform duration-200 ease-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <DashboardBrandMark />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 text-gray-500 active:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
              aria-label="סגור תפריט"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CompanySwitcher />
          <LocaleSwitcher />
          <DashboardSidebarNav pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </aside>

        {/* ══════════════════════════════════════
            MAIN CONTENT AREA
        ══════════════════════════════════════ */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Mobile top bar */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-3 pt-safe px-safe lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-opacity active:opacity-90"
              style={{ backgroundColor: 'var(--brand-accent, #FF8C00)' }}
              aria-expanded={sidebarOpen}
              aria-controls="dashboard-sidebar"
              aria-label={sidebarOpen ? 'סגור תפריט ניווט' : 'פתח תפריט ניווט'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <DashboardBrandMark className="text-lg" />
            <span className="w-11 shrink-0" aria-hidden />
          </div>

          <DesktopTopBar />
          <DashboardStatusHeader />

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white">
            <DashboardErpGate>{children}</DashboardErpGate>
          </main>

          {/* ── Floating action buttons (bottom-right) ── */}
          <div className="fixed bottom-6 right-6 z-30 flex flex-col items-center gap-3" dir="ltr">
            {/* Blue scan bubble */}
            <a
              href="/scan"
              title="מרכז סריקה"
              className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
              style={{ backgroundColor: '#004694', boxShadow: '0 4px 20px rgba(0,70,148,0.45)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>
              </svg>
            </a>
            {/* Orange floating action button */}
            <a
              href="/dashboard/projects/new"
              title="פרויקט חדש"
              className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
              style={{ backgroundColor: '#FF8C00', boxShadow: '0 4px 24px rgba(255,140,0,0.5)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </DashboardDiagnosticsProvider>
  );
}
