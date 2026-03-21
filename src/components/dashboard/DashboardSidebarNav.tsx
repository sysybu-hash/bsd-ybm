'use client';

import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  HardHat,
  Wallet,
  ScanLine,
  Users,
  Plug,
  Shield,
  Settings2,
  Settings,
  Gauge,
  Upload,
  Search,
  FileText,
  Building2,
  FileSignature,
  Store,
  Lock,
  Crown,
  Bot,
  Plus,
  CircleDollarSign,
  TrendingUp,
  Receipt,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { isDeveloperErpExcluded } from '@/lib/developerRestrictions';
import { IS_OWNER } from '@/lib/ownerVault';
import { useLocale } from '@/context/LocaleContext';
import { useSectorUi } from '@/hooks/useSectorUi';
import { useSubscription } from '@/hooks/useSubscription';
import { PLAN_FEATURES } from '@/types/subscription';

type NavIcon = typeof LayoutDashboard;

type NavItem = {
  href: string;
  icon: NavIcon;
  label: string;
};

const navInactive =
  'flex min-h-12 items-center justify-center gap-4 rounded-4xl px-5 py-4 text-gray-500 transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent,#FF8C00)]';
const navActive =
  'flex min-h-12 items-center justify-center gap-4 rounded-4xl px-5 py-4 text-white shadow-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

function navHrefIsActive(pathname: string, href: string, showroomActive: boolean): boolean {
  if (href === '/?mode=showroom') return showroomActive;
  const pathOnly = href.split('?')[0];
  const norm = pathname.replace(/\/$/, '') || '/';
  const hrefNorm = pathOnly.replace(/\/$/, '') || '/';
  if (hrefNorm === '/dashboard') {
    return norm === '/dashboard';
  }
  if (hrefNorm === '/dashboard/settings') {
    return norm === '/dashboard/settings' || norm.startsWith('/dashboard/settings/');
  }
  if (hrefNorm === '/dashboard/finance') {
    return norm === '/dashboard/finance';
  }
  if (
    hrefNorm === '/en/payroll' ||
    hrefNorm === '/en/settings' ||
    hrefNorm === '/en/reports/location'
  ) {
    return norm === hrefNorm;
  }
  return norm === hrefNorm || norm.startsWith(`${hrefNorm}/`);
}

function DashboardSidebarNavFallback() {
  return (
    <nav className="flex flex-col gap-4" aria-busy="true" aria-label="טוען תפריט">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-4xl bg-gray-100" />
      ))}
    </nav>
  );
}

