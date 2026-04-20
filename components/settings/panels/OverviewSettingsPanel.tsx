"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Cpu,
  CreditCard,
  Globe,
  Layers3,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import type { SettingsHubCoreSegmentId } from "@/lib/settings-hub-nav";
import { settingsHubPath } from "@/lib/settings-hub-nav";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { tierLabelHe } from "@/lib/subscription-tier-config";
import type { SettingsHubOrganizationRecord, SettingsHubViewer } from "@/lib/settings-hub-server";
import { SectionCard } from "@/components/settings/settings-form-primitives";

const OVERVIEW_SHORTCUTS: ReadonlyArray<{
  id: Exclude<SettingsHubCoreSegmentId, "overview">;
  label: string;
  description: string;
  icon: typeof Building2;
}> = [
  { id: "organization", label: "ארגון ומס", description: "זהות רשמית", icon: Building2 },
  { id: "profession", label: "מקצוע ושפה", description: "תחום ומילים", icon: BriefcaseBusiness },
  { id: "presence", label: "נוכחות דיגיטלית", description: "פורטל וגבייה", icon: Globe },
  { id: "stack", label: "מנועים וחיבורים", description: "AI וענן", icon: Cpu },
];

type Props = Readonly<{
  organization: SettingsHubOrganizationRecord;
  usersTotal: number;
  activeUsers: number;
  viewer: SettingsHubViewer;
}>;

export default function OverviewSettingsPanel({
  organization,
  usersTotal,
  activeUsers,
  viewer,
}: Props) {
  const { messages, t } = useI18n();
  const canManage = viewer.canManageOrganization;

  const profile = useMemo(
    () =>
      getIndustryProfile(
        organization.industry,
        organization.industryConfigJson,
        organization.constructionTrade,
        messages,
      ),
    [organization.industry, organization.industryConfigJson, organization.constructionTrade, messages],
  );

  const completionRate = Math.round(
    ([organization.taxId, organization.address, organization.tenantPublicDomain, organization.paypalMerchantEmail || organization.paypalMeSlug].filter(
      Boolean,
    ).length /
      4) *
      100,
  );

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <span className="v2-eyebrow">{t("workspaceSettings.eyebrow")}</span>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-4xl lg:text-5xl">
              מרכז ההגדרות
            </h1>
            <p className="mt-4 text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              זהות עסק, מקצוע, פורטל ללקוחות, גבייה, מנועי AI וחיבורים — במבנה ברור לפי נושאים.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-ink)]">
                {viewer.roleLabel}
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">
                {canManage ? "ניהול" : "צפייה בלבד"}
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">
                {tierLabelHe(organization.subscriptionTier)}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={settingsHubPath("billing")} className="v2-button v2-button-primary">
                מנויים וחיוב (BSD-YBM)
                <CreditCard className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/documents" className="v2-button v2-button-secondary">
                מסמכים
                <Layers3 className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-lg">
            {[
              { label: "מוכנות פרופיל", value: `${completionRate}%`, icon: ShieldCheck },
              { label: "משתמשים פעילים", value: `${activeUsers}/${usersTotal}`, icon: UsersRound },
              { label: "מקצוע", value: profile.industryLabel, icon: BriefcaseBusiness },
              { label: "מנוי", value: organization.subscriptionStatus, icon: Sparkles },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="v2-panel rounded-2xl p-4">
                <Icon className="h-4 w-4 text-[color:var(--v2-accent)]" aria-hidden />
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[color:var(--v2-muted)]">{label}</p>
                <p className="mt-1 truncate text-lg font-black text-[color:var(--v2-ink)]" title={value}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="min-w-0 space-y-4">
        <SectionCard
          title="אזורים במרכז ההגדרות"
          body="כל קישור מוביל לעמוד ייעודי — בלי גלילה ארוכה באותו מסך."
          icon={<Sparkles className="h-5 w-5" aria-hidden />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {OVERVIEW_SHORTCUTS.map(({ id, label, description, icon: Icon }) => (
              <Link
                key={id}
                href={settingsHubPath(id)}
                className="flex items-start gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/90 p-4 text-start transition hover:border-[color:var(--v2-accent)] hover:bg-[color:var(--v2-accent-soft)]"
              >
                <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
                <span>
                  <span className="block font-black text-[color:var(--v2-ink)]">{label}</span>
                  <span className="mt-1 block text-sm text-[color:var(--v2-muted)]">{description}</span>
                </span>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="קיצורי דרך" body="תהליכים מחוץ למסך זה." icon={<Globe className="h-5 w-5" aria-hidden />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={settingsHubPath("billing")}
              className="rounded-2xl border border-[color:var(--v2-line)] bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-bold text-[color:var(--v2-ink)] transition hover:bg-white"
            >
              מנויים, מחירון ותשלום על BSD-YBM
            </Link>
            <Link
              href={settingsHubPath("operations")}
              className="rounded-2xl border border-[color:var(--v2-line)] bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-bold text-[color:var(--v2-ink)] transition hover:bg-white"
            >
              תפעול וחיבורים נוספים
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
