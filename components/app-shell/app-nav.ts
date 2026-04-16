import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  FileText,
  FolderCog,
  Home,
  LayoutDashboard,
  Lightbulb,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { IndustryProfile } from "@/lib/professions/runtime";

export type AppRouteId =
  | "home"
  | "inbox"
  | "clients"
  | "documents"
  | "billing"
  | "operations"
  | "insights"
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

export const appNavItems: AppNavItem[] = [
  {
    id: "home",
    href: "/app",
    label: "בית",
    icon: Home,
    legacyHref: "/app/advanced",
    summary: "תמונת מצב, קיצורי דרך וכניסה מסודרת לכל אזורי העבודה.",
  },
  {
    id: "inbox",
    href: "/app/inbox",
    label: "תיבת עבודה",
    icon: BellRing,
    legacyHref: "/app/inbox/advanced",
    summary: "מה דורש טיפול עכשיו, אילו אישורים פתוחים, ומה מחכה לצוות.",
  },
  {
    id: "clients",
    href: "/app/clients",
    label: "לקוחות",
    icon: BriefcaseBusiness,
    legacyHref: "/app/clients/advanced",
    summary: "לקוחות, צנרת, פרויקטים וחיבור ישיר למסמכים ולחיוב.",
  },
  {
    id: "documents",
    href: "/app/documents",
    label: "מסמכים",
    icon: FileText,
    legacyHref: "/app/documents/erp",
    summary: "סריקה, שיוך, בקרה והפקת מסמכים עסקיים במקום אחד.",
  },
  {
    id: "billing",
    href: "/app/billing",
    label: "חיוב",
    icon: CreditCard,
    legacyHref: "/app/documents/erp",
    summary: "תזרים, חשבוניות, גבייה ומעקב תשלומים שוטף.",
  },
  {
    id: "operations",
    href: "/app/operations",
    label: "תפעול",
    icon: FolderCog,
    legacyHref: "/app/operations/advanced",
    summary: "תהליכים, משימות, אוטומציות וכלי צוות.",
  },
  {
    id: "insights",
    href: "/app/insights",
    label: "תובנות",
    icon: Lightbulb,
    legacyHref: "/app/insights/advanced",
    summary: "AI, המלצות חכמות ותמונה ניהולית לפי ההקשר העסקי.",
  },
  {
    id: "settings",
    href: "/app/settings",
    label: "הגדרות",
    icon: Settings,
    legacyHref: "/app/settings/advanced",
    summary: "הגדרות ארגון, צוות, אינטגרציות, AI וחיוב.",
  },
] as const;

export const appUtilityItems: AppNavItem[] = [
  {
    id: "help",
    href: "/app/help",
    label: "עזרה",
    icon: CircleHelp,
    legacyHref: "/app/help",
    summary: "מדריך קצר, סדר עבודה ברור וקיצורי דרך למסכים המרכזיים.",
  },
  {
    id: "business",
    href: "/app/business",
    label: "מרחב עסקי",
    icon: BriefcaseBusiness,
    legacyHref: "/app/business",
    summary: "תמונה רוחבית של לקוחות, מסמכים, תמחור ותפעול עסקי.",
  },
  {
    id: "intelligence",
    href: "/app/intelligence",
    label: "Intelligence",
    icon: BrainCircuit,
    legacyHref: "/app/intelligence",
    summary: "Executive AI, תובנות רוחביות ומעקב אחרי החלטות ניהוליות.",
  },
  {
    id: "admin",
    href: "/app/admin",
    label: "Admin",
    icon: ShieldCheck,
    legacyHref: "/app/admin",
    summary: "בקרת פלטפורמה, שידורים, מנויים ותמונת מצב למפעילי BSD-YBM.",
    adminOnly: true,
  },
  {
    id: "success",
    href: "/app/success",
    label: "הצלחה",
    icon: CheckCircle2,
    legacyHref: "/app/success",
    summary: "אישור מסלול והמשך מהיר לצעד הבא במערכת.",
    showInNav: false,
  },
] as const;

export const advancedAppItem: AppNavItem = {
  id: "advanced",
  href: "/app/advanced",
  label: "כלים מתקדמים",
  icon: Sparkles,
  legacyHref: "/app/advanced",
  summary: "גישה מרוכזת לכלי עומק, גשרים ומערכות מתקדמות.",
  showInNav: false,
};

export function getAppNavItem(id: AppRouteId) {
  return [...appNavItems, ...appUtilityItems, advancedAppItem].find((item) => item.id === id);
}

