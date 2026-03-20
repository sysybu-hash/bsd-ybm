'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { GOLDEN_HELIX_LOGO_SVG } from '@/lib/brandingAssets';

/**
 * Golden Helix + “מנהל מאומת” for the three master emails (+ NEXT_PUBLIC_ADMIN_EMAILS).
 */
export default function AdminVerifiedBadge({ className = '' }: { className?: string }) {
  const isAdmin = usePlatformAdmin();
  if (!isAdmin) return null;

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 rounded-[32px] border border-amber-200/90 bg-gradient-to-l from-amber-50/95 to-white px-3 py-1.5 text-[10px] font-black text-[#6b5a1a] shadow-sm sm:text-xs ${className}`}
      dir="rtl"
      title="מנהל פלטפורמה מאומת"
    >
      <img src={GOLDEN_HELIX_LOGO_SVG} alt="" className="h-6 w-6 shrink-0 object-contain" width={24} height={24} />
      <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <span className="whitespace-nowrap">מנהל מאומת</span>
    </span>
  );
}
