'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { subscribeUserCompanies, subscribeTenantCompanyDirectory } from '@/services/firestore/companyService';
import type { CompanyMembership } from '@/types/multitenant';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { hexToGlow } from '@/lib/brandingCss';
import { getSectorPreset, normalizeCompanySector } from '@/config/sectorConfigs';
import { clearCompanyCookie, readHostTenantLock, syncCompanyCookie } from '@/lib/companyCookie';
import { isMasterAdminUser } from '@/lib/platformOwners';

const STORAGE_KEY = 'bsd-ybm:selectedCompanyId';
const LEGACY_COMPANY_STORAGE_KEY = 'buildai:selectedCompanyId';

function readPersistedCompanySelection(): string | null {
  if (typeof window === 'undefined') return null;
  const next = localStorage.getItem(STORAGE_KEY);
  if (next) return next;
  const legacy = localStorage.getItem(LEGACY_COMPANY_STORAGE_KEY);
  if (legacy) {
    try {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_COMPANY_STORAGE_KEY);
    } catch {
      /* ignore quota */
    }
    return legacy;
  }
  return null;
}

export type TenantCompanyOption = { companyId: string; displayName: string };

type CompanyContextValue = {
  /** Effective tenant for Firestore reads (impersonation ?? switcher). */
  companyId: string | null;
  /** Switcher selection without developer impersonation. */
  selectedCompanyId: string | null;
  /** Developer-only: viewing dashboard as another tenant. */
  impersonationCompanyId: string | null;
  isImpersonating: boolean;
  enterCompanyImpersonation: (targetCompanyId: string) => void;
  exitCompanyImpersonation: () => void;
  companies: CompanyMembership[];
  /** All companies (global staff) or same as mapped memberships */
  companyOptions: TenantCompanyOption[];
  staffDirectory: TenantCompanyOption[];
  loading: boolean;
  systemRole: string | null;
  isDeveloper: boolean;
  isGlobalManager: boolean;
  /** Master admin (SYSYBU@GMAIL.COM allow-list or systemRole master_admin). */
  isMasterAdmin: boolean;
  isGlobalStaff: boolean;
  /** Company admin OR global staff */
  isCompanyAdmin: boolean;
  /** Can open user approval UI */
  canManageRegistrations: boolean;
  setCompanyId: (companyId: string) => void;
  /** True when user must pick a tenant (multi-company, no valid saved choice). */
  requiresCompanySelection: boolean;
  /** Custom domain (`TENANT_HOST_MAP`) — tenant is fixed for non–global-staff users. */
  isHostTenantLocked: boolean;
  hostLockedCompanyId: string | null;
  /** Logged-in user is not a member of the hostname-mapped company. */
  hostTenantAccessDenied: boolean;
  /** White-label snapshot for sidebar / client surfaces (from company + branding/theme). */
  tenantBranding: TenantBrandingSnapshot;
};

