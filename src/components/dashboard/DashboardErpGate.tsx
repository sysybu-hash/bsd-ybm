'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useCompany } from '@/context/CompanyContext';
import { isDeveloperErpExcluded } from '@/lib/developerRestrictions';
import DeveloperErpWall from '@/components/dashboard/DeveloperErpWall';
import DeveloperDashboardLite from '@/components/dashboard/DeveloperDashboardLite';

const ERP_PREFIXES = [
  '/dashboard/finance',
  '/dashboard/projects',
  '/dashboard/team',
  '/dashboard/import',
  '/dashboard/archive-search',
  '/dashboard/integrations',
  '/dashboard/contracts',
  '/dashboard/fleet',
  '/dashboard/settings/company',
  '/dashboard/settings/users',
  '/dashboard/settings/contracts',
  '/dashboard/settings/integrations',
  '/dashboard/settings/logs',
  '/dashboard/settings/sync-status',
  '/dashboard/scan',
];

function isErpPath(pathname: string): boolean {
  if (pathname === '/dashboard') return false;
  return ERP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function DashboardErpGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { isDeveloper, isMasterAdmin } = useCompany();
  const blocked = isDeveloperErpExcluded(isDeveloper, isMasterAdmin);

  if (!blocked) return <>{children}</>;

  if (pathname === '/dashboard') {
    return <DeveloperDashboardLite />;
  }

  if (isErpPath(pathname)) {
    return <DeveloperErpWall />;
  }

  return <>{children}</>;
}
