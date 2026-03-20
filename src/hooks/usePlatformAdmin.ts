'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isPlatformAdminEmail } from '@/lib/auth/adminGuard';

export function usePlatformAdmin(): boolean {
  const { user } = useAuth();
  return useMemo(() => isPlatformAdminEmail(user?.email ?? null), [user?.email]);
}
