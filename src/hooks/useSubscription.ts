'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useCompany } from '@/context/CompanyContext';
import { getDb } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  getSectorPreset,
  normalizeCompanySector,
  type SectorId,
  type SectorPreset,
} from '@/config/sectorConfigs';
import {
  LEGACY_DEFAULT_PLAN,
  normalizeTenantPlan,
  PLAN_FEATURES,
  type SubscriptionFeatureKey,
  type TenantPlan,
} from '@/types/subscription';
import { isMeckanoModuleEnabled } from '@/lib/integrations/meckanoModule';

function integrationsHasMeckanoKey(d: Record<string, unknown> | undefined): boolean {
  if (!d) return false;
  const k = [d.meckanoApiKey, d.meckanoKey, d.key].find((x) => typeof x === 'string' && (x as string).trim());
  return Boolean(k);
}

function lastSyncedToDate(v: unknown): Date | null {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    try {
      return (v as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

export type CompanyBrandingSnapshot = {
  displayName: string;
  legalName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

const DEFAULT_BRANDING: CompanyBrandingSnapshot = (() => {
  const bp = getSectorPreset('CONSTRUCTION').brandingPalette;
  return {
    displayName: '',
    legalName: '',
    logoUrl: null,
    primaryColor: bp.primary,
    secondaryColor: bp.secondary,
  };
})();

/**
 * Live plan + feature flags for the selected company (Firestore `companies/{companyId}`).
 */
export function useSubscription() {
  const { companyId } = useCompany();
  const [plan, setPlan] = useState<TenantPlan>(LEGACY_DEFAULT_PLAN);
  const [branding, setBranding] = useState<CompanyBrandingSnapshot>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [meckanoLastSyncedAt, setMeckanoLastSyncedAt] = useState<Date | null>(null);
  const [companyMeckanoLegacyActive, setCompanyMeckanoLegacyActive] = useState(false);
  const [integrationsDoc, setIntegrationsDoc] = useState<Record<string, unknown> | undefined>(undefined);
  const [sector, setSector] = useState<SectorId>('CONSTRUCTION');

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setPlan(LEGACY_DEFAULT_PLAN);
      setBranding(DEFAULT_BRANDING);
      setMeckanoLastSyncedAt(null);
      setCompanyMeckanoLegacyActive(false);
      setSector('CONSTRUCTION');
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(getDb(), 'companies', companyId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setPlan(LEGACY_DEFAULT_PLAN);
          setBranding(DEFAULT_BRANDING);
          setMeckanoLastSyncedAt(null);
          setCompanyMeckanoLegacyActive(false);
          setSector('CONSTRUCTION');
          setLoading(false);
          return;
        }
        const d = snap.data() as Record<string, unknown>;
        setCompanyMeckanoLegacyActive(Boolean(d.meckanoIntegrationActive));
        const sec = normalizeCompanySector(d.sector);
        setSector(sec);
        const sectorPalette = getSectorPreset(sec).brandingPalette;
        const rawPlan = normalizeTenantPlan(d.plan);
        const freeForever = d.ownerVaultFreeForever === true;
        setPlan(freeForever ? ('alloy' as const) : rawPlan);
        const logoFromDoc =
          (typeof d.companyLogoUrl === 'string' && d.companyLogoUrl.trim() ? d.companyLogoUrl.trim() : null) ||
          (typeof d.logoUrl === 'string' && d.logoUrl.trim() ? d.logoUrl.trim() : null);
        setBranding({
          displayName: String(d.displayName ?? d.name ?? ''),
          legalName: String(d.legalName ?? d.displayName ?? d.name ?? ''),
          logoUrl: logoFromDoc,
          primaryColor:
            typeof d.primaryColor === 'string' && d.primaryColor.trim()
              ? d.primaryColor.trim()
              : sectorPalette.primary,
          secondaryColor:
            typeof d.secondaryColor === 'string' && d.secondaryColor.trim()
              ? d.secondaryColor.trim()
              : sectorPalette.secondary,
        });
        setMeckanoLastSyncedAt(lastSyncedToDate(d.meckanoLastSyncedAt));
        setLoading(false);
      },
      () => {
        setPlan(LEGACY_DEFAULT_PLAN);
        setBranding(DEFAULT_BRANDING);
        setMeckanoLastSyncedAt(null);
        setCompanyMeckanoLegacyActive(false);
        setSector('CONSTRUCTION');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) return;
    const themeRef = doc(getDb(), 'companies', companyId, 'branding', 'theme');
    const unsub = onSnapshot(
      themeRef,
      (snap) => {
        if (!snap.exists()) return;
        const t = snap.data() as Record<string, unknown>;
        setBranding((prev) => ({
          ...prev,
          primaryColor:
            typeof t.primaryColor === 'string' && t.primaryColor.trim()
              ? t.primaryColor.trim()
              : prev.primaryColor,
          secondaryColor:
            typeof t.secondaryColor === 'string' && t.secondaryColor.trim()
              ? t.secondaryColor.trim()
              : prev.secondaryColor,
          logoUrl:
            typeof t.companyLogoUrl === 'string' && t.companyLogoUrl.trim()
              ? t.companyLogoUrl.trim()
              : prev.logoUrl,
        }));
      },
      () => {}
    );
    return () => unsub();
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !isFirebaseConfigured()) {
      setIntegrationsDoc(undefined);
      return;
    }
    const iref = doc(getDb(), 'companies', companyId, 'settings', 'integrations');
    const unsub = onSnapshot(
      iref,
      (snap) => {
        setIntegrationsDoc(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined);
      },
      () => setIntegrationsDoc(undefined)
    );
    return () => unsub();
  }, [companyId]);

  const meckanoModuleEnabled = useMemo(
    () =>
      isMeckanoModuleEnabled(integrationsDoc, {
        meckanoIntegrationActive: companyMeckanoLegacyActive,
      }),
    [integrationsDoc, companyMeckanoLegacyActive]
  );

  const meckanoKeyConfigured = useMemo(
    () => integrationsHasMeckanoKey(integrationsDoc) || companyMeckanoLegacyActive,
    [integrationsDoc, companyMeckanoLegacyActive]
  );

  const sectorPreset: SectorPreset = useMemo(() => getSectorPreset(sector), [sector]);

  const features = useMemo(() => PLAN_FEATURES[plan], [plan]);

  const hasFeature = useCallback((key: SubscriptionFeatureKey) => features.has(key), [features]);

  return {
    companyId,
    plan,
    features,
    hasFeature,
    branding,
    loading,
    /** Meckano API key stored in `settings/integrations` or legacy company flag. */
    meckanoKeyConfigured,
    /** Company-level `meckanoLastSyncedAt` after successful P&L sync. */
    meckanoLastSyncedAt,
    /** Opt-in: `settings/integrations.meckano.active` or legacy `meckanoIntegrationActive`. */
    meckanoModuleEnabled,
    /** From `companies/{id}.sector` — drives sector UI presets. */
    sector,
    sectorPreset,
  };
}
