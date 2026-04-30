import Link from "next/link";
import {
  ArrowUpLeft,
  BellRing,
  Bot,
  Building2,
  CreditCard,
  Landmark,
  Megaphone,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Users2,
} from "lucide-react";
import AdminAiInlineAssist from "@/components/admin/AdminAiInlineAssist";
import AdminBroadcastNotifications from "@/components/admin/AdminBroadcastNotifications";
import PlatformPayPalOwnerCard from "@/components/admin/PlatformPayPalOwnerCard";
import AdminSystemHealth from "@/components/admin/AdminSystemHealth";
import AuditLogViewer from "@/components/admin/AuditLogViewer";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { prisma } from "@/lib/prisma";
import { formatCurrencyILS } from "@/lib/ui-formatters";

type SearchParams = Promise<{ section?: string }>;

type Props = {
  searchParams: SearchParams;
  platformBasePath: "/app/admin" | "/app/settings/platform";
};

function AdminStat({
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
    <article className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--canvas-sunken)] text-[color:var(--dash-purple)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-xs font-black text-[color:var(--ink-500)]">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-[color:var(--ink-900)]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[color:var(--ink-500)]">{hint}</p>
    </article>
  );
}

function AdminAction({
  href,
  title,
  body,
  icon: Icon,
  strong = false,
}: {
  href: string;
  title: string;
  body: string;
  icon: typeof Building2;
  strong?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
        strong
          ? "border-[color:var(--ink-900)] bg-[color:var(--ink-900)] text-white shadow-[0_20px_46px_-30px_rgba(15,23,42,0.8)]"
          : "border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] hover:border-[color:var(--line-strong)]"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${strong ? "bg-white/10 text-cyan-100" : "bg-[color:var(--canvas-sunken)] text-[color:var(--dash-purple)]"}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{title}</span>
        <span className={`mt-1 block text-xs font-semibold leading-5 ${strong ? "text-slate-300" : "text-[color:var(--ink-500)]"}`}>{body}</span>
      </span>
      <ArrowUpLeft className="mt-1 h-4 w-4 shrink-0 transition group-hover:-translate-x-1" aria-hidden />
    </Link>
  );
}

