"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  Globe,
  ShieldCheck,
  User,
  Workflow,
  Wrench,
} from "lucide-react";
import { UserProfileUI } from "@/components/settings/UserProfileUI";
import OrganizationSettingsPanel from "@/components/settings/panels/OrganizationSettingsPanel";
import ProfessionSettingsPanel from "@/components/settings/panels/ProfessionSettingsPanel";
import PresenceSettingsPanel from "@/components/settings/panels/PresenceSettingsPanel";
import StackSettingsPanel from "@/components/settings/panels/StackSettingsPanel";
import type { SettingsHubPageData } from "@/lib/settings-hub-server";
import { settingsHubPath } from "@/lib/settings-hub-nav";
import { tierLabelHe } from "@/lib/subscription-tier-config";

type Props = SettingsHubPageData & {
  includePlatformNav: boolean;
  userName: string;
  userEmail: string;
};

const sections = [
  { id: "profile", label: "פרופיל", icon: User },
  { id: "organization", label: "עסק", icon: Building2 },
  { id: "profession", label: "מקצוע", icon: BriefcaseBusiness },
  { id: "presence", label: "פורטל", icon: Globe },
  { id: "stack", label: "מנועים", icon: Bot },
] as const;

const advancedLinks = [
  { href: settingsHubPath("billing"), label: "מנויים וחיוב", icon: CreditCard },
  { href: settingsHubPath("automations"), label: "אוטומציות", icon: Workflow },
  { href: settingsHubPath("operations"), label: "תפעול", icon: Wrench },
] as const;

function SectionFrame({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-[28px] border border-[color:var(--cd-line)] bg-white/92 p-4 shadow-[var(--cd-shadow)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--ops-indigo)] text-white shadow-[var(--shadow-sm)]">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="truncate text-lg font-black text-[color:var(--ink-900)]">{title}</h2>
        </div>
        <a
          href="#settings-top"
          className="cd-btn cd-btn-ghost h-10 w-10 shrink-0 p-0"
          aria-label="חזרה לראש הדף"
          title="חזרה לראש הדף"
        >
          ↑
        </a>
      </div>
      <div className="[&_.mx-auto]:mx-0 [&_.max-w-5xl]:max-w-none [&_.p-8]:p-0">
        {children}
      </div>
    </section>
  );
}

export default function UnifiedSettingsWorkspace({
  organization,
  usersTotal,
  activeUsers,
  integrations,
  meckanoEnabled,
  viewer,
  includePlatformNav,
  userName,
  userEmail,
}: Props) {
  const configured = [
    organization.name,
    organization.taxId,
    organization.address,
    organization.constructionTrade,
    organization.tenantPublicDomain,
    organization.paypalMerchantEmail || organization.paypalMeSlug,
    organization.meckanoApiKey,
  ].filter(Boolean).length;
  const completion = Math.round((configured / 7) * 100);
  const allAdvancedLinks = includePlatformNav
    ? [...advancedLinks, { href: settingsHubPath("platform"), label: "פלטפורמה", icon: ShieldCheck }]
    : advancedLinks;

  return (
    <div id="settings-top" className="space-y-5" dir="rtl">
      <section className="overflow-hidden rounded-[28px] border border-[color:var(--cd-line)] bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.18),transparent_34%),linear-gradient(135deg,#111827,#312e81_58%,#0f172a)] p-5 text-white shadow-[var(--cd-shadow)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">Settings</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">מרכז הגדרות</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/76">
              כל ההגדרות החשובות במקום אחד, עם קיצורי דרך נקיים למסכים כבדים בלבד.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[28rem]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <p className="text-[11px] font-black text-white/60">מוכנות</p>
              <p className="mt-1 text-xl font-black tabular-nums">{completion}%</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <p className="text-[11px] font-black text-white/60">מנוי</p>
              <p className="mt-1 truncate text-xl font-black">{tierLabelHe(organization.subscriptionTier)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <p className="text-[11px] font-black text-white/60">צוות</p>
              <p className="mt-1 text-xl font-black tabular-nums">{activeUsers}/{usersTotal}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <p className="text-[11px] font-black text-white/60">הרשאה</p>
              <p className="mt-1 truncate text-xl font-black">{viewer.roleLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-3 z-20 rounded-[24px] border border-[color:var(--cd-line)] bg-white/90 p-2 shadow-[var(--shadow-sm)] backdrop-blur" aria-label="קפיצה להגדרות">
        <div className="flex gap-2 overflow-x-auto">
          {sections.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-transparent px-3 text-sm font-black text-[color:var(--ink-700)] transition-all duration-200 hover:border-[color:var(--cd-line)] hover:bg-[color:var(--cd-bg-sunken)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ops-indigo)] active:scale-[0.99]"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </a>
          ))}
          <span className="mx-1 h-11 w-px shrink-0 bg-[color:var(--cd-line)]" aria-hidden />
          {allAdvancedLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-[color:var(--cd-bg-sunken)] px-3 text-sm font-black text-[color:var(--ink-700)] transition-all duration-200 hover:bg-[color:var(--ink-900)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ops-indigo)] active:scale-[0.99]"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ))}
        </div>
      </nav>

      <div className="grid gap-5">
        <SectionFrame id="profile" title="פרופיל והרשאות" icon={User}>
          <UserProfileUI name={userName} email={userEmail} roleLabel={viewer.roleLabel} />
        </SectionFrame>

        <SectionFrame id="organization" title="עסק וצוות" icon={Building2}>
          <OrganizationSettingsPanel organization={organization} viewer={viewer} />
        </SectionFrame>

        <SectionFrame id="profession" title="מקצוע ושפה" icon={BriefcaseBusiness}>
          <ProfessionSettingsPanel organization={organization} viewer={viewer} />
        </SectionFrame>

        <SectionFrame id="presence" title="פורטל, מיתוג וגבייה" icon={Globe}>
          <PresenceSettingsPanel organization={organization} viewer={viewer} />
        </SectionFrame>

        <SectionFrame id="stack" title="מנועים, ענן ו-NotebookLM" icon={Bot}>
          <StackSettingsPanel
            organization={organization}
            integrations={integrations}
            meckanoEnabled={meckanoEnabled}
            viewer={viewer}
          />
        </SectionFrame>
      </div>
    </div>
  );
}
