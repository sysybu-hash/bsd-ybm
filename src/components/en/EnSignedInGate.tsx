'use client';

import React, { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * ERP /en routes: require Firebase session (allowlist already enforced globally in AuthContext).
 */
export default function EnSignedInGate({ children }: { children: ReactNode }) {
  const { user, loading, allowlistPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || allowlistPending) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/en')}`);
    }
  }, [user, loading, allowlistPending, router]);

  if (loading || allowlistPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-[#FDFDFD] p-12 text-gray-500" dir="rtl">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" aria-hidden />
        <p className="text-center text-sm font-semibold">bsd-ybm · טוען סביבת עבודה…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-[#FDFDFD] p-12 text-gray-500" dir="rtl">
        <p className="text-center text-sm">מעבירים להתחברות…</p>
      </div>
    );
  }

  return <>{children}</>;
}
