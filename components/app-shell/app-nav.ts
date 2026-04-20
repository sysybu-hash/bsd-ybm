import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  FileText,
  FolderCog,
  FolderKanban,
  Home,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { TFunction } from "@/lib/i18n/translate";
import type { IndustryProfile } from "@/lib/professions/runtime";

export type AppRouteId =
  | "home"
  | "inbox"
  | "projects"
  | "clients"
  | "documents"
  | "finance"
  | "ai"
  | "operations"
  | "settings"
  | "help"
  | "business"
  | "intelligence"
  | "admin"
  | "success"
  | "advanced";

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

export type AppAdvancedItem = {
  id: string;
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
  requiresMeckano?: boolean;
};

export type AppNavCollection = Readonly<{
  primary: AppNavItem[];
  utility: AppNavItem[];
  advanced: AppNavItem;
  all: AppNavItem[];
}>;

type PrimaryNavSpec = {
  id: Extract<
    AppRouteId,
    "home" | "inbox" | "projects" | "clients" | "documents" | "finance" | "ai" | "operations" | "settings"
  >;
  href: string;
  icon: LucideIcon;
  legacyHref: string;
};

const PRIMARY_NAV_SPECS: readonly PrimaryNavSpec[] = [
  { id: "home", href: "/app", icon: Home, legacyHref: "/app/advanced" },
  { id: "inbox", href: "/app/inbox", icon: BellRing, legacyHref: "/app/inbox/advanced" },
  { id: "projects", href: "/app/projects", icon: FolderKanban, legacyHref: "/app/projects" },
  { id: "clients", href: "/app/clients", icon: BriefcaseBusiness, legacyHref: "/app/clients/advanced" },
  { id: "finance", href: "/app/finance", icon: Wallet, legacyHref: "/app/finance" },
  { id: "ai", href: "/app/ai", icon: BrainCircuit, legacyHref: "/app/ai" },
  { id: "documents", href: "/app/documents", icon: FileText, legacyHref: "/app/documents/erp" },
  { id: "operations", href: "/app/operations", icon: FolderCog, legacyHref: "/app/operations/advanced" },
  { id: "settings", href: "/app/settings", icon: Settings, legacyHref: "/app/settings" },
];

/** מזהי הנתיבים הראשיים — לשימוש במדיניות הרשאות / מקצוע */
export const PRIMARY_NAV_ROUTE_IDS = PRIMARY_NAV_SPECS.map((s) => s.id) as readonly PrimaryNavSpec["id"][];

type UtilityNavSpec = {
  id: Extract<AppRouteId, "help" | "business" | "admin" | "success">;
  href: string;
  icon: LucideIcon;
  legacyHref: string;
  adminOnly?: boolean;
  showInNav?: boolean;
};

const UTILITY_NAV_SPECS: readonly UtilityNavSpec[] = [
  { id: "help", href: "/app/help", icon: CircleHelp, legacyHref: "/app/help" },
  { id: "business", href: "/app/business", icon: BriefcaseBusiness, legacyHref: "/app/business" },
  { id: "admin", href: "/app/admin", icon: ShieldCheck, legacyHref: "/app/admin", adminOnly: true },
  {
    id: "success",
    href: "/app/success",
    icon: CheckCircle2,
    legacyHref: "/app/success",
    showInNav: false,
  },
];

const ADVANCED_SPEC = {
  id: "advanced" as const,
  href: "/app/advanced",
  icon: Sparkles,
  legacyHref: "/app/advanced",
};

const LEGACY_HREF_BY_ROUTE: Partial<
  Record<
    Extract<AppRouteId, "inbox" | "projects" | "clients" | "finance" | "ai" | "operations" | "settings">,
    string
  >
> = {
  inbox: "/app/advanced",
  projects: "/app/projects",
  clients: "/app/advanced",
  finance: "/app/finance",
  ai: "/app/ai",
  operations: "/app/advanced",
  settings: "/app/settings",
};

const ADVANCED_CARD_SPECS: readonly {
  id: string;
  href: string;
  icon: LucideIcon;
  requiresMeckano?: boolean;
}[] = [
  { id: "onboarding", href: "/app/onboarding", icon: CheckCircle2 },
  { id: "automations", href: "/app/settings/automations", icon: Sparkles },
  { id: "portal", href: "/app/portal", icon: LayoutDashboard },
  { id: "inbox", href: "/app/inbox", icon: ShieldCheck },
  { id: "clients", href: "/app/clients", icon: BriefcaseBusiness },
  { id: "ai", href: "/app/ai", icon: BrainCircuit },
  { id: "settings", href: "/app/settings", icon: Settings },
  { id: "operations", href: "/app/operations", icon: FolderCog },
  { id: "meckano", href: "/app/operations/meckano", icon: LayoutDashboard, requiresMeckano: true },
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

function advancedNavItem(t: TFunction): AppNavItem {
  return {
    id: "advanced",
    href: ADVANCED_SPEC.href,
    label: t("workspaceNav.advanced.label"),
    summary: t("workspaceNav.advanced.summary"),
    icon: ADVANCED_SPEC.icon,
    legacyHref: ADVANCED_SPEC.legacyHref,
    showInNav: false,
  };
}

export function personalizeAppNavItem(
  item: AppNavItem,
  industryProfile: IndustryProfile,
  t: TFunction,
): AppNavItem {
  if (item.id === "clients") {
    return {
      ...item,
      label: industryProfile.clientsLabel,
      summary: t("workspaceNav.items.clients.summary", {
        clients: industryProfile.clientsLabel.toLowerCase(),
        documents: industryProfile.documentsLabel.toLowerCase(),
      }),
    };
  }

  if (item.id === "documents") {
    return {
      ...item,
      label: industryProfile.documentsLabel,
      summary: t("workspaceNav.items.documents.summary", {
        records: industryProfile.recordsLabel.toLowerCase(),
        industry: industryProfile.industryLabel.toLowerCase(),
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
    /** נתיבים ראשיים שלא יוצגו בניווט (למשל לפי מקצוע או תפקיד) */
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
    if (spec.adminOnly && !visibleUtilityIds?.includes("admin")) {
      return false;
    }

    if (!visibleUtilityIds) {
      return true;
    }

    return visibleUtilityIds.includes(spec.id);
  }).map((spec) => utilityNavItemFromSpec(spec, t));

  const advanced = advancedNavItem(t);

  return {
    primary,
    utility,
    advanced,
    all: [...primary, ...utility, advanced],
  };
}

export function getAdvancedWorkspaceHref(
  id: Extract<AppRouteId, "inbox" | "projects" | "clients" | "finance" | "ai" | "operations" | "settings">,
) {
  return LEGACY_HREF_BY_ROUTE[id] ?? "/app/advanced";
}

/** כרטיסי `/app/advanced` — כותרות ותיאורים לפי שפת הממשק */
export function buildAppAdvancedItems(t: TFunction): AppAdvancedItem[] {
  return ADVANCED_CARD_SPECS.map((spec) => ({
    id: spec.id,
    href: spec.href,
    title: t(`workspaceNav.advancedCards.${spec.id}.title`),
    body: t(`workspaceNav.advancedCards.${spec.id}.body`),
    icon: spec.icon,
    requiresMeckano: spec.requiresMeckano,
  }));
}
