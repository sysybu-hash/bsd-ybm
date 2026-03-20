'use client';

import React from 'react';
import { Building2, ChevronDown, Eye, LogOut } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { useLocale } from '@/context/LocaleContext';

export default function CompanySwitcher() {
  const { t, dir } = useLocale();
  const {
    companyId,
    selectedCompanyId,
    companyOptions,
    loading,
    isCompanyAdmin,
    isGlobalStaff,
    isImpersonating,
    isHostTenantLocked,
    hostTenantAccessDenied,
    setCompanyId,
    exitCompanyImpersonation,
  } = useCompany();

  if (loading || !companyId || companyOptions.length === 0) return null;

  const canSwitch =
    (isCompanyAdmin || isGlobalStaff) && !isHostTenantLocked && !hostTenantAccessDenied;
  const effective = companyOptions.find((c) => c.companyId === companyId);
  const switcherValue = selectedCompanyId ?? companyId;

  if (!canSwitch) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        {isImpersonating && (
          <div
            className="flex w-full max-w-sm flex-col items-center justify-center gap-4 rounded-4xl border px-4 py-3 text-center"
            style={{
              borderColor: 'var(--brand-primary, #004694)',
              boxShadow: '0 0 20px var(--brand-glow, rgba(0,70,148,0.25))',
              backgroundColor: '#FDFDFD',
            }}
          >
            <Eye className="h-4 w-4" style={{ color: 'var(--brand-primary, #004694)' }} aria-hidden />
            <span className="text-xs font-bold text-gray-700">צופה כ: {effective?.displayName ?? companyId}</span>
            <button
              type="button"
              onClick={() => exitCompanyImpersonation()}
              className="flex min-h-12 w-full max-w-[200px] items-center justify-center gap-2 rounded-4xl px-4 text-sm font-bold text-white"
              style={{
                backgroundColor: 'var(--brand-accent, #FF8C00)',
                boxShadow: '0 0 16px var(--brand-glow, rgba(0,70,148,0.35))',
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              יציאה מצפייה
            </button>
          </div>
        )}
        {isHostTenantLocked && (
          <p className="max-w-sm text-center text-xs font-bold text-gray-500" dir={dir}>
            {t('company.hostLockedHint')}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 rounded-4xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <Building2 className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-accent, #FF8C00)' }} />
          <span className="text-center text-sm font-medium text-gray-700">
            {effective?.displayName ?? companyId}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center gap-4">
      {isImpersonating && (
        <div
          className="flex w-full max-w-sm flex-col items-center justify-center gap-4 rounded-4xl border px-4 py-3 text-center"
          style={{
            borderColor: 'var(--brand-primary, #004694)',
            boxShadow: '0 0 20px var(--brand-glow, rgba(0,70,148,0.25))',
            backgroundColor: '#FDFDFD',
          }}
        >
          <Eye className="h-4 w-4" style={{ color: 'var(--brand-primary, #004694)' }} aria-hidden />
          <p className="text-xs font-bold text-gray-700">
            מצב צפייה: <span dir="ltr">{effective?.displayName ?? companyId}</span>
          </p>
          <button
            type="button"
            onClick={() => exitCompanyImpersonation()}
            className="flex min-h-12 w-full max-w-[220px] items-center justify-center gap-2 rounded-4xl px-4 text-sm font-bold text-white"
            style={{
              backgroundColor: 'var(--brand-accent, #FF8C00)',
              boxShadow: '0 0 16px var(--brand-glow, rgba(0,70,148,0.35))',
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            חזרה לזהות מפתח
          </button>
        </div>
      )}

      <div className="relative flex items-center justify-center">
        <label className="sr-only" htmlFor="company-switcher">
          Company Switcher
        </label>
        <div className="flex items-center justify-center gap-2 rounded-4xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <Building2 className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-accent, #FF8C00)' }} />
          <select
            id="company-switcher"
            value={switcherValue}
            onChange={(e) => setCompanyId(e.target.value)}
            className="appearance-none bg-transparent pr-6 text-center text-sm font-medium text-gray-700 outline-none"
          >
            {companyOptions.map((company) => (
              <option key={company.companyId} value={company.companyId}>
                {company.displayName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none -mr-5 h-4 w-4 shrink-0 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
