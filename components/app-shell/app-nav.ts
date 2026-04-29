import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  FolderCog,
  LayoutDashboard,
  ScanSearch,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { TFunction } from "@/lib/i18n/translate";
import type { IndustryProfile } from "@/lib/professions/runtime";

export type AppRouteId =
  | "home"
  | "scan"
  | "crm"
  | "erp"
  | "operations"
  | "settings"
  | "admin"
  | "success";

export type AppNavItem = {
  id: AppRouteId;
  href: string;
  label: string;
  icon: LucideIcon;
  legacyHref: string;
  summary: string;
  adminOnly?: boolean;
  showInNav?: boolean;
};

export type AppNavCollection = Readonly<{
  primary: AppNavItem[];
  utility: AppNavItem[];
  all: AppNavItem[];
}>;

type PrimaryNavSpec = {
  id: Extract<AppRouteId, "home" | "scan" | "crm" | "erp" | "operations" | "settings">;
  href: string;
  icon: LucideIcon;
  legacyHref: string;
};

const PRIMARY_NAV_SPECS: readonly PrimaryNavSpec[] = [
  { id: "home",       href: "/app",            icon: LayoutDashboard, legacyHref: "/app" },
  { id: "scan",       href: "/app/scan",        icon: ScanSearch, legacyHref: "/app/scan" },
  { id: "crm",        href: "/app/crm",         icon: Users,      legacyHref: "/app/clients" },
  { id: "erp",        href: "/app/erp",         icon: Wallet,     legacyHref: "/app/documents" },
  { id: "operations", href: "/app/operations",  icon: FolderCog,  legacyHref: "/app/operations" },
  { id: "settings",   href: "/app/settings/overview", icon: Settings, legacyHref: "/app/settings" },
];

/** מזהי הנתיבים הראשיים — לשימוש במדיניות הרשאות / מקצוע */
export const PRIMARY_NAV_ROUTE_IDS = PRIMARY_NAV_SPECS.map((s) => s.id) as readonly PrimaryNavSpec["id"][];

type UtilityNavSpec = {
  id: Extract<AppRouteId, "admin" | "success">;
  href: string;
  icon: LucideIcon;
  legacyHref: string;
  adminOnly?: boolean;
  showInNav?: boolean;
};

const UTILITY_NAV_SPECS: readonly UtilityNavSpec[] = [
  { id: "admin",   href: "/app/admin",   icon: ShieldCheck,  legacyHref: "/app/admin",   adminOnly: true },
  { id: "success", href: "/app/success", icon: CheckCircle2, legacyHref: "/app/success", showInNav: false },
];

function primaryNavItemFromSpec(spec: PrimaryNavSpec, t: TFunction): AppNavItem {
  return {
    id: spec.id,
    href: spec.href,
    label: t(`workspaceNav.items.${spec.id}.label`),
    summary: t(`workspaceNav.items.${spec.id}.summary`),
    icon: spec.icon,
    legacyHref: spec.legacyHref,
  };
}

function utilityNavItemFromSpec(spec: UtilityNavSpec, t: TFunction): AppNavItem {
  return {
    id: spec.id,
    href: spec.href,
    label: t(`workspaceNav.utility.${spec.id}.label`),
    summary: t(`workspaceNav.utility.${spec.id}.summary`),
    icon: spec.icon,
    legacyHref: spec.legacyHref,
    adminOnly: spec.adminOnly,
    showInNav: spec.showInNav,
  };
}

export function personalizeAppNavItem(
  item: AppNavItem,
  industryProfile: IndustryProfile,
  t: TFunction,
): AppNavItem {
  if (item.id === "crm") {
    return {
      ...item,
      label: industryProfile.clientsLabel,
      summary: t("workspaceNav.items.crm.summary", {
        clients: industryProfile.clientsLabel.toLowerCase(),
      }),
    };
  }

  if (item.id === "erp") {
    const erpLabel = industryProfile.financeNavLabel ?? industryProfile.documentsLabel;
    return {
      ...item,
      label: erpLabel,
      summary: t("workspaceNav.items.erp.summary", {
        records: industryProfile.recordsLabel.toLowerCase(),
      }),
    };
  }

  return item;
}

export function buildAppNavCollection(
  industryProfile: IndustryProfile,
  t: TFunction,
  options?: {
    visibleUtilityIds?: string[];
    hiddenPrimaryRouteIds?: ReadonlySet<AppRouteId>;
  },
): AppNavCollection {
  const hiddenPrimary = options?.hiddenPrimaryRouteIds;
  const primarySpecs = hiddenPrimary
    ? PRIMARY_NAV_SPECS.filter((spec) => !hiddenPrimary.has(spec.id))
    : PRIMARY_NAV_SPECS;
  const primary = primarySpecs.map((spec) =>
    personalizeAppNavItem(primaryNavItemFromSpec(spec, t), industryProfile, t),
  );
  const visibleUtilityIds = options?.visibleUtilityIds;
  const utility = UTILITY_NAV_SPECS.filter((spec) => {
    if (spec.adminOnly && !visibleUtilityIds?.includes("admin")) return false;
    if (!visibleUtilityIds) return true;
    return visibleUtilityIds.includes(spec.id);
  }).map((spec) => utilityNavItemFromSpec(spec, t));

  return {
    primary,
    utility,
    all: [...primary, ...utility],
  };
}
