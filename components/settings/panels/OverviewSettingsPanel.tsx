"use client";

import Link from "next/link";
import { Bot, BriefcaseBusiness, Building2, CheckCircle2, Globe } from "lucide-react";
import { settingsHubPath } from "@/lib/settings-hub-nav";
import { tierLabelHe } from "@/lib/subscription-tier-config";
import type { SettingsHubOrganizationRecord, SettingsHubViewer } from "@/lib/settings-hub-server";
import { BentoGrid, Tile, TileHeader } from "@/components/ui/bento";

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

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Hero: Control Center ── */}
      <Tile tone="ai" span={12}>
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tile-eyebrow">Settings · Control Center</p>
              <h1 className="mt-2 text-[32px] font-black tracking-tight text-white leading-none">
                מרכז ההפעלה
              </h1>
              <p className="mt-2 text-sm text-violet-200 font-bold max-w-md">
                כאן מגדירים את הליבה של BSD-YBM: זהות עסקית, מנועי AI, אוטומציה וחיוב.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
              <Bot className="h-7 w-7 text-white" aria-hidden />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm shadow-sm transition hover:bg-white/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200">מוכנות מערכת</p>
              <p className="mt-1 text-2xl font-black text-white tracking-tight">{completion}%</p>
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-white shadow-[0_0_10px_white]" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm shadow-sm transition hover:bg-white/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200">מנוי פעיל</p>
              <p className="mt-1 text-2xl font-black text-white tracking-tight">{tierLabelHe(organization.subscriptionTier)}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm shadow-sm transition hover:bg-white/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200">משתמשים</p>
              <p className="mt-1 text-2xl font-black text-white tracking-tight">{activeUsers}/{usersTotal}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm shadow-sm transition hover:bg-white/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200">הרשאה</p>
              <p className="mt-1 text-2xl font-black text-white tracking-tight truncate">{viewer.roleLabel}</p>
            </div>
          </div>
        </div>
      </Tile>

      <BentoGrid>
        <Tile tone="neutral" span={12}>
          <TileHeader eyebrow="הגדרות לפי אזור" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {SETUP_LINKS.map(({ href, title, body, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all hover:border-violet-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-colors group-hover:bg-violet-600 group-hover:text-white group-hover:ring-violet-600">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-slate-900 leading-tight">{title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500 font-medium">{body}</p>
                </div>
              </Link>
            ))}
          </div>
        </Tile>

        <Tile tone="neutral" span={12}>
          <TileHeader eyebrow="כללי סדר במערכת" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {[
              "פרטי העסק מוגדרים במרכז הזהות והמיסוי.",
              "מנועי AI וחיבורי API מנוהלים תחת 'מנועים וחיבורים'.",
              "מנוי BSD-YBM מופרד לחלוטין ממערכות הגבייה שלכם.",
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                <p className="text-[13px] font-bold leading-6 text-slate-700">{rule}</p>
              </div>
            ))}
          </div>
        </Tile>
      </BentoGrid>
    </div>
  );
}