export default async function AdminPlatformDashboard({ searchParams, platformBasePath }: Props) {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session?.user?.email)) {
    redirect("/app");
  }

  const sp = await searchParams;
  const activeSection = sp.section === "broadcast" ? "broadcast" : "overview";

  const organizationId = session?.user?.organizationId ?? null;
  const [messages, organization, totalOrganizations, totalUsers, paidInvoices, pendingInvoices, recentOrganizations] =
    await Promise.all([
      readRequestMessages(),
      organizationId
        ? prisma.organization.findUnique({
            where: { id: organizationId },
            select: { industry: true, constructionTrade: true, industryConfigJson: true },
          })
        : Promise.resolve(null),
      prisma.organization.count(),
      prisma.user.count(),
      prisma.invoice.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
      prisma.organization.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          users: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: { email: true },
          },
        },
      }),
    ]);

  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  const adminUserFirstName =
    (session?.user?.name ?? "").trim().split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "";

  const totalRevenue = paidInvoices._sum.amount ?? 0;
  const pendingRevenue = pendingInvoices._sum.amount ?? 0;
  const billingControlHref = "/app/settings/billing?tab=control";
  const broadcastHref = `${platformBasePath}?section=broadcast`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-2 pb-10" dir="rtl">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[0_30px_86px_-50px_rgba(15,23,42,0.5)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">
                Platform Admin
              </p>
              <h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-[color:var(--ink-900)] sm:text-5xl">
                לוח שליטה נקי למערכת, מנויים ושידורים
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-[color:var(--ink-500)] sm:text-base">
                תמונת מצב אחת למנהל: בריאות מערכת, הכנסות, ארגונים אחרונים, הודעות למשתמשים ויומן פעולות.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={billingControlHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[color:var(--ink-900)] px-4 text-sm font-black text-white transition hover:bg-[color:var(--dash-purple)]"
              >
                <CreditCard className="h-4 w-4" aria-hidden />
                מרכז מנויים
              </Link>
              <Link
                href={activeSection === "broadcast" ? platformBasePath : broadcastHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 text-sm font-black text-[color:var(--ink-800)] transition hover:bg-[color:var(--canvas-sunken)]"
              >
                <Radio className="h-4 w-4" aria-hidden />
                {activeSection === "broadcast" ? "חזרה לסקירה" : "שידור הודעה"}
              </Link>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <AdminStat label="ארגונים" value={totalOrganizations.toString()} hint="חשבונות במערכת" icon={Building2} />
            <AdminStat label="משתמשים" value={totalUsers.toString()} hint="כלל המשתמשים" icon={Users2} />
            <AdminStat label="הכנסות ששולמו" value={formatCurrencyILS(totalRevenue)} hint="חשבוניות PAID" icon={Landmark} />
            <AdminStat label="ממתין לתשלום" value={formatCurrencyILS(pendingRevenue)} hint="חשבוניות PENDING" icon={Megaphone} />
          </div>
        </div>

        <aside className="rounded-[30px] border border-[color:var(--line)] bg-[#111827] p-5 text-white shadow-[0_30px_86px_-52px_rgba(15,23,42,0.72)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">System Health</p>
              <h2 className="mt-2 text-xl font-black">בדיקה מהירה</h2>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">
                אינדיקטורים קצרים שמובילים למסך הנכון בלי חיפוש ידני.
              </p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <AdminSystemHealth />
          </div>
          <div className="mt-4 grid gap-2">
            {organizationId ? (
              <AdminAiInlineAssist
                orgId={organizationId}
                industryProfile={industryProfile}
                userFirstName={adminUserFirstName}
              />
            ) : (
              <Link
                href="/app/ai"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
              >
                <Bot className="h-4 w-4" aria-hidden />
                Intelligence
              </Link>
            )}
            {platformBasePath === "/app/admin" ? (
              <Link
                href="/app/admin/steel"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100"
              >
                <ShieldAlert className="h-4 w-4" aria-hidden />
                Steel Lock
              </Link>
            ) : null}
          </div>
        </aside>
      </section>

      {activeSection === "broadcast" ? (
        <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">Broadcast</p>
              <h2 className="mt-2 text-2xl font-black text-[color:var(--ink-900)]">שידור הודעה למשתמשים</h2>
            </div>
            <Link
              href={platformBasePath}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 text-sm font-black text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
            >
              חזרה ללוח
              <ArrowUpLeft className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <AdminBroadcastNotifications />
        </section>
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <AdminAction href={billingControlHref} title="ניהול מנויים" body="אישורים, תשלומים פתוחים ומצב חבילות." icon={CreditCard} strong />
            <AdminAction href={broadcastHref} title="שידור למשתמשים" body="הודעת מערכת לכל המשתמשים הפעילים." icon={BellRing} />
            <AdminAction href="/app/ai" title="מרכז AI" body="בדיקת מנועים, עוזר פנימי ושירותי פענוח." icon={Bot} />
            <AdminAction href="/app/settings/platform" title="הגדרות פלטפורמה" body="כלים מתקדמים למנהלי BSD-YBM." icon={ShieldCheck} />
          </section>

          <PlatformPayPalOwnerCard />

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">Recent Organizations</p>
                  <h2 className="mt-2 text-2xl font-black text-[color:var(--ink-900)]">ארגונים שנכנסו לאחרונה</h2>
                </div>
                <Link
                  href={billingControlHref}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 text-sm font-black text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
                >
                  טבלת מנויים
                  <ArrowUpLeft className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="mt-5 divide-y divide-[color:var(--line)] overflow-hidden rounded-2xl border border-[color:var(--line)]">
                {recentOrganizations.map((organization) => (
                  <div key={organization.id} className="flex flex-col gap-3 bg-[color:var(--canvas-raised)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[color:var(--ink-900)]">{organization.name}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-[color:var(--ink-500)]">
                        {organization.users[0]?.email ?? "ללא אימייל ראשי"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[color:var(--canvas-sunken)] px-3 py-1 text-xs font-black text-[color:var(--ink-600)]">
                        {organization.subscriptionTier}
                      </span>
                      <Link
                        href={`${billingControlHref}&orgId=${organization.id}`}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-[color:var(--dash-purple)] px-3 text-xs font-black text-white hover:bg-[color:var(--ink-900)]"
                      >
                        ניהול
                        <ArrowUpLeft className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">Daily Admin</p>
              <h2 className="mt-2 text-xl font-black text-[color:var(--ink-900)]">מה בודקים כאן</h2>
              <div className="mt-5 space-y-3">
                {[
                  "האם יש תשלומים פתוחים שמחכים לטיפול.",
                  "האם כל מנועי המערכת זמינים לעבודה.",
                  "האם צריך לשדר הודעה תפעולית למשתמשים.",
                  "מי שינה הגדרות קריטיות ביומן הפעולות.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-3">
                    <p className="text-sm font-bold leading-6 text-[color:var(--ink-700)]">{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="rounded-[30px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">Audit Trail</p>
              <h2 className="mt-2 text-2xl font-black text-[color:var(--ink-900)]">יומן פעולות קריטיות</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[color:var(--ink-500)]">
                שינויי מנוי, שידורים, מחיקות ועדכוני מערכת מרוכזים כאן כדי שיהיה ברור מה קרה ומתי.
              </p>
            </div>
            <AuditLogViewer />
          </section>
        </>
      )}
    </div>
  );
}
