'use client';

import { useCallback, useMemo } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { useSubscription } from '@/hooks/useSubscription';
import type { SectorModuleFlags, SectorTerminology } from '@/config/sectorConfigs';

/**
 * Omni-adaptation: sector-based nav labels, module flags, and terminology (no extra Firestore listener).
 * Firestore: set `companies/{id}.sector` to `CONSTRUCTION` | `RENOVATION` | `PROPERTY_MGMT` | `ELECTRICAL`.
 */
export function useSectorUi() {
  const { sector, sectorPreset } = useSubscription();
  const { locale } = useLocale();

  const moduleEnabled = useCallback(
    (m: keyof SectorModuleFlags) => sectorPreset.modules[m],
    [sectorPreset]
  );

  return useMemo(() => {
    const he = locale === 'he';
    return {
      sector,
      sectorPreset,
      navProjectsLabel: he ? sectorPreset.nav.projectsHe : sectorPreset.nav.projectsEn,
      navFinanceLabel: he ? sectorPreset.nav.financeHe : sectorPreset.nav.financeEn,
      navTeamLabel: he ? sectorPreset.nav.teamHe : sectorPreset.nav.teamEn,
      sectorLabel: he ? sectorPreset.labelHe : sectorPreset.labelEn,
      terminology: (key: keyof SectorTerminology) => {
        const entry = sectorPreset.terminology[key];
        return he ? entry.he : entry.en;
      },
      moduleEnabled,
    };
  }, [sector, sectorPreset, locale, moduleEnabled]);
}
