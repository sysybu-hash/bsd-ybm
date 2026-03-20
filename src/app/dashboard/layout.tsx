'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { dir } = useLocale();
  const { requiresCompanySelection, loading: companyLoading, companyId } = useCompany();
  const { user, loading: authLoading } = useAuth();
  const { timeoutMs } = useInactivityTimeoutMs(user?.uid ?? null, companyId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useInactivityTimer({
    enabled: Boolean(isFirebaseConfigured() && user && !authLoading),
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
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  return (
    <DashboardDiagnosticsProvider>
      <div
        className="flex min-h-dvh flex-col bg-[#FFFFFF] lg:h-screen lg:min-h-0"
        dir={dir}
      >
        {sidebarOpen && (
          <button
            type="button"
            aria-label="סגור תפריט"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-4 pt-safe px-safe">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-4xl text-white shadow-md transition-opacity active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent,#FF8C00)]"
            style={{
              backgroundColor: 'var(--brand-accent, #FF8C00)',
              boxShadow: '0 0 16px color-mix(in srgb, var(--brand-accent, #FF8C00) 45%, transparent)',
            }}
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
            aria-label={sidebarOpen ? 'סגור תפריט ניווט' : 'פתח תפריט ניווט'}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <DashboardBrandMark className="text-xl" />
          <span className="w-12 shrink-0" aria-hidden />
        </div>

        <aside
          id="dashboard-sidebar"
          className={`fixed inset-y-0 right-0 z-50 flex h-full w-[min(100vw-2rem,18rem)] max-w-[288px] flex-col gap-6 overflow-y-auto border-l border-gray-100 bg-white p-6 shadow-[10px_0_30px_rgba(0,0,0,0.08)] transition-transform duration-200 ease-out sm:w-72 sm:max-w-none sm:p-8 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="hidden items-center justify-between gap-4 sm:flex">
            <DashboardBrandMark />
          </div>

          <button
            type="button"
            className="mb-2 flex h-11 w-11 items-center justify-center self-end rounded-4xl border border-gray-100 text-gray-500 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent,#FF8C00)]"
            onClick={() => setSidebarOpen(false)}
            aria-label="סגור תפריט"
          >
            <X className="h-5 w-5" />
          </button>

          <CompanySwitcher />

          <LocaleSwitcher />

          <DashboardSidebarNav pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <DashboardStatusHeader />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <DashboardErpGate>{children}</DashboardErpGate>
          </main>
        </div>
      </div>
    </DashboardDiagnosticsProvider>
  );
}
