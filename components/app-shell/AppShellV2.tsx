"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { marketingSans } from "@/lib/fonts/marketing-fonts";
import AppCommandPalette from "@/components/app-shell/AppCommandPalette";
import { appNavItems } from "@/components/app-shell/app-nav";
import WorkspaceUtilityDock from "@/components/app-shell/WorkspaceUtilityDock";
import type { IndustryProfile } from "@/lib/professions/runtime";

type Props = Readonly<{
  children: ReactNode;
  user: {
    name: string;
    email: string;
    organizationId?: string | null;
    isPlatformAdmin?: boolean;
    industryProfile: IndustryProfile;
  };
}>;

type SectionMeta = {
  href: string;
  label: string;
  summary: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  showInNav?: boolean;
};

const appUtilitySections: SectionMeta[] = [
  {
    href: "/app/help",
    label: "עזרה",
    summary: "מדריך קצר, סדר עבודה ברור וקיצורי דרך למסכים המרכזיים.",
    icon: CircleHelp,
  },
  {
    href: "/app/business",
    label: "מרחב עסקי",
    summary: "תמונה רוחבית של לקוחות, מסמכים, תמחור ותפעול עסקי.",
    icon: BriefcaseBusiness,
  },
  {
    href: "/app/intelligence",
    label: "Intelligence",
    summary: "Executive AI, תובנות רוחביות ומעקב אחרי החלטות ניהוליות.",
    icon: BrainCircuit,
  },
  {
    href: "/app/admin",
    label: "Admin",
    summary: "בקרת פלטפורמה, שידורים, מנויים ותמונת מצב למפעילי BSD-YBM.",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    href: "/app/success",
    label: "הצלחה",
    summary: "אישור מסלול והמשך מהיר לצעד הבא במערכת.",
    icon: CheckCircle2,
    showInNav: false,
  },
];

const advancedSection: SectionMeta = {
  href: "/app/advanced",
  label: "כלים מתקדמים",
  summary: "גישה מרוכזת לכלי עומק, גשרים ומערכות מתקדמות.",
  icon: Sparkles,
  showInNav: false,
};

function isRouteActive(pathname: string, href: string) {
  const current = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  if (target === "/app") return current === "/app";
  return current === target || current.startsWith(`${target}/`);
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
        active
          ? "bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]"
          : "text-[color:var(--v2-muted)] hover:bg-white/88 hover:text-[color:var(--v2-ink)]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function MobilePill({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-[color:var(--v2-accent)] text-white"
          : "border border-[color:var(--v2-line)] bg-white/88 text-[color:var(--v2-muted)]"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

export default function AppShellV2({ children, user }: Props) {
  const pathname = usePathname() ?? "/app";
  const firstName = user.name.trim().split(" ")[0] || user.email.split("@")[0] || "User";
  const initials = firstName.slice(0, 2).toUpperCase();
  const allowedUtilitySections = appUtilitySections.filter(
    (item) => !item.adminOnly || user.isPlatformAdmin,
  );
  const currentSection =
    [...appNavItems, ...allowedUtilitySections, advancedSection].find((item) =>
      isRouteActive(pathname, item.href),
    ) ?? appNavItems[0];
  const primaryNavItems = appNavItems.map((item) => {
    if (item.href === "/app/clients") {
      return {
        ...item,
        label: user.industryProfile.clientsLabel,
        summary: `ניהול ${user.industryProfile.clientsLabel.toLowerCase()} והקשר שלהם ל-${user.industryProfile.documentsLabel.toLowerCase()}.`,
      };
    }
    if (item.href === "/app/documents") {
      return {
        ...item,
        label: user.industryProfile.documentsLabel,
        summary: `סריקה, פענוח וניהול ${user.industryProfile.recordsLabel.toLowerCase()} לפי ${user.industryProfile.industryLabel}.`,
      };
    }
    return item;
  });
  const activeSectionLabel =
    currentSection.href === "/app/clients"
      ? user.industryProfile.clientsLabel
      : currentSection.href === "/app/documents"
        ? user.industryProfile.documentsLabel
        : currentSection.label;

  const commandItems = [
    ...primaryNavItems.map((item) => ({
      href: item.href,
      label: item.label,
      summary: item.summary,
      icon: item.icon,
      keywords: [item.legacyHref, item.label, item.summary],
    })),
    ...allowedUtilitySections.map((item) => ({
        href: item.href,
        label: item.label,
        summary: item.summary,
        icon: item.icon,
        keywords: [item.label, item.summary],
      })),
    {
      href: advancedSection.href,
      label: advancedSection.label,
      summary: advancedSection.summary,
      icon: advancedSection.icon,
      keywords: ["advanced", "legacy", "bridge", "כלי עומק"],
    },
  ];

  return (
    <div
      className={`${marketingSans.className} min-h-screen bg-[color:var(--v2-canvas)] text-[color:var(--v2-ink)]`}
      dir="rtl"
    >
      <a
        href="#app-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[60] focus:rounded-2xl focus:bg-[color:var(--v2-accent)] focus:px-4 focus:py-3 focus:text-sm focus:font-black focus:text-white"
      >
        דלג לתוכן הראשי
      </a>

      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-l border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/96 lg:block">
          <div className="sticky top-0 flex min-h-screen flex-col px-4 py-5">
            <Link href="/app" className="flex items-center gap-3 px-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--v2-accent)] text-sm font-black text-white">
                BY
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-black tracking-[-0.04em]">BSD-YBM</span>
                <span className="block text-xs font-medium text-[color:var(--v2-muted)]">מרחב עבודה</span>
              </span>
            </Link>

            <nav className="mt-8 grid gap-1.5">
              {primaryNavItems.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isRouteActive(pathname, item.href)}
                />
              ))}
            </nav>

            <div className="mt-auto space-y-3 pt-6">
              <Link href="/app/advanced" className="v2-button v2-button-secondary w-full justify-center">
                <Sparkles className="h-4 w-4" aria-hidden />
                כלים מתקדמים
              </Link>

              <div className="rounded-3xl border border-[color:var(--v2-line)] bg-white/88 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--v2-canvas)] text-sm font-black text-[color:var(--v2-accent)]">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[color:var(--v2-ink)]">{user.name}</p>
                    <p className="truncate text-xs text-[color:var(--v2-muted)]">{user.email}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="v2-button w-full justify-center border border-[color:var(--v2-line)] bg-white/88 text-[color:var(--v2-ink)] hover:bg-white"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                יציאה
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/94 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-[color:var(--v2-accent)] shadow-sm lg:hidden">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[color:var(--v2-muted)]">
                    {user.industryProfile.industryLabel}
                  </p>
                  <h1 className="truncate text-lg font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-xl">
                    {activeSectionLabel}
                  </h1>
                </div>
              </div>

              <AppCommandPalette items={commandItems} />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--v2-line)] bg-white/88 text-[color:var(--v2-ink)] sm:hidden"
                  aria-label="יציאה"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>

                <Link href="/app/advanced" className="v2-button v2-button-secondary hidden sm:inline-flex">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  מתקדם
                </Link>
              </div>
            </div>

            <nav className="mx-auto flex max-w-[1600px] gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden lg:px-8">
              {primaryNavItems.map((item) => (
                <MobilePill
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isRouteActive(pathname, item.href)}
                />
              ))}
            </nav>
          </header>

          <main id="app-main-content" className="mx-auto max-w-[1600px] px-4 py-5 pb-20 sm:px-6 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      <WorkspaceUtilityDock
        orgId={user.organizationId}
        industryProfile={user.industryProfile}
        userName={user.name}
      />
    </div>
  );
}
