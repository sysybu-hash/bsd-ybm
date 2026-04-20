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
      {/* Hero - Pro Bento style */}
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          {t("workspaceSettings.eyebrow")}
        </p>
        <h1 className="text-[30px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[36px]">
          מרכז ההגדרות
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] leading-6 text-[color:var(--ink-500)]">
          זהות עסק, מקצוע, פורטל ללקוחות, גבייה, מנועי AI וחיבורים — במבנה ברור לפי נושאים.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[color:var(--canvas-sunken)] px-3 py-1 text-[11px] font-black text-[color:var(--ink-700)]">
            {viewer.roleLabel}
          </span>
          <span className="rounded-full bg-[color:var(--canvas-sunken)] px-3 py-1 text-[11px] font-black text-[color:var(--ink-500)]">
            {canManage ? "ניהול" : "צפייה בלבד"}
          </span>
          <span className="rounded-full bg-[color:var(--axis-finance-soft)] px-3 py-1 text-[11px] font-black text-[color:var(--axis-finance-ink)]">
            {tierLabelHe(organization.subscriptionTier)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={settingsHubPath("billing")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--axis-finance)] px-3 py-2 text-[12px] font-bold text-white hover:bg-[color:var(--axis-finance-strong)]"
          >
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            מנויים וחיוב
          </Link>
          <Link
            href="/app/documents"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white hover:border-[color:var(--ink-900)]"
          >
            <Layers3 className="h-3.5 w-3.5" aria-hidden />
            מסמכים
          </Link>
        </div>
      </header>

      {/* KPI tiles row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "מוכנות פרופיל", value: `${completionRate}%`, icon: ShieldCheck, tone: "finance" as const, progress: completionRate },
          { label: "משתמשים פעילים", value: `${activeUsers}/${usersTotal}`, icon: UsersRound, tone: "clients" as const, progress: usersTotal > 0 ? Math.round((activeUsers / usersTotal) * 100) : 0 },
          { label: "מקצוע", value: profile.industryLabel, icon: BriefcaseBusiness, tone: "neutral" as const, progress: null },
          { label: "מנוי", value: organization.subscriptionStatus, icon: Sparkles, tone: "ai" as const, progress: null },
        ].map(({ label, value, icon: Icon, tone, progress }) => {
          const axisColor =
            tone === "finance" ? "var(--axis-finance)" :
            tone === "clients" ? "var(--axis-clients)" :
            tone === "ai" ? "var(--axis-ai)" : "var(--ink-900)";
          const axisSoft =
            tone === "finance" ? "var(--axis-finance-soft)" :
            tone === "clients" ? "var(--axis-clients-soft)" :
            tone === "ai" ? "var(--axis-ai-soft)" : "var(--canvas-sunken)";
          return (
            <div
              key={label}
              className="tile p-4"
              style={tone !== "neutral" ? { borderInlineStartColor: axisColor, borderInlineStartWidth: 3 } : undefined}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">{label}</p>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: axisSoft, color: axisColor }} aria-hidden>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 truncate text-[18px] font-black tabular-nums text-[color:var(--ink-900)]" title={value}>
                {value}
              </p>
              {progress !== null ? (
                <div className="mt-2 h-1.5 rounded-full bg-[color:var(--progress-track)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, background: axisColor }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Shortcuts */}
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
                className="group flex items-start gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--axis-clients)] hover:shadow-[var(--shadow-sm)]"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--axis-clients)]" aria-hidden />
                <span>
                  <span className="block text-[14px] font-black text-[color:var(--ink-900)]">{label}</span>
                  <span className="mt-1 block text-[12px] text-[color:var(--ink-500)]">{description}</span>
                </span>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="קיצורי דרך" body="תהליכים מחוץ למסך זה." icon={<Globe className="h-5 w-5" aria-hidden />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={settingsHubPath("billing")}
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-4 py-3 text-[13px] font-bold text-[color:var(--ink-900)] transition hover:bg-white hover:border-[color:var(--axis-finance)]"
            >
              מנויים, מחירון ותשלום על BSD-YBM
            </Link>
            <Link
              href={settingsHubPath("operations")}
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-4 py-3 text-[13px] font-bold text-[color:var(--ink-900)] transition hover:bg-white hover:border-[color:var(--axis-ai)]"
            >
              תפעול וחיבורים נוספים
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
