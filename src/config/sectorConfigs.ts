/**
 * Universal sector adaptation — presets drive nav labels, module visibility, and terminology.
 * Firestore: `companies/{id}.sector` (string), normalized via `normalizeCompanySector`.
 */

export type SectorId = 'CONSTRUCTION' | 'RENOVATION' | 'PROPERTY_MGMT' | 'ELECTRICAL';

export type SectorModuleFlags = {
  showMilestones: boolean;
  showLeaseTracking: boolean;
  showMeckanoTeam: boolean;
  showProjectHealthChart: boolean;
};

/** Sidebar / shell labels per locale (avoid coupling to generic i18n nav keys). */
export type SectorNavLabels = {
  projectsHe: string;
  projectsEn: string;
  financeHe: string;
  financeEn: string;
  teamHe: string;
  teamEn: string;
};

export type SectorTerminology = {
  /** e.g. "Project" vs "Asset" */
  entitySingular: { he: string; en: string };
  entityPlural: { he: string; en: string };
  /** Workplace / job-site wording (avoid "Site" / "construction-only" terms in EN) */
  siteLabel: { he: string; en: string };
  budgetLine: { he: string; en: string };
};

/** Default CSS hex pair when company has no `primaryColor` / `secondaryColor` in Firestore — sector-driven “brand profile”. */
export type SectorBrandingPalette = {
  primary: string;
  secondary: string;
};

export type SectorPreset = {
  id: SectorId;
  labelHe: string;
  labelEn: string;
  nav: SectorNavLabels;
  modules: SectorModuleFlags;
  terminology: SectorTerminology;
  /** Fallback palette before explicit company theme colors */
  brandingPalette: SectorBrandingPalette;
};

const BASE_TEAM_NAV: Pick<SectorNavLabels, 'teamHe' | 'teamEn'> = {
  teamHe: 'צוות',
  teamEn: 'Team',
};

export const SECTOR_PRESETS: Record<SectorId, SectorPreset> = {
  CONSTRUCTION: {
    id: 'CONSTRUCTION',
    labelHe: 'פרויקטים ושטח',
    labelEn: 'Projects & field work',
    nav: {
      projectsHe: 'פרויקטים',
      projectsEn: 'Projects',
      financeHe: 'ניהול תקציב',
      financeEn: 'Finance',
      ...BASE_TEAM_NAV,
    },
    modules: {
      showMilestones: true,
      showLeaseTracking: false,
      showMeckanoTeam: true,
      showProjectHealthChart: true,
    },
    terminology: {
      entitySingular: { he: 'פרויקט', en: 'Project' },
      entityPlural: { he: 'פרויקטים', en: 'Projects' },
      siteLabel: { he: 'מקום עבודה', en: 'Workplace' },
      budgetLine: { he: 'תקציב פרויקט', en: 'Project budget' },
    },
    /** Luxury-forward: gold accent + deep primary */
    brandingPalette: {
      primary: '#1B365D',
      secondary: '#D4AF37',
    },
  },
  RENOVATION: {
    id: 'RENOVATION',
    labelHe: 'שיפוצים',
    labelEn: 'Renovation',
    nav: {
      projectsHe: 'פרויקטי שיפוץ',
      projectsEn: 'Renovation jobs',
      financeHe: 'פיננסים — שיפוצים',
      financeEn: 'Renovation finance',
      ...BASE_TEAM_NAV,
    },
    modules: {
      showMilestones: true,
      showLeaseTracking: false,
      showMeckanoTeam: true,
      showProjectHealthChart: true,
    },
    terminology: {
      entitySingular: { he: 'פרויקט שיפוץ', en: 'Renovation job' },
      entityPlural: { he: 'פרויקטי שיפוץ', en: 'Renovation jobs' },
      siteLabel: { he: 'נכס', en: 'Property' },
      budgetLine: { he: 'תקציב עבודה', en: 'Job budget' },
    },
    brandingPalette: {
      primary: '#0D9488',
      secondary: '#D4AF37',
    },
  },
  PROPERTY_MGMT: {
    id: 'PROPERTY_MGMT',
    labelHe: 'ניהול נכסים',
    labelEn: 'Property management',
    nav: {
      projectsHe: 'נכסים / מיקומים',
      projectsEn: 'Properties & locations',
      financeHe: 'פיננסים — נכסים',
      financeEn: 'Property finance',
      teamHe: 'צוות תחזוקה',
      teamEn: 'Maintenance team',
    },
    modules: {
      showMilestones: false,
      showLeaseTracking: true,
      showMeckanoTeam: true,
      showProjectHealthChart: true,
    },
    terminology: {
      entitySingular: { he: 'נכס', en: 'Asset' },
      entityPlural: { he: 'נכסים', en: 'Assets' },
      siteLabel: { he: 'מיקום ניהול', en: 'Managed location' },
      budgetLine: { he: 'תקציב נכס', en: 'Asset budget' },
    },
    /** Professional services: corporate blue */
    brandingPalette: {
      primary: '#004694',
      secondary: '#64748B',
    },
  },
  ELECTRICAL: {
    id: 'ELECTRICAL',
    labelHe: 'חשמל',
    labelEn: 'Electrical',
    nav: {
      projectsHe: 'פרויקטים / מקומות עבודה',
      projectsEn: 'Projects / workplaces',
      financeHe: 'פיננסים — חשמל',
      financeEn: 'Electrical finance',
      ...BASE_TEAM_NAV,
    },
    modules: {
      showMilestones: true,
      showLeaseTracking: false,
      showMeckanoTeam: true,
      showProjectHealthChart: true,
    },
    terminology: {
      entitySingular: { he: 'פרויקט חשמל', en: 'Electrical project' },
      entityPlural: { he: 'פרויקטים', en: 'Projects' },
      siteLabel: { he: 'מקום ביצוע', en: 'Workplace' },
      budgetLine: { he: 'תקציב ביצוע', en: 'Field budget' },
    },
    brandingPalette: {
      primary: '#1E40AF',
      secondary: '#F59E0B',
    },
  },
};

const SECTOR_ALIASES: Record<string, SectorId> = {
  CONSTRUCTION: 'CONSTRUCTION',
  RENOVATION: 'RENOVATION',
  PROPERTY_MGMT: 'PROPERTY_MGMT',
  PROPERTY_MANAGEMENT: 'PROPERTY_MGMT',
  PROPERTYMGMT: 'PROPERTY_MGMT',
  ELECTRICAL: 'ELECTRICAL',
  ELECTRIC: 'ELECTRICAL',
};

export function normalizeCompanySector(raw: unknown): SectorId {
  if (typeof raw !== 'string') return 'CONSTRUCTION';
  const s = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (SECTOR_ALIASES[s]) return SECTOR_ALIASES[s];
  if (s in SECTOR_PRESETS) return s as SectorId;
  return 'CONSTRUCTION';
}

export function getSectorPreset(id: SectorId): SectorPreset {
  return SECTOR_PRESETS[id] ?? SECTOR_PRESETS.CONSTRUCTION;
}
