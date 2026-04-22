import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CreditCard,
  Megaphone,
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
  /** נתיב בסיס לדף זה — לניווט פנימי (שידור / סקירה) */
  platformBasePath: "/app/admin" | "/app/settings/platform";
};

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
  const broadcastToggleHref =
    activeSection === "broadcast" ? platformBasePath : `${platformBasePath}?section=broadcast`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-8" dir="rtl">
      <section className="tile tile--lavender overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">Platform Control</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--ink-900)] sm:text-5xl">
              מרכז השליטה של הפלטפורמה: בריאות מערכת, מנויים, שידורים ותמונה רוחבית של כל הארגונים.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--ink-500)] sm:text-lg">
              מכאן רואים את מצב המערכת, עוקבים אחרי הכנסות ותשלומים פתוחים, ונכנסים במהירות לכלי הבקרה שחשובים
              למנהלי BSD-YBM.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={billingControlHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--ink-900)] px-4 py-2.5 text-sm font-black text-white shadow-[var(--shadow-sm)] hover:bg-[color:var(--ink-800)]"
              >
                מרכז מנויים
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              {organizationId ? (
                <AdminAiInlineAssist
                  orgId={organizationId}
                  industryProfile={industryProfile}
                  userFirstName={adminUserFirstName}
                />
              ) : (
                <Link
                  href="/app/ai#assistant"
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
                >
                  Intelligence
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
              <Link
                href={broadcastToggleHref}
                className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
              >
                {activeSection === "broadcast" ? "חזרה לסקירה" : "שידור למשתמשים"}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="tile p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[color:var(--ink-900)]">בריאות מערכת</p>
                <p className="mt-1 text-sm leading-7 text-[color:var(--ink-500)]">
                  אינדיקטורים מהירים שמובילים למסך הנכון בלי לחפש ידנית.
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai)]">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <div className="mt-5 rounded-[24px] bg-[color:var(--canvas-sunken)] px-3 py-2">
              <AdminSystemHealth />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "ארגונים", value: totalOrganizations.toString(), icon: Building2 },
          { label: "משתמשים", value: totalUsers.toString(), icon: Users2 },
          { label: "הכנסות ששולמו", value: formatCurrencyILS(totalRevenue), icon: CreditCard },
          { label: "ממתין לתשלום", value: formatCurrencyILS(pendingRevenue), icon: Megaphone },
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="tile p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai)]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-bold text-[color:var(--ink-500)]">{label}</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[color:var(--ink-900)]">
              {value}
            </p>
          </article>
        ))}
      </section>

      {activeSection === "overview" ? (
        <>
          <PlatformPayPalOwnerCard />

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="tile p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">ארגונים אחרונים</span>
                  <h2 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[color:var(--ink-900)]">
                    הארגונים האחרונים שנכנסו למערכת.
                  </h2>
                </div>
                <Link
                  href={billingControlHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
                >
                  טבלת מנויים מלאה
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="mt-6 grid gap-3">
                {recentOrganizations.map((organization) => (
                  <div
                    key={organization.id}
                    className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-[color:var(--ink-900)]">{organization.name}</p>
                      <p className="mt-1 text-sm text-[color:var(--ink-500)]">
                        {organization.users[0]?.email ?? "ללא אימייל ראשי"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[color:var(--canvas-sunken)] px-3 py-1 text-xs font-black text-[color:var(--ink-500)]">
                        {organization.subscriptionTier}
                      </span>
                      <Link
                        href={`${billingControlHref}&orgId=${organization.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--axis-clients)] px-4 py-2 text-xs font-black text-white hover:bg-[color:var(--axis-clients-strong)]"
                      >
                        ניהול מנוי
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="tile tile--mint p-6">
              <p className="text-sm font-black text-[color:var(--ink-900)]">מה נגיש מכאן</p>
              <div className="mt-4 grid gap-3">
                {[
                  "גישה ישירה למרכז המנויים המלא.",
                  "תמונת מצב תפעולית דרך System Health.",
                  "שידור רוחבי לכל המשתמשים הפעילים.",
                  "מעבר מהיר ל-Intelligence ולבקרת החיוב.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 py-4">
                    <p className="text-sm leading-7 text-[color:var(--ink-900)]">{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="tile p-6">
            <div className="mb-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">Audit Trail</span>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-[color:var(--ink-900)]">
                יומן פעולות מרוכז לכל שינוי קריטי
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--ink-500)]">
                מי מחק, מי שידר, מי עדכן מנוי ומי שינה הגדרות. הכול מרוכז כאן כדי שלא תצטרך לנחש מה קרה.
              </p>
            </div>
            <AuditLogViewer />
          </section>
        </>
      ) : null}

      {activeSection === "broadcast" ? <AdminBroadcastNotifications /> : null}
    </div>
  );
}
