'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useCompany } from '@/context/CompanyContext';
import { GOLDEN_HELIX_LOGO_SVG } from '@/lib/brandingAssets';

/**
 * Sidebar / mobile header: tenant `company.logoUrl` when set; else Golden Helix (image_8).
 */
export default function DashboardBrandMark({ className = '' }: { className?: string }) {
  const { companyId, tenantBranding } = useCompany();

  const logo = useMemo(() => {
    const u = tenantBranding.logoUrl?.trim();
    return u || null;
  }, [tenantBranding.logoUrl]);

  const linkClass = `flex flex-col items-center justify-center rounded-[32px] px-2 transition-opacity active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent,#FF8C00)] ${className}`;

  if (logo && companyId) {
    return (
      <Link href="/dashboard" className={linkClass} aria-label="דשבורד">
        <img src={logo} alt="" className="mx-auto h-12 max-h-12 w-auto max-w-[200px] object-contain" />
      </Link>
    );
  }

  return (
    <Link href="/dashboard" className={linkClass} aria-label="BSD-YBM">
      <img
        src={GOLDEN_HELIX_LOGO_SVG}
        alt=""
        className="mx-auto h-12 w-12 object-contain"
        width={48}
        height={48}
      />
      <span className="mt-1 text-center text-[10px] font-black leading-tight text-[#001A4D]">BSD-YBM</span>
    </Link>
  );
}
