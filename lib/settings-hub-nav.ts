import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  Cpu,
  CreditCard,
  FolderCog,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

/** מזהי מקטעים תחת /app/settings/[segment] */
export const SETTINGS_HUB_SEGMENT_IDS = [
  "overview",
  "organization",
  "profession",
  "presence",
  "stack",
  "billing",
  "automations",
  "operations",
  "platform",
] as const;

export type SettingsHubSegmentId = (typeof SETTINGS_HUB_SEGMENT_IDS)[number];

/** מקטעי פאנל ליבה (ללא billing/automations/operations/platform) */
export const SETTINGS_HUB_CORE_SEGMENT_IDS = [
  "overview",
  "organization",
  "profession",
  "presence",
  "stack",
] as const;

export type SettingsHubCoreSegmentId = (typeof SETTINGS_HUB_CORE_SEGMENT_IDS)[number];

export type SettingsHubNavItem = {
  id: SettingsHubSegmentId;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** רק בעל פלטפורמה */
  platformAdminOnly?: boolean;
};

export type SettingsHubNavGroup = {
  id: string;
  title: string;
  items: SettingsHubNavItem[];
};

const BASE = "/app/settings";

export const SETTINGS_HUB_NAV_GROUPS: readonly SettingsHubNavGroup[] = [
  {
    id: "core",
    title: "ליבת המערכת",
    items: [
      {
        id: "overview",
        href: `${BASE}/overview`,
        label: "סקירה",
        description: "מפת דרכים וקיצורים",
        icon: LayoutDashboard,
      },
      {
        id: "organization",
        href: `${BASE}/organization`,
        label: "ארגון ומס",
        description: "זהות רשמית ומס",
        icon: Building2,
      },
      {
        id: "profession",
        href: `${BASE}/profession`,
        label: "מקצוע ושפה",
        description: "תחום ותוויות",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    id: "digital",
    title: "נוכחות וטכנולוגיה",
    items: [
      {
        id: "presence",
        href: `${BASE}/presence`,
        label: "נוכחות דיגיטלית",
        description: "פורטל, מיתוג וגבייה מול לקוחות",
        icon: Globe,
      },
      {
        id: "stack",
        href: `${BASE}/stack`,
        label: "מנועים וחיבורים",
        description: "AI, ענן, Meckano, גיבוי",
        icon: Cpu,
      },
    ],
  },
  {
    id: "ops",
    title: "תפעול ומסחר",
    items: [
      {
        id: "billing",
        href: `${BASE}/billing`,
        label: "מנויים וחיוב",
        description: "מסלול BSD-YBM ומרכז שליטה",
        icon: CreditCard,
      },
      {
        id: "automations",
        href: `${BASE}/automations`,
        label: "אוטומציות",
        description: "בניית זרימות",
        icon: Workflow,
      },
      {
        id: "operations",
        href: `${BASE}/operations`,
        label: "תפעול",
        description: "תורים, שטח, חיבורים",
        icon: FolderCog,
      },
    ],
  },
  {
    id: "platform",
    title: "פלטפורמה",
    items: [
      {
        id: "platform",
        href: `${BASE}/platform`,
        label: "בקרת פלטפורמה",
        description: "בריאות, מנויים, שידורים",
        icon: ShieldCheck,
        platformAdminOnly: true,
      },
    ],
  },
];

/** מיפוי ?tab= ישן (לפני nested routes) */
const LEGACY_TAB_TO_SEGMENT: Readonly<Record<string, SettingsHubSegmentId>> = {
  overview: "overview",
  organization: "organization",
  profession: "profession",
  presence: "presence",
  stack: "stack",
  portal: "presence",
  billing: "billing",
  subscription: "billing",
  ai: "stack",
  integrations: "stack",
  meckano: "stack",
};

export function legacyTabToSegment(tab: string | undefined | null): SettingsHubSegmentId | null {
  const u = String(tab ?? "")
    .trim()
    .toLowerCase();
  if (!u) return null;
  return LEGACY_TAB_TO_SEGMENT[u] ?? null;
}

export function settingsHubPath(segment: SettingsHubSegmentId): string {
  return `${BASE}/${segment}`;
}

export function flattenSettingsHubNav(
  includePlatformItems: boolean,
): SettingsHubNavItem[] {
  return SETTINGS_HUB_NAV_GROUPS.flatMap((g) =>
    g.items.filter((item) => includePlatformItems || !item.platformAdminOnly),
  );
}

export function getSettingsHubNavItem(
  segment: SettingsHubSegmentId,
  includePlatformItems: boolean,
): SettingsHubNavItem | undefined {
  return flattenSettingsHubNav(includePlatformItems).find((item) => item.id === segment);
}