export function getAdvancedWorkspaceHref(
  id: Extract<AppRouteId, "inbox" | "clients" | "operations" | "insights" | "settings">,
) {
  return getAppNavItem(id)?.legacyHref ?? "/app/advanced";
}

export const appAdvancedItems: AppAdvancedItem[] = [
  {
    id: "onboarding",
    href: "/app/onboarding",
    title: "Onboarding חכם",
    body: "אשף התארגנות שמתרגם את מצב הארגון לצעדים ברורים: מקצוע, חיבורים, מנוי, פורטל ומסמכים.",
    icon: CheckCircle2,
  },
  {
    id: "automations",
    href: "/app/automations",
    title: "Automation Center",
    body: "מרכז אחד לבניית אוטומציות, תסריטים מומלצים וקישור ישיר לזרימות עבודה של מסמכים, גבייה ולקוחות.",
    icon: Sparkles,
  },
  {
    id: "portal",
    href: "/app/portal",
    title: "Client Portal",
    body: "ניהול הפורטל הציבורי, דומיין, שיתוף מסמכים ומעקב אחרי מה שהלקוח רואה מחוץ למערכת הפנימית.",
    icon: LayoutDashboard,
  },
  {
    id: "inbox",
    href: getAdvancedWorkspaceHref("inbox"),
    title: "מרכז בקרה מתקדם",
    body: "כלי ניטור, בקרה ותהליכי עומק שעוזרים לצוותי ניהול ותפעול לטפל במקרים מורכבים.",
    icon: ShieldCheck,
  },
  {
    id: "clients",
    href: getAdvancedWorkspaceHref("clients"),
    title: "CRM מתקדם",
    body: "כלי CRM מלאים למצבים שבהם צריך שליטה עמוקה יותר, דוחות וכלי עומק.",
    icon: BriefcaseBusiness,
  },
  {
    id: "insights",
    href: getAdvancedWorkspaceHref("insights"),
    title: "AI Hub מתקדם",
    body: "לשוניות AI, סורקים וכלי עומק אנליטיים שמיועדים לעבודה מתקדמת יותר.",
    icon: BrainCircuit,
  },
  {
    id: "settings",
    href: getAdvancedWorkspaceHref("settings"),
    title: "הגדרות מתקדמות",
    body: "מרכז ההגדרות המלא לאזורים שדורשים שליטה מפורטת יותר בארגון ובאינטגרציות.",
    icon: Settings,
  },
  {
    id: "operations",
    href: getAdvancedWorkspaceHref("operations"),
    title: "תפעול מתקדם",
    body: "Workflows, כלי עומק לצוות ותהליכים שחוצים כמה מחלקות או כמה מערכות יחד.",
    icon: FolderCog,
  },
  {
    id: "meckano",
    href: "/app/operations/meckano",
    title: "Meckano",
    body: "מודול השטח הייעודי נשאר כאן כמרחב עבודה מתקדם למנוי המורשה בלבד.",
    icon: LayoutDashboard,
    requiresMeckano: true,
  },
];

export function personalizeAppNavItem(item: AppNavItem, industryProfile: IndustryProfile): AppNavItem {
  if (item.id === "clients") {
    return {
      ...item,
      label: industryProfile.clientsLabel,
      summary: `ניהול ${industryProfile.clientsLabel.toLowerCase()} וחיבור ישיר אל ${industryProfile.documentsLabel.toLowerCase()}.`,
    };
  }

  if (item.id === "documents") {
    return {
      ...item,
      label: industryProfile.documentsLabel,
      summary: `סריקה, בקרה והפקה של ${industryProfile.recordsLabel.toLowerCase()} עבור ${industryProfile.industryLabel}.`,
    };
  }

  return item;
}

export function buildAppNavCollection(
  industryProfile: IndustryProfile,
  options?: {
    visibleUtilityIds?: string[];
  },
): AppNavCollection {
  const primary = appNavItems.map((item) => personalizeAppNavItem(item, industryProfile));
  const visibleUtilityIds = options?.visibleUtilityIds;
  const utility = appUtilityItems.filter((item) => {
    if (item.adminOnly && !visibleUtilityIds?.includes("admin")) {
      return false;
    }

    if (!visibleUtilityIds) {
      return true;
    }

    return visibleUtilityIds.includes(item.id);
  });

  return {
    primary,
    utility,
    advanced: advancedAppItem,
    all: [...primary, ...utility, advancedAppItem],
  };
}
