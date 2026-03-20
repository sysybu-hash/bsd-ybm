'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { CompanyProvider } from '@/context/CompanyContext';
import FloatingChat from '@/components/AI/FloatingChat';
import { DemoProvider } from '@/services/demo/DemoProvider';

/** AI chat and related surfaces only under `/dashboard` — root landing stays isolated. */
function DashboardFloatingChat() {
  const pathname = usePathname();
  if (!pathname?.startsWith('/dashboard')) return null;
  return <FloatingChat />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>
        <CompanyProvider>
          <DemoProvider>
            {children}
            <DashboardFloatingChat />
          </DemoProvider>
        </CompanyProvider>
      </LocaleProvider>
    </AuthProvider>
  );
}
