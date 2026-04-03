import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";
import type { ReactNode } from "react";
import { ArrowLeftRight, CircleCheckBig, CreditCard, Shield, Users } from "lucide-react";
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
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
          <CircleCheckBig size={14} />
          מצב תפעול פשוט
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">מרכז שליטה ותפעול</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          זה המסך שממנו מנהלים את האתר בפועל. כל הפעולות החשובות מרוכזות כאן כדי שלא תצטרך לחפש בין עמודים.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">ארגון</p>
            <p className="mt-1 text-base font-black text-slate-900">{org?.name ?? "לא נמצא"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">מנוי</p>
            <p className="mt-1 text-base font-black text-slate-900">{org?.subscriptionTier ?? "-"}</p>
            <p className="text-xs text-slate-600">{org?.subscriptionStatus ?? ""}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">משתמשים פעילים</p>
            <p className="mt-1 text-base font-black text-slate-900">{activeUsers}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">ממתינים לאישור</p>
            <p className="mt-1 text-base font-black text-slate-900">{pendingUsers}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="lg:col-span-2">
          <OperatorOnboardingPanel />
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-black text-slate-900">מה לעשות עכשיו</h2>
          <p className="text-sm text-slate-600">המסך הזה נותן המלצה אחת ברורה לפי הנתונים, במקום להעמיס עשרות החלטות.</p>
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-black text-emerald-950">{recommendedAction.title}</p>
            <p className="mt-2 text-sm leading-6 text-emerald-900">{recommendedAction.description}</p>
            <Link href={recommendedAction.href} className="mt-4 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">{recommendedAction.cta}</Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QuickPanel
              icon={<CreditCard size={16} className="text-rose-600" />}
              title="מנוי ותשלום"
              description="בדיקה מהירה של חבילה ותשלום לפני כל פעולה אחרת."
              href="/dashboard/billing"
              cta="פתח מנוי"
            />
            <QuickPanel
              icon={<Users size={16} className="text-violet-600" />}
              title="צוות והרשאות"
              description="אישור משתמשים והקצאת תפקידים בלי לחפש בין מסכים."
              href="/dashboard/settings?tab=account"
              cta="פתח משתמשים"
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-900">
            <ArrowLeftRight size={18} className="text-blue-600" />
            דוח שימוש מקוצר
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            צפיות, התקדמות והשלמה לכל מסלול.
            {latestWizardEventAt
              ? ` עדכון אחרון: ${new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" }).format(latestWizardEventAt)}`
              : " אין עדיין אירועי Wizard."}
          </p>
          <div className="space-y-3">
            {funnel.map((row) => (
              <div key={row.route} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-900">{row.route}</p>
                  <p className="text-xs font-bold text-slate-500">{pct(row.completion, row.views)} השלמה</p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <MetricChip label="צפיות" value={String(row.views)} />
                  <MetricChip label="התקדמות" value={String(row.next)} tone="blue" />
                  <MetricChip label="השלמות" value={String(row.completion)} tone="green" />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-900">
            <Shield size={18} className="text-emerald-600" />
            קיצורי דרך חשובים
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <QuickLink href="/dashboard/settings" title="הגדרות עסק" subtitle="שם עסק, מס ואינטגרציות" />
            <QuickLink href="/dashboard/crm" title="CRM" subtitle="לקוחות ופרויקטים" />
            <QuickLink href="/dashboard/erp/invoice" title="חשבוניות" subtitle="הפקה ותשלומים" />
            {ownerMode ? (
              <QuickLink href="/dashboard/admin" title="חדר מצב" subtitle="זמין לבעלים בלבד" />
            ) : (
              <QuickLink href="/dashboard/help" title="מדריך" subtitle="רצף הפעלה מקוצר" />
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-bold">רצף עבודה מומלץ:</p>
        <ol className="mt-2 list-decimal space-y-1 pe-5">
          <li>בדוק מנוי פעיל ומסלול תשלום.</li>
          <li>הגדר פרטי ארגון ותשלום במסך ההגדרות.</li>
          <li>הזמן משתמשים לצוות והקצה תפקידים.</li>
          <li>עבור למסכי CRM/ERP להפעלה שוטפת.</li>
        </ol>
        <p className="mt-2 text-xs text-amber-800">תאריך ניסיון חינם: {fmtDate(org?.trialEndsAt ?? null)}</p>
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
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="inline-flex items-center gap-2 text-sm font-black text-slate-900">{icon}{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <Link href={href} className="mt-3 inline-flex rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{cta}</Link>
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
  const toneClass = tone === "blue"
    ? "text-blue-700"
    : tone === "green"
      ? "text-emerald-700"
      : "text-slate-900";

  return (
    <div className="rounded-xl bg-white p-2">
      <p className="text-slate-500">{label}</p>
      <p className={`text-base font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function QuickLink({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
      <p className="text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </Link>
  );
}
