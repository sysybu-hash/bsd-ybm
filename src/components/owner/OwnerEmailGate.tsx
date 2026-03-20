'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { IS_OWNER } from '@/lib/ownerVault';
import { isFirebaseConfigured } from '@/lib/firebase';

/**
 * Hard client gate: only `sysybu@gmail.com` may render children.
 * Server APIs MUST still call `requireOwnerBearer` — never rely on UI alone.
 */
export default function OwnerEmailGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!IS_OWNER(user.email)) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (!isFirebaseConfigured() || loading || !user || !IS_OWNER(user.email)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#FDFDFD] p-12 text-sm text-gray-500" dir="rtl">
        בודק הרשאת בעלים…
      </div>
    );
  }

  return <>{children}</>;
}
