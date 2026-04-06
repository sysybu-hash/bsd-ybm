import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";
import type { ReactNode } from "react";
import { ArrowLeftRight, CircleCheckBig, CreditCard, Shield, Users, Zap, TrendingUp, BarChart3, CheckCircle2, ArrowLeft } from "lucide-react";
import OperatorOnboardingPanel from "@/components/control-center/OperatorOnboardingPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type FunnelMetric = {
  route: string;
  views: number;
  next: number;
  completion: number;
};

function parseNumberFromDetails(details: string | null, key: string): number | null {
  if (!details) return null;
  const m = new RegExp(`${key}=([0-9]+)`).exec(details);
  if (!m) return null;
  return Number(m[1]);
}

function parseStringFromDetails(details: string | null, key: string): string | null {
  if (!details) return null;
  const m = new RegExp(`${key}=([^;]+)`).exec(details);
  return m?.[1] ?? null;
}

function pct(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function fmtDate(d: Date | null): string {
  if (!d) return "לא זמין";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function nextBestAction(funnel: FunnelMetric[]): { title: string; description: string; href: string; cta: string } {
  const sorted = [...funnel].sort((a, b) => {
    const aRate = a.views > 0 ? a.completion / a.views : 0;
    const bRate = b.views > 0 ? b.completion / b.views : 0;
    return aRate - bRate;
  });

  const weakest = sorted[0];
  if (!weakest || weakest.views === 0) {
    return {
      title: "השלם קודם את הבסיס",
      description: "עדיין אין מספיק נתוני שימוש, אז עדיף להתחיל מהגדרות העסק, מנוי ומשתמשים.",
      href: "/dashboard/settings",
      cta: "פתח הגדרות",
    };
  }

  if (weakest.route === "CRM Wizard") {
    return {
      title: "חזק את מסלול ה-CRM",
      description: "השלמת ה-CRM נמוכה יחסית. עדיף להכווין משתמשים ישירות למסך הלקוחות והפרויקטים.",
      href: "/dashboard/crm#crm-wizard",
      cta: "פתח CRM",
    };
  }

  if (weakest.route === "Invoice Wizard") {
    return {
      title: "פשט את מסלול החשבוניות",
      description: "מסלול החשבוניות הוא כרגע נקודת החיכוך העיקרית. עדיף להתחיל ישר ממסך ההנפקה.",
      href: "/dashboard/erp/invoice",
      cta: "פתח חשבוניות",
    };
  }

  if (weakest.route === "Onboarding Checklist") {
    return {
      title: "סגור את האונבורדינג",
      description: "לפני כלים מתקדמים, כדאי להשלים את רשימת ההפעלה לצוות.",
      href: "/dashboard/control-center",
      cta: "פתח צ'קליסט",
    };
  }

  return {
    title: "החזר את הפוקוס למסך הבית",
    description: "מסלול הכניסה הציבורי עדיין חלש. עדיף להוביל משתמשים להרשמה או התחברות קצרה וישירה.",
    href: "/dashboard",
    cta: "חזרה לבית",
  };
}

export default async function ControlCenterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organizationId) {
    redirect("/login");
  }

  const orgId = session.user.organizationId;
  const ownerMode = isAdmin(session.user.email);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [org, pendingUsers, activeUsers, wizardEvents] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    }),
    prisma.user.count({ where: { organizationId: orgId, accountStatus: "PENDING_APPROVAL" } }),
    prisma.user.count({ where: { organizationId: orgId, accountStatus: "ACTIVE" } }),
    prisma.activityLog.findMany({
      where: {
        organizationId: orgId,
        action: { startsWith: "WIZARD:" },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      select: { action: true, details: true, createdAt: true },
      take: 3000,
    }),
  ]);

  const funnel: FunnelMetric[] = [
    { route: "Site Wizard", views: 0, next: 0, completion: 0 },
    { route: "CRM Wizard", views: 0, next: 0, completion: 0 },
    { route: "Invoice Wizard", views: 0, next: 0, completion: 0 },
    { route: "Onboarding Checklist", views: 0, next: 0, completion: 0 },
  ];

  for (const ev of wizardEvents) {
    if (ev.action === "WIZARD:site_step_view") {
      funnel[0].views += 1;
      const step = parseStringFromDetails(ev.details, "step");
      if (step === "join" || step === "setup" || step === "operate") funnel[0].next += 1;
      if (step === "operate") funnel[0].completion += 1;
      continue;
    }
    if (ev.action === "WIZARD:site_nav_next") {
      funnel[0].next += 1;
      continue;
    }

    if (ev.action === "WIZARD:crm_step_view") {
      funnel[1].views += 1;
      const step = parseNumberFromDetails(ev.details, "step");
      if (step !== null && step >= 2) funnel[1].next += 1;
      if (step === 3) funnel[1].completion += 1;
      continue;
    }

    if (ev.action === "WIZARD:invoice_step_view") {
      funnel[2].views += 1;
      const step = parseNumberFromDetails(ev.details, "step");
      if (step !== null && step >= 2) funnel[2].next += 1;
      if (step === 4) funnel[2].completion += 1;
      continue;
    }

    if (ev.action === "WIZARD:ops_onboarding_progress") {
      funnel[3].views += 1;
      const progress = parseNumberFromDetails(ev.details, "progress");
      if (progress !== null && progress >= 25) funnel[3].next += 1;
      if (progress !== null && progress >= 100) funnel[3].completion += 1;
    }
  }

  const latestWizardEventAt = wizardEvents[0]?.createdAt ?? null;
  const recommendedAction = nextBestAction(funnel);

  return (
    <div className="space-y-6" dir="rtl">

      {/* HEADER */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-6 py-7 md:px-8">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-500" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1 text-[11px] font-bold text-teal-400">
              <CircleCheckBig size={11} /> מצב תפעול פשוט
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900">מרכז שליטה ותפעול</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-400">
              כל הפעולות החשובות מרוכזות כאן. ניהול מנוי, צוות, ניתוח שימוש והמלצות.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70">ארגון</p>
            <p className="mt-1.5 text-lg font-black text-gray-900">{org?.name ?? "לא נמצא"}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70">מנוי</p>
            <p className="mt-1.5 text-lg font-black text-gray-900">{org?.subscriptionTier ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-emerald-500/[0.08] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">משתמשים פעילים</p>
            <p className="mt-1.5 text-lg font-black text-gray-900">{activeUsers}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${pendingUsers > 0 ? "border-amber-500/25 bg-amber-500/[0.08]" : "border-gray-100 bg-gray-50"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${pendingUsers > 0 ? "text-amber-400/70" : "text-gray-400"}`}>ממתינים לאישור</p>
            <p className={`mt-1.5 text-lg font-black ${pendingUsers > 0 ? "text-amber-400" : "text-gray-400"}`}>{pendingUsers}</p>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">

        <div className="lg:col-span-2">
          <OperatorOnboardingPanel />
        </div>

        {/* Next best action */}
        <article className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-1 flex items-center gap-2 text-base font-black text-gray-900">
            <Zap size={16} className="text-indigo-400" />
            מה לעשות עכשיו
          </h2>
          <p className="mb-4 text-xs text-gray-400">המלצה אחת ברורה לפי הנתונים הנוכחיים</p>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.08] p-4">
            <p className="text-sm font-black text-gray-900">{recommendedAction.title}</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">{recommendedAction.description}</p>
            <Link
              href={recommendedAction.href}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-500/25 hover:bg-indigo-400 transition-colors"
            >
              {recommendedAction.cta} <ArrowLeft size={13} />
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <QuickPanel
              icon={<CreditCard size={15} className="text-rose-400" />}
              title="מנוי ותשלום"
              description="בדיקת חבילה ומסלול תשלום."
              href="/dashboard/billing"
              cta="פתח"
              accent="rose"
            />
            <QuickPanel
              icon={<Users size={15} className="text-indigo-400" />}
              title="צוות והרשאות"
              description="אישור משתמשים וניהול תפקידים."
              href="/dashboard/settings?tab=account"
              cta="פתח"
              accent="indigo"
            />
          </div>
        </article>

        {/* Funnel metrics */}
        <article className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-1 flex items-center gap-2 text-base font-black text-gray-900">
            <BarChart3 size={16} className="text-indigo-400" />
            דוח שימוש — מסלולים
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            {latestWizardEventAt
              ? `עדכון: ${new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" }).format(latestWizardEventAt)}`
              : "אין עדיין נתוני Wizard."}
          </p>
          <div className="space-y-3">
            {funnel.map((row) => (
              <div key={row.route} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[13px] font-bold text-gray-900">{row.route}</p>
                  <span className="rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                    {pct(row.completion, row.views)} השלמה
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: row.views > 0 ? `${Math.round((row.completion / row.views) * 100)}%` : "0%" }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
                  <MetricChip label="צפיות" value={String(row.views)} />
                  <MetricChip label="התקדמות" value={String(row.next)} tone="blue" />
                  <MetricChip label="השלמות" value={String(row.completion)} tone="green" />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Quick shortcuts */}
        <article className="rounded-2xl border border-gray-100 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-base font-black text-gray-900">
            <Shield size={16} className="text-emerald-400" />
            קיצורי דרך חשובים
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <QuickLink href="/dashboard/settings" title="הגדרות עסק" subtitle="שם עסק, מס ואינטגרציות" color="indigo" />
            <QuickLink href="/dashboard/crm" title="CRM" subtitle="לקוחות ופרויקטים" color="indigo" />
            <QuickLink href="/dashboard/erp/invoice" title="חשבוניות" subtitle="הפקה ותשלומים" color="blue" />
            {ownerMode ? (
              <QuickLink href="/dashboard/admin" title="חדר מצב" subtitle="זמין לבעלים בלבד" color="amber" />
            ) : (
              <QuickLink href="/dashboard/help" title="מדריך" subtitle="רצף הפעלה מקוצר" color="emerald" />
            )}
          </div>
        </article>

      </div>

      {/* WORKFLOW TIP */}
      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-5">
        <p className="text-sm font-black text-amber-300">רצף עבודה מומלץ:</p>
        <ol className="mt-2 list-decimal space-y-1 pe-5 text-sm text-amber-200/75">
          <li>בדוק מנוי פעיל ומסלול תשלום.</li>
          <li>הגדר פרטי ארגון ותשלום במסך ההגדרות.</li>
          <li>הזמן משתמשים לצוות והקצא תפקידים.</li>
          <li>עבור למסכי CRM/ERP להפעלה שוטפת.</li>
        </ol>
        <p className="mt-2 text-xs text-amber-300/60">תאריך ניסיון חינם: {fmtDate(org?.trialEndsAt ?? null)}</p>
      </section>
    </div>
  );
}

function QuickPanel({
  icon,
  title,
  description,
  href,
  cta,
  accent = "slate",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  accent?: "rose" | "indigo" | "slate";
}) {
  const borderClass = accent === "rose" ? "border-rose-500/25 bg-rose-500/[0.08]" : accent === "indigo" ? "border-indigo-500/25 bg-indigo-500/[0.08]" : "border-gray-100 bg-gray-50";
  return (
    <div className={`rounded-xl border p-3 ${borderClass}`}>
      <p className="inline-flex items-center gap-2 text-sm font-black text-gray-900">{icon}{title}</p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
      <Link href={href} className="mt-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">{cta}</Link>
    </div>
  );
}

function MetricChip({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "blue" | "green";
}) {
  const toneClass = tone === "blue" ? "text-indigo-300" : tone === "green" ? "text-emerald-300" : "text-gray-900";
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-1.5">
      <p className="text-[9px] text-gray-400">{label}</p>
      <p className={`text-sm font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

const QUICK_LINK_COLORS: Record<string, string> = {
  indigo: "border-indigo-500/25 hover:border-indigo-500/40 hover:bg-indigo-500/[0.08]",
  blue: "border-indigo-500/25 hover:border-indigo-500/40 hover:bg-indigo-500/[0.08]",
  amber: "border-amber-500/25 hover:border-amber-500/40 hover:bg-amber-500/[0.08]",
  emerald: "border-emerald-500/25 hover:border-emerald-500/40 hover:bg-emerald-500/[0.08]",
  slate: "border-gray-100 hover:border-gray-300 hover:bg-gray-50",
};

function QuickLink({ href, title, subtitle, color = "slate" }: { href: string; title: string; subtitle: string; color?: string }) {
  return (
    <Link href={href} className={`rounded-2xl border bg-gray-50 p-4 transition-all ${QUICK_LINK_COLORS[color] ?? QUICK_LINK_COLORS.slate}`}>
      <p className="text-sm font-black text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
    </Link>
  );
}