export type TenantBrandingSnapshot = {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

const DEFAULT_TENANT_BRANDING: TenantBrandingSnapshot = (() => {
  const bp = getSectorPreset('CONSTRUCTION').brandingPalette;
  return {
    logoUrl: null,
    primaryColor: bp.primary,
    secondaryColor: bp.secondary,
  };
})();

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function useCompany(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    return {
      companyId: null,
      selectedCompanyId: null,
      impersonationCompanyId: null,
      isImpersonating: false,
      enterCompanyImpersonation: () => {},
      exitCompanyImpersonation: () => {},
      companies: [],
      companyOptions: [],
      staffDirectory: [],
      loading: false,
      systemRole: null,
      isDeveloper: false,
      isGlobalManager: false,
      isMasterAdmin: false,
      isGlobalStaff: false,
      isCompanyAdmin: false,
      canManageRegistrations: false,
      setCompanyId: () => {},
      requiresCompanySelection: false,
      isHostTenantLocked: false,
      hostLockedCompanyId: null,
      hostTenantAccessDenied: false,
      tenantBranding: DEFAULT_TENANT_BRANDING,
    };
  }
  return ctx;
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [staffDirectory, setStaffDirectory] = useState<TenantCompanyOption[]>([]);
  const [systemRole, setSystemRole] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [impersonationCompanyId, setImpersonationCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantBranding, setTenantBranding] = useState<TenantBrandingSnapshot>(DEFAULT_TENANT_BRANDING);
  const [hostLock, setHostLock] = useState(() =>
    typeof window !== 'undefined' ? readHostTenantLock() : { locked: false, companyId: null as string | null }
  );

  const isDeveloper = systemRole === 'developer';
  const isGlobalManager = systemRole === 'global_manager';
  const isMasterAdmin = isMasterAdminUser({
    email: user?.email ?? null,
    systemRole,
  });
  const isGlobalStaff = isDeveloper || isGlobalManager || isMasterAdmin;

  useEffect(() => {
    setHostLock(readHostTenantLock());
  }, []);

  const companyId = impersonationCompanyId ?? selectedCompanyId;
  const isImpersonating = Boolean(isDeveloper && impersonationCompanyId);

  const isHostTenantLocked = Boolean(
    hostLock.locked && hostLock.companyId && !isGlobalStaff
  );
  const hostLockedCompanyId = isHostTenantLocked ? hostLock.companyId : null;

  const enterCompanyImpersonation = useCallback(
    (targetCompanyId: string) => {
      if (!isDeveloper || !targetCompanyId.trim()) return;
      const allowed = new Set(staffDirectory.map((c) => c.companyId));
      if (!allowed.has(targetCompanyId)) return;
      setImpersonationCompanyId(targetCompanyId);
    },
    [isDeveloper, staffDirectory]
  );

  const exitCompanyImpersonation = useCallback(() => {
    setImpersonationCompanyId(null);
  }, []);

  useEffect(() => {
    if (authLoading || !user || !isFirebaseConfigured()) {
      setSystemRole(null);
      return;
    }
    const ref = doc(getDb(), 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setSystemRole(null);
        return;
      }
      const sr = snap.data()?.systemRole;
      setSystemRole(typeof sr === 'string' ? sr : null);
    });
    return () => unsub();
  }, [user, authLoading]);

  useEffect(() => {
    if (!isDeveloper) {
      setImpersonationCompanyId(null);
    }
  }, [isDeveloper]);

  useEffect(() => {
    if (!impersonationCompanyId || staffDirectory.length === 0) return;
    const ok = staffDirectory.some((c) => c.companyId === impersonationCompanyId);
    if (!ok) setImpersonationCompanyId(null);
  }, [staffDirectory, impersonationCompanyId]);

  useEffect(() => {
    if (authLoading || !user || !isFirebaseConfigured() || !isGlobalStaff) {
      setStaffDirectory([]);
      return;
    }
    return subscribeTenantCompanyDirectory(
      (rows) => setStaffDirectory(rows),
      () => setStaffDirectory([])
    );
  }, [user, authLoading, isGlobalStaff]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isFirebaseConfigured()) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeUserCompanies(
      user.uid,
      (next) => {
        setCompanies(next);
        setLoading(false);
      },
      () => {
        setCompanies([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, authLoading]);

  useEffect(() => {
    const root = typeof document !== 'undefined' ? document.documentElement : null;
    const resetBranding = () => {
      if (!root) return;
      const def = getSectorPreset('CONSTRUCTION').brandingPalette;
      root.style.setProperty('--brand-primary', def.primary);
      root.style.setProperty('--brand-secondary', def.secondary);
      root.style.setProperty('--brand-accent', '#FF8C00');
      root.style.setProperty('--brand-glow', hexToGlow(def.primary, 0.45));
      setTenantBranding({
        logoUrl: null,
        primaryColor: def.primary,
        secondaryColor: def.secondary,
      });
    };

    if (!companyId || !isFirebaseConfigured() || authLoading) {
      resetBranding();
      return undefined;
    }

    const db = getDb();
    const cref = doc(db, 'companies', companyId);
    const bref = doc(db, 'companies', companyId, 'branding', 'theme');

    let rootData: Record<string, unknown> | null = null;
    let themeData: Record<string, unknown> | null = null;

    const apply = () => {
      if (!root) return;
      const sector = normalizeCompanySector(rootData?.sector);
      const palette = getSectorPreset(sector).brandingPalette;
      const p =
        (typeof themeData?.primaryColor === 'string' && themeData.primaryColor
          ? themeData.primaryColor
          : null) ||
        (typeof rootData?.primaryColor === 'string' && rootData.primaryColor ? rootData.primaryColor : null) ||
        palette.primary;
      const s =
        (typeof themeData?.secondaryColor === 'string' && themeData.secondaryColor
          ? themeData.secondaryColor
          : null) ||
        (typeof rootData?.secondaryColor === 'string' && rootData.secondaryColor ? rootData.secondaryColor : null) ||
        palette.secondary;
      root.style.setProperty('--brand-primary', p);
      root.style.setProperty('--brand-secondary', s);
      root.style.setProperty('--brand-accent', '#FF8C00');
      root.style.setProperty('--brand-glow', hexToGlow(p, 0.45));

      const logoRaw =
        (typeof themeData?.companyLogoUrl === 'string' && themeData.companyLogoUrl.trim()
          ? themeData.companyLogoUrl
          : null) ||
        (typeof rootData?.companyLogoUrl === 'string' && rootData.companyLogoUrl.trim()
          ? rootData.companyLogoUrl
          : null) ||
        (typeof rootData?.logoUrl === 'string' && rootData.logoUrl.trim() ? rootData.logoUrl : null) ||
        '';
      setTenantBranding({
        logoUrl: logoRaw.trim() || null,
        primaryColor: p,
        secondaryColor: s,
      });
    };

    const unsubRoot = onSnapshot(
      cref,
      (snap) => {
        rootData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
        apply();
      },
      () => resetBranding()
    );

    const unsubTheme = onSnapshot(
      bref,
      (snap) => {
        themeData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
        apply();
      },
      () => {
        themeData = null;
        apply();
      }
    );

    return () => {
      unsubRoot();
      unsubTheme();
      resetBranding();
    };
  }, [companyId, authLoading]);

  const companyOptions: TenantCompanyOption[] = useMemo(() => {
    if (isGlobalStaff && staffDirectory.length > 0) {
      return staffDirectory;
    }
    return companies.map((c) => ({
      companyId: c.companyId,
      displayName: c.displayName,
    }));
  }, [isGlobalStaff, staffDirectory, companies]);

  const hostTenantAccessDenied = useMemo(() => {
    if (!hostLockedCompanyId || !user) return false;
    const available = new Set(companyOptions.map((c) => c.companyId));
    return !available.has(hostLockedCompanyId);
  }, [hostLockedCompanyId, user, companyOptions]);

  const requiresCompanySelection = useMemo(() => {
    if (authLoading || loading || !user) return false;
    if (impersonationCompanyId) return false;
    if (hostTenantAccessDenied) return true;
    if (hostLockedCompanyId) return false;
    if (companyOptions.length <= 1) return false;
    const persisted = readPersistedCompanySelection();
    const available = new Set(companyOptions.map((c) => c.companyId));
    if (persisted && available.has(persisted)) return false;
    return true;
  }, [
    authLoading,
    loading,
    user,
    companyOptions,
    impersonationCompanyId,
    hostLockedCompanyId,
    hostTenantAccessDenied,
  ]);

  useEffect(() => {
    if (authLoading || loading) return;
    if (!user) {
      setSelectedCompanyId(null);
      clearCompanyCookie();
      return;
    }
    const options = companyOptions;
    if (options.length === 0) {
      setSelectedCompanyId(null);
      clearCompanyCookie();
      return;
    }
    const available = new Set(options.map((c) => c.companyId));

    if (hostLockedCompanyId) {
      if (available.has(hostLockedCompanyId)) {
        setSelectedCompanyId(hostLockedCompanyId);
        localStorage.setItem(STORAGE_KEY, hostLockedCompanyId);
        syncCompanyCookie(hostLockedCompanyId);
        return;
      }
      setSelectedCompanyId(null);
      clearCompanyCookie();
      return;
    }

    const persisted = readPersistedCompanySelection();
    if (persisted && available.has(persisted)) {
      setSelectedCompanyId(persisted);
      syncCompanyCookie(persisted);
      return;
    }
    if (options.length === 1) {
      const only = options[0].companyId;
      setSelectedCompanyId(only);
      localStorage.setItem(STORAGE_KEY, only);
      syncCompanyCookie(only);
      return;
    }
    setSelectedCompanyId(null);
    clearCompanyCookie();
  }, [authLoading, loading, user, companyOptions, hostLockedCompanyId]);

  const setCompanyId = (nextCompanyId: string) => {
    if (hostLockedCompanyId && nextCompanyId !== hostLockedCompanyId) {
      return;
    }
    setImpersonationCompanyId(null);
    setSelectedCompanyId(nextCompanyId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nextCompanyId);
      syncCompanyCookie(nextCompanyId);
    }
  };

  const isCompanyAdmin = useMemo(() => {
    if (!companyId) return false;
    if (isGlobalStaff) return true;
    return companies.some((c) => c.companyId === companyId && c.role === 'admin');
  }, [companies, companyId, isGlobalStaff]);

  const canManageRegistrations = isCompanyAdmin;

  const value: CompanyContextValue = {
    companyId,
    selectedCompanyId,
    impersonationCompanyId,
    isImpersonating,
    enterCompanyImpersonation,
    exitCompanyImpersonation,
    companies,
    companyOptions,
    staffDirectory,
    loading,
    systemRole,
    isDeveloper,
    isGlobalManager,
    isMasterAdmin,
    isGlobalStaff,
    isCompanyAdmin,
    canManageRegistrations,
    setCompanyId,
    requiresCompanySelection,
    isHostTenantLocked,
    hostLockedCompanyId,
    hostTenantAccessDenied,
    tenantBranding,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