function DashboardSidebarNavInner({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { companyId, companies, isDeveloper, isMasterAdmin, isCompanyAdmin, isGlobalStaff } = useCompany();
  const { t } = useLocale();
  const { navProjectsLabel, navTeamLabel, moduleEnabled } = useSectorUi();
  const { plan, meckanoModuleEnabled } = useSubscription();
  const featureSet = PLAN_FEATURES[plan];
  const erpExcluded = isDeveloperErpExcluded(isDeveloper, isMasterAdmin);
  const showOwnerVault = IS_OWNER(user?.email);

  const isClientForSelected =
    Boolean(companyId) && companies.some((c) => c.companyId === companyId && c.role === 'client');

  const { primaryErpNav, secondaryNavItems } = useMemo(() => {
    if (erpExcluded) {
      const devNav: NavItem[] = [
        { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
        { href: '/?mode=showroom', icon: Store, label: t('nav.showroom') },
        { href: '/dashboard/settings/security', icon: Lock, label: t('nav.settings.security') },
      ];
      if (isDeveloper || isMasterAdmin) {
        devNav.push({ href: '/dashboard/developer', icon: Shield, label: t('nav.developer') });
      }
      return { primaryErpNav: [] as NavItem[], secondaryNavItems: devNav };
    }

    if (isClientForSelected) {
      const primary: NavItem[] = [
        { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
        { href: '/dashboard/projects', icon: HardHat, label: navProjectsLabel },
        { href: '/dashboard/contracts', icon: FileSignature, label: t('nav.contractsSigningRoom') },
        { href: '/en/settings', icon: Settings, label: t('nav.settingsHub') },
      ];
      const secondary: NavItem[] = [
        { href: '/?mode=showroom', icon: Store, label: t('nav.showroom') },
        { href: '/dashboard/settings/security', icon: Lock, label: t('nav.settings.security') },
      ];
      return { primaryErpNav: primary, secondaryNavItems: secondary };
    }

    const primary: NavItem[] = [
      { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      { href: '/dashboard/projects', icon: HardHat, label: navProjectsLabel },
      { href: '/en/payroll', icon: CircleDollarSign, label: t('nav.payroll') },
      { href: '/en/reports/location', icon: MapPin, label: t('nav.reports') },
      { href: '/en/settings', icon: Settings, label: t('nav.settingsHub') },
    ];

    const secondaryCore: NavItem[] = [
      { href: '/?mode=showroom', icon: Store, label: t('nav.showroom') },
      { href: '/dashboard/settings/security', icon: Lock, label: t('nav.settings.security') },
      { href: '/dashboard/finance/budget-actual', icon: Wallet, label: t('nav.budgetActual') },
      { href: '/dashboard/finance', icon: TrendingUp, label: t('nav.executiveFinance') },
      { href: '/dashboard/finance/expenses', icon: Receipt, label: t('nav.expenseLog') },
      { href: '/dashboard/import', icon: Upload, label: t('nav.import') },
      { href: '/dashboard/team', icon: Users, label: navTeamLabel },
      { href: '/scan', icon: ScanLine, label: t('nav.scan') },
      { href: '/dashboard/archive-search', icon: Search, label: t('nav.archiveSearch') },
      { href: '/dashboard/integrations', icon: Plug, label: t('nav.integrations') },
    ];

    const filtered = secondaryCore.filter((item) => {
      if (item.href === '/dashboard/import') {
        return featureSet.has('finance_dashboard') && (isCompanyAdmin || isGlobalStaff);
      }
      if (item.href === '/dashboard/finance') return featureSet.has('finance_dashboard');
      if (item.href === '/dashboard/finance/expenses') return true;
      if (item.href === '/scan') return featureSet.has('multi_engine_scan');
      if (item.href === '/dashboard/archive-search') return featureSet.has('multi_engine_scan');
      if (item.href === '/dashboard/team' && (!meckanoModuleEnabled || !moduleEnabled('showMeckanoTeam')))
        return false;
      return true;
    });

    let next = filtered;
    if (isCompanyAdmin) {
      next = [
        ...next,
        {
          href: '/dashboard/settings/integrations',
          icon: Settings2,
          label: t('nav.settings.integrations'),
        },
        {
          href: '/dashboard/settings/contracts',
          icon: FileText,
          label: t('nav.settings.contracts'),
        },
        {
          href: '/dashboard/settings/company',
          icon: Building2,
          label: t('nav.settings.company'),
        },
      ];
    }
    if (isGlobalStaff) {
      next = [...next, { href: '/dashboard/fleet', icon: Gauge, label: t('nav.fleet') }];
    }
    if (isDeveloper || isMasterAdmin) {
      next = [...next, { href: '/dashboard/developer', icon: Shield, label: t('nav.developer') }];
    }
    return { primaryErpNav: primary, secondaryNavItems: next };
  }, [
    t,
    navProjectsLabel,
    navTeamLabel,
    moduleEnabled,
    meckanoModuleEnabled,
    featureSet,
    isCompanyAdmin,
    isDeveloper,
    isMasterAdmin,
    isGlobalStaff,
    companyId,
    companies,
    erpExcluded,
    isClientForSelected,
  ]);

  const showroomActive = pathname === '/' && searchParams.get('mode') === 'showroom';

  return (
    <nav className="flex flex-col gap-3">
      {showOwnerVault && (
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/owner-zone"
            onClick={() => onNavigate?.()}
            className={
              pathname === '/dashboard/owner-zone'
                ? `${navActive} text-white`
                : 'flex min-h-12 items-center justify-center gap-4 rounded-4xl border-2 border-[#c9a227]/60 bg-gradient-to-br from-[#fff9e6] to-[#f5e6a8] px-5 py-4 text-[#6b5a1a] shadow-[0_0_20px_rgba(201,162,39,0.35)] transition-colors hover:border-[#c9a227] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227]'
            }
            style={
              pathname === '/dashboard/owner-zone'
                ? {
                    background: 'linear-gradient(135deg, #c9a227, #8a6d1b)',
                    boxShadow: '0 0 24px rgba(201, 162, 39, 0.45)',
                  }
                : undefined
            }
          >
            <Crown
              size={22}
              className={pathname === '/dashboard/owner-zone' ? 'shrink-0 text-white' : 'shrink-0 text-[#b8860b]'}
              aria-hidden
            />
            <span className="font-black">{t('nav.ownerVault')}</span>
          </Link>
          <Link
            href="/dashboard/owner-only/ai-coder"
            onClick={() => onNavigate?.()}
            className={
              pathname.startsWith('/dashboard/owner-only')
                ? `${navActive} text-white`
                : 'flex min-h-12 items-center justify-center gap-4 rounded-4xl border-2 border-[#004694]/25 bg-[#004694]/5 px-5 py-4 text-[#004694] transition-colors hover:border-[#004694]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]'
            }
            style={
              pathname.startsWith('/dashboard/owner-only')
                ? { backgroundColor: '#004694', boxShadow: '0 0 20px rgba(0, 70, 148, 0.35)' }
                : undefined
            }
          >
            <Bot
              size={22}
              className={pathname.startsWith('/dashboard/owner-only') ? 'shrink-0 text-white' : 'shrink-0'}
              aria-hidden
            />
            <span className="font-black">{t('nav.ownerAiCoder')}</span>
          </Link>
        </div>
      )}
      {Boolean(companyId) && !isClientForSelected && !erpExcluded && (
        <Link
          href="/dashboard/projects/new"
          onClick={() => onNavigate?.()}
          className="flex min-h-12 items-center justify-center gap-4 rounded-4xl border-2 border-[#004694]/40 bg-[#004694] px-5 py-4 font-black text-white shadow-[0_8px_24px_rgba(0,70,148,0.35)] transition-colors hover:border-[#004694] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
        >
          <Plus size={22} aria-hidden />
          <span>{t('nav.createProject')}</span>
        </Link>
      )}

      {primaryErpNav.map((item) => {
        const isActive = navHrefIsActive(pathname, item.href, showroomActive);
        return (
          <Link
            key={`primary-${item.href}`}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={isActive ? navActive : navInactive}
            style={
              isActive
                ? {
                    backgroundColor: 'var(--brand-accent, #FF8C00)',
                    boxShadow: '0 0 20px color-mix(in srgb, var(--brand-accent, #FF8C00) 40%, transparent)',
                  }
                : undefined
            }
          >
            <item.icon size={22} aria-hidden />
            <span className="font-bold">{item.label}</span>
          </Link>
        );
      })}

      {!erpExcluded && secondaryNavItems.length > 0 && (
        <div
          className="flex min-h-10 items-center justify-center rounded-4xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-gray-400"
          role="presentation"
        >
          {t('nav.moreTools')}
        </div>
      )}

      {secondaryNavItems.map((item) => {
        const isActive = navHrefIsActive(pathname, item.href, showroomActive);
        return (
          <Link
            key={`sec-${item.href}`}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={isActive ? navActive : navInactive}
            style={
              isActive
                ? {
                    backgroundColor: 'var(--brand-accent, #FF8C00)',
                    boxShadow: '0 0 20px color-mix(in srgb, var(--brand-accent, #FF8C00) 40%, transparent)',
                  }
                : undefined
            }
          >
            <item.icon size={22} aria-hidden />
            <span className="font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardSidebarNav(props: { pathname: string; onNavigate?: () => void }) {
  return (
    <Suspense fallback={<DashboardSidebarNavFallback />}>
      <DashboardSidebarNavInner {...props} />
    </Suspense>
  );
}
