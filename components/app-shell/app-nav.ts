import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  FolderCog,
  Home,
  Lightbulb,
  Settings,
} from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  legacyHref: string;
  summary: string;
};

export const appNavItems: AppNavItem[] = [
  {
    href: "/app",
    label: "בית",
    icon: Home,
    legacyHref: "/app/advanced",
    summary: "תמונת מצב, קיצורי דרך וכניסה מסודרת לכל אזורי העבודה.",
  },
  {
    href: "/app/inbox",
    label: "תיבת עבודה",
    icon: BellRing,
    legacyHref: "/app/inbox/advanced",
    summary: "מה דורש טיפול עכשיו, אילו אישורים פתוחים, ומה מחכה לצוות.",
  },
  {
    href: "/app/clients",
    label: "לקוחות",
    icon: BriefcaseBusiness,
    legacyHref: "/app/clients/advanced",
    summary: "לקוחות, צנרת, פרויקטים וחיבור ישיר למסמכים ולחיוב.",
  },
  {
    href: "/app/documents",
    label: "מסמכים",
    icon: FileText,
    legacyHref: "/app/documents/erp",
    summary: "סריקה, שיוך, בקרה והפקת מסמכים עסקיים במקום אחד.",
  },
  {
    href: "/app/billing",
    label: "חיוב",
    icon: CreditCard,
    legacyHref: "/app/documents/erp",
    summary: "תזרים, חשבוניות, גבייה ומעקב תשלומים שוטף.",
  },
  {
    href: "/app/operations",
    label: "תפעול",
    icon: FolderCog,
    legacyHref: "/app/operations/advanced",
    summary: "תהליכים, משימות, אוטומציות וכלי צוות.",
  },
  {
    href: "/app/insights",
    label: "תובנות",
    icon: Lightbulb,
    legacyHref: "/app/insights/advanced",
    summary: "AI, המלצות חכמות ותמונה ניהולית לפי ההקשר העסקי.",
  },
  {
    href: "/app/settings",
    label: "הגדרות",
    icon: Settings,
    legacyHref: "/app/settings/advanced",
    summary: "הגדרות ארגון, צוות, אינטגרציות, AI וחיוב.",
  },
] as const;
