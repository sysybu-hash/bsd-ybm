"use client";

import Link from "next/link";
import {
  ArrowUpLeft,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  KeyRound,
  PlugZap,
  ShieldCheck,
  Users2,
  Wrench,
} from "lucide-react";
import { settingsHubPath } from "@/lib/settings-hub-nav";
import { tierLabelHe } from "@/lib/subscription-tier-config";
import type { SettingsHubOrganizationRecord, SettingsHubViewer } from "@/lib/settings-hub-server";

type Props = Readonly<{
  organization: SettingsHubOrganizationRecord;
  usersTotal: number;
  activeUsers: number;
  viewer: SettingsHubViewer;
}>;

type SetupLink = {
  href: string;
  title: string;
  body: string;
  icon: typeof Building2;
  ready: boolean;
  action: string;
  tone: string;
};

function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${ready ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" : "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.14)]"}`}
      aria-hidden
    />
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Building2;
}) {
  return (
    <article className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.55)]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--canvas-sunken)] text-[color:var(--dash-purple)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-xs font-black text-[color:var(--ink-500)]">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-[color:var(--ink-900)]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[color:var(--ink-500)]">{hint}</p>
    </article>
  );
}

export default function OverviewSettingsPanel({ organization, usersTotal, activeUsers, viewer }: Props) {
  const setupItems: SetupLink[] = [
    {
      href: settingsHubPath("organization"),
      title: "זהות עסק ומיסוי",
      body: "שם עסק, ח.פ/ע.מ, כתובת, סוג ישות ופרטי דיווח.",
      icon: Building2,
      ready: Boolean(organization.name && organization.taxId && organization.address),
      action: "עדכון פרטי עסק",
      tone: "bg-sky-50 text-sky-700",
    },
    {
      href: settingsHubPath("profession"),
      title: "תחום בנייה ושפה מקצועית",
      body: "התאמת תבניות, מינוחים ופענוח מסמכים לפי סוג העבודה.",
      icon: BriefcaseBusiness,
      ready: Boolean(organization.constructionTrade),
      action: "הגדרת תחום",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      href: settingsHubPath("stack"),
      title: "מנועים וחיבורים",
      body: "Document AI, Gemini, OpenAI, גיבוי, ענן וחיבורי תפעול.",
      icon: PlugZap,
      ready: Boolean(organization.meckanoApiKey || organization.liveDataTier !== "FREE"),
      action: "בדיקת חיבורים",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      href: settingsHubPath("presence"),
      title: "פורטל, גבייה ומיתוג",
      body: "דומיין לקוחות, PayPal, מיתוג וקישורי תשלום.",
      icon: Globe,
      ready: Boolean(organization.tenantPublicDomain || organization.paypalMerchantEmail || organization.paypalMeSlug),
      action: "ניהול נוכחות",
      tone: "bg-rose-50 text-rose-700",
    },
  ];

  const configured = [
    organization.name,
    organization.taxId,
    organization.address,
    organization.constructionTrade,
    organization.tenantPublicDomain,
    organization.paypalMerchantEmail || organization.paypalMeSlug,
    organization.meckanoApiKey || organization.liveDataTier !== "FREE",
  ].filter(Boolean).length;
  const completion = Math.round((configured / 7) * 100);
  const pendingItems = setupItems.filter((item) => !item.ready);
  const nextAction = pendingItems[0] ?? setupItems[2];
  const NextIcon = nextAction.icon;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-2 pb-10" dir="rtl">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[0_28px_80px_-46px_rgba(15,23,42,0.42)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">
                Settings Command
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--ink-900)] sm:text-4xl">
                מרכז הגדרות ברור לעסק
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[color:var(--ink-500)]">
                כל מה שמגדיר את סביבת העבודה במקום אחד: זהות עסקית, משתמשים, מנועים, גבייה ופורטל לקוחות.
              </p>
            </div>
            <Link
              href={nextAction.href}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[color:var(--ink-900)] px-5 text-sm font-black text-white shadow-[0_18px_34px_-20px_rgba(15,23,42,0.7)] transition hover:bg-[color:var(--dash-purple)]"
            >
              <NextIcon className="h-4 w-4" aria-hidden />
              {nextAction.action}
              <ArrowUpLeft className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <StatCard label="מוכנות מערכת" value={`${completion}%`} hint={`${configured}/7 הגדרות ליבה הושלמו`} icon={ShieldCheck} />
            <StatCard label="מנוי פעיל" value={tierLabelHe(organization.subscriptionTier)} hint={organization.subscriptionStatus || "סטטוס מנוי"} icon={CreditCard} />
            <StatCard label="משתמשים פעילים" value={`${activeUsers}/${usersTotal}`} hint="משתמשים בארגון" icon={Users2} />
            <StatCard label="הרשאה שלך" value={viewer.roleLabel} hint={viewer.canManageOrganization ? "ניהול מלא זמין" : "גישה מוגבלת"} icon={KeyRound} />
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[color:var(--canvas-sunken)]">
            <div
              className="h-full rounded-full bg-gradient-to-l from-emerald-500 via-cyan-500 to-violet-600"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <aside className="rounded-[28px] border border-[color:var(--line)] bg-[#111827] p-5 text-white shadow-[0_28px_80px_-46px_rgba(15,23,42,0.62)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">Next Step</p>
              <h2 className="mt-2 text-xl font-black">{pendingItems.length ? "נשאר להשלים" : "המערכת מסודרת"}</h2>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
              <Wrench className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-2">
              <StatusDot ready={nextAction.ready} />
              <p className="text-sm font-black">{nextAction.title}</p>
            </div>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">{nextAction.body}</p>
            <Link
              href={nextAction.href}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-slate-950 transition hover:bg-cyan-100"
            >
              לפתיחה
              <ArrowUpLeft className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {setupItems.map(({ href, title, body, icon: Icon, ready, action, tone }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-[178px] flex-col justify-between rounded-[24px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[0_18px_46px_-36px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] hover:shadow-[0_24px_54px_-38px_rgba(15,23,42,0.55)]"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-2.5 py-1 text-[11px] font-black text-[color:var(--ink-600)]">
                  <StatusDot ready={ready} />
                  {ready ? "מוכן" : "לטיפול"}
                </span>
              </div>
              <h3 className="mt-4 text-base font-black text-[color:var(--ink-900)]">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--ink-500)]">{body}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[color:var(--dash-purple)]">
              {action}
              <ArrowUpLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" aria-hidden />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)]">
        <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">Operating Rules</p>
              <h2 className="mt-2 text-xl font-black text-[color:var(--ink-900)]">כללי סדר במערכת</h2>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              "פרטי העסק והמיסוי נשמרים במרכז הזהות ומשפיעים על מסמכים וגבייה.",
              "מנועי AI וחיבורי API מנוהלים באזור מנועים, כדי למנוע כפילות.",
              "מנוי BSD-YBM מופרד ממערכות הגבייה של הלקוחות שלך.",
            ].map((rule) => (
              <div key={rule} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-4">
                <p className="text-sm font-bold leading-7 text-[color:var(--ink-700)]">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Bot className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">AI Stack</p>
              <h2 className="text-lg font-black text-[color:var(--ink-900)]">מנועים ותפעול חכם</h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-3">
              <span className="text-sm font-black text-[color:var(--ink-800)]">Document / Gemini / OpenAI</span>
              <span className="text-xs font-black text-emerald-600">מנוהל</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-3">
              <span className="text-sm font-black text-[color:var(--ink-800)]">Meckano / ענן / גיבוי</span>
              <span className="text-xs font-black text-[color:var(--ink-500)]">{organization.meckanoApiKey ? "מחובר" : "אופציונלי"}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
