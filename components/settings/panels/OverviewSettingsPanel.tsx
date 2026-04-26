"use client";

import Link from "next/link";
import {
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { settingsHubPath } from "@/lib/settings-hub-nav";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { tierLabelHe } from "@/lib/subscription-tier-config";
import type { SettingsHubOrganizationRecord, SettingsHubViewer } from "@/lib/settings-hub-server";
import { useI18n } from "@/components/I18nProvider";

type Props = Readonly<{
  organization: SettingsHubOrganizationRecord;
  usersTotal: number;
  activeUsers: number;
  viewer: SettingsHubViewer;
}>;

const SETUP_LINKS = [
  {
    href: settingsHubPath("organization"),
    title: "זהות עסק ומיסוי",
    body: "שם ארגון, סוג ישות, ח.פ/ע.מ, כתובת וצוות.",
    icon: Building2,
  },
  {
    href: settingsHubPath("profession"),
    title: "תחום בניה ושפה מקצועית",
    body: "התאמת שמות, תבניות ופיענוח לפי סוג העבודה.",
    icon: BriefcaseBusiness,
  },
  {
    href: settingsHubPath("stack"),
    title: "מנועים וחיבורים",
    body: "Document AI, Gemini, OpenAI, ענן, גיבוי ו-Meckano.",
    icon: Bot,
  },
  {
    href: settingsHubPath("presence"),
    title: "פורטל וגבייה מלקוחות",
    body: "דומיין, מיתוג, PayPal וקישור לקוחות.",
    icon: Globe,
  },
] as const;

export default function OverviewSettingsPanel({
  organization,
  usersTotal,
  activeUsers,
  viewer,
}: Props) {
  const { messages } = useI18n();
  const profile = getIndustryProfile(
    organization.industry,
    organization.industryConfigJson,
    organization.constructionTrade,
    messages,
  );

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
  const activePct = usersTotal > 0 ? Math.round((activeUsers / usersTotal) * 100) : 0;

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[color:var(--ops-indigo)]">
              Settings command center
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--ink-900)]">
              מרכז ההפעלה של BSD-YBM
            </h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[color:var(--ink-500)]">
              כאן מגדירים את הזהות העסקית, תחום הבניה, מנועי הפיענוח, הפורטל, הגבייה, המנוי והאוטומציות. כל אזור מנהל נושא אחד בלבד כדי לא ליצור כפילויות.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={settingsHubPath("organization")} className="bento-btn bento-btn--primary">
                התחל מהארגון
                <Building2 className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={settingsHubPath("stack")} className="bento-btn bento-btn--secondary">
                בדוק מנועים
                <Bot className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-black text-[color:var(--ink-500)]">מוכנות מערכת</span>
              <span className="text-2xl font-black tabular-nums text-[color:var(--ops-indigo)]">{completion}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div className="h-full rounded-full bg-[color:var(--ops-indigo)]" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-3 text-[12px] leading-6 text-[color:var(--ink-500)]">
              {completion < 70
                ? "יש עוד הגדרות בסיסיות להשלים לפני שימוש מלא."
                : "המערכת מוכנה לעבודה שוטפת. כדאי לעבור על מנועים ואוטומציות."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="מנוי פעיל" value={tierLabelHe(organization.subscriptionTier)} icon={CreditCard} />
        <Metric label="תחום עבודה" value={profile.industryLabel} icon={BriefcaseBusiness} />
        <Metric label="משתמשים פעילים" value={`${activeUsers}/${usersTotal}`} icon={UsersRound} progress={activePct} />
        <Metric label="הרשאה" value={viewer.roleLabel} icon={ShieldCheck} />
      </div>

      <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-1 border-b border-[color:var(--line-subtle)] pb-4">
          <h2 className="text-lg font-black text-[color:var(--ink-900)]">הגדרות לפי אחריות</h2>
          <p className="text-[13px] leading-6 text-[color:var(--ink-500)]">
            במקום חלון ארוך עם הכל ביחד, כל אזור מוביל למסך ייעודי וברור.
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SETUP_LINKS.map(({ href, title, body, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex gap-3 rounded-lg border border-[color:var(--line)] bg-white p-4 transition hover:border-[color:var(--ops-indigo)] hover:shadow-[var(--shadow-sm)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--axis-ai-soft)] text-[color:var(--ops-indigo)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-black text-[color:var(--ink-900)]">{title}</span>
                <span className="mt-1 block text-[12px] leading-5 text-[color:var(--ink-500)]">{body}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-lg font-black text-[color:var(--ink-900)]">כללי סדר במערכת</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {[
            "פרטי העסק נמצאים רק בארגון ומיסוי.",
            "מנועי סריקה וחיבורי API נמצאים רק במנועים וחיבורים.",
            "מנוי BSD-YBM מופרד מגבייה מלקוחות.",
          ].map((rule) => (
            <div key={rule} className="flex items-start gap-3 rounded-lg bg-[color:var(--canvas-sunken)] p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--state-success)]" aria-hidden />
              <p className="text-[12px] font-semibold leading-6 text-[color:var(--ink-700)]">{rule}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
  progress?: number;
}) {
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[color:var(--ink-500)]">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--axis-ai-soft)] text-[color:var(--ops-indigo)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 truncate text-xl font-black text-[color:var(--ink-900)]" title={value}>{value}</p>
      {typeof progress === "number" ? (
        <div className="mt-3 h-1.5 rounded-full bg-[color:var(--progress-track)]">
          <div className="h-full rounded-full bg-[color:var(--ops-teal)]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}
