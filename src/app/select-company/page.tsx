'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useLocale } from '@/context/LocaleContext';
import Link from 'next/link';

export default function SelectCompanyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    companyOptions,
    loading,
    setCompanyId,
    requiresCompanySelection,
    hostTenantAccessDenied,
    hostLockedCompanyId,
  } = useCompany();
  const { t, dir } = useLocale();

  useEffect(() => {
    if (authLoading || loading) return;
    if (!user) return;
    if (!requiresCompanySelection && companyOptions.length > 0) {
      router.replace('/dashboard');
    }
  }, [authLoading, loading, user, requiresCompanySelection, companyOptions.length, router]);

  useEffect(() => {
    if (authLoading || loading || !user) return;
    if (companyOptions.length === 1) {
      setCompanyId(companyOptions[0].companyId);
      router.replace('/dashboard');
    }
  }, [authLoading, loading, user, companyOptions, setCompanyId, router]);

  if (authLoading || loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-[#FDFDFD] p-6 pt-safe pb-safe px-safe"
        dir={dir}
      >
        <p className="text-center text-sm text-gray-500">{t('select.loading')}</p>
      </div>
    );
  }

  if (user && hostTenantAccessDenied) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FDFDFD] p-6 pt-safe pb-safe px-safe"
        dir={dir}
      >
        <div
          className="flex w-full max-w-lg flex-col items-center justify-center gap-6 rounded-4xl border border-red-100 bg-white p-8 shadow-sm"
          style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.06)' }}
        >
          <Building2 className="h-10 w-10 text-red-600" aria-hidden />
          <h1 className="text-center text-xl font-black text-gray-900">{t('select.hostDeniedTitle')}</h1>
          <p className="text-center text-sm text-gray-600">{t('select.hostDeniedBody')}</p>
          {hostLockedCompanyId ? (
            <p className="rounded-4xl bg-gray-50 px-4 py-3 text-center font-mono text-xs text-gray-500" dir="ltr">
              {hostLockedCompanyId}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FDFDFD] p-6 pt-safe pb-safe px-safe"
        dir={dir}
      >
        <p className="text-center text-gray-600">{t('select.signIn')}</p>
        <Link
          href="/login"
          className="flex min-h-12 items-center justify-center rounded-4xl px-8 font-bold text-white"
          style={{
            backgroundColor: 'var(--brand-primary, #004694)',
            boxShadow: '0 0 24px var(--brand-glow, rgba(0,70,148,0.4))',
          }}
        >
          {t('select.loginCta')}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#FDFDFD] p-6 pt-safe pb-safe px-safe"
      dir={dir}
    >
      <div
        className="flex w-full max-w-lg flex-col items-center justify-center gap-6 rounded-4xl border border-white/50 bg-white/50 p-8 shadow-[0_12px_48px_rgba(0,0,0,0.08)] backdrop-blur-xl"
        style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.08), 0 0 40px var(--brand-glow, rgba(0,70,148,0.15))' }}
      >
        <div
          className="rounded-4xl p-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--brand-primary, #004694) 12%, white)',
            boxShadow: '0 0 28px var(--brand-glow, rgba(0,70,148,0.25))',
          }}
        >
          <Building2 className="h-10 w-10" style={{ color: 'var(--brand-primary, #004694)' }} aria-hidden />
        </div>
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <h1 className="text-2xl font-black" style={{ color: 'var(--brand-primary, #004694)' }}>
            {t('select.title')}
          </h1>
          <p className="text-xs font-bold tracking-widest text-gray-400">{t('select.subtitle')}</p>
          <p className="max-w-sm text-sm text-gray-600">{t('select.hint')}</p>
        </div>

        <ul className="flex w-full flex-col items-center justify-center gap-4">
          {companyOptions.map((c) => (
            <li key={c.companyId} className="w-full max-w-md">
              <button
                type="button"
                onClick={() => {
                  setCompanyId(c.companyId);
                  router.replace('/dashboard');
                }}
                className="flex min-h-14 w-full items-center justify-center rounded-4xl border border-gray-100 bg-white/90 px-6 text-center text-sm font-black text-[#1a1a1a] shadow-sm transition-all hover:border-[var(--brand-primary,#004694)]"
                style={{
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <span className="truncate">{c.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
