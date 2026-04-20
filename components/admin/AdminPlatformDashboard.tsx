import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CreditCard,
  Megaphone,
  ShieldCheck,
  Users2,
} from "lucide-react";
import AdminBroadcastNotifications from "@/components/admin/AdminBroadcastNotifications";
import PlatformPayPalOwnerCard from "@/components/admin/PlatformPayPalOwnerCard";
import AdminSystemHealth from "@/components/admin/AdminSystemHealth";
import AuditLogViewer from "@/components/admin/AuditLogViewer";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
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

  const [totalOrganizations, totalUsers, paidInvoices, pendingInvoices, recentOrganizations] =
    await Promise.all([
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

  const totalRevenue = paidInvoices._sum.amount ?? 0;
  const pendingRevenue = pendingInvoices._sum.amount ?? 0;

  const billingControlHref = "/app/settings/billing?tab=control";
  const broadcastToggleHref =
    activeSection === "broadcast" ? platformBasePath : `${platformBasePath}?section=broadcast`;

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">Platform Control</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              מרכז השליטה של הפלטפורמה: בריאות מערכת, מנויים, שידורים ותמונה רוחבית של כל הארגונים.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              מכאן רואים את מצב המערכת, עוקבים אחרי הכנסות ותשלומים פתוחים, ונכנסים במהירות לכלי הבקרה שחשובים
              למנהלי BSD-YBM.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={billingControlHref} className="v2-button v2-button-primary">
                מרכז מנויים
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/ai" className="v2-button v2-button-secondary">
                Intelligence
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={broadcastToggleHref} className="v2-button v2-button-secondary">
                {activeSection === "broadcast" ? "חזרה לסקירה" : "שידור למשתמשים"}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="v2-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[color:var(--v2-ink)]">בריאות מערכת</p>
                <p className="mt-1 text-sm leading-7 text-[color:var(--v2-muted)]">
                  אינדיקטורים מהירים שמובילים למסך הנכון בלי לחפש ידנית.
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <div className="mt-5 rounded-[24px] bg-[color:var(--v2-canvas)] px-3 py-2">
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
          <article key={label} className="v2-panel p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">
              {value}
            </p>
          </article>
        ))}
      </section>

      {activeSection === "overview" ? (
        <>
          <PlatformPayPalOwnerCard />

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="v2-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="v2-eyebrow">ארגונים אחרונים</span>
                  <h2 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)]">
                    הארגונים האחרונים שנכנסו למערכת.
                  </h2>
                </div>
                <Link href={billingControlHref} className="v2-button v2-button-secondary">
                  טבלת מנויים מלאה
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="mt-6 grid gap-3">
                {recentOrganizations.map((organization) => (
                  <div
                    key={organization.id}
                    className="flex flex-col gap-3 rounded-[24px] border border-[color:var(--v2-line)] bg-white/86 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-[color:var(--v2-ink)]">{organization.name}</p>
                      <p className="mt-1 text-sm text-[color:var(--v2-muted)]">
                        {organization.users[0]?.email ?? "ללא אימייל ראשי"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[color:var(--v2-canvas)] px-3 py-1 text-xs font-black text-[color:var(--v2-muted)]">
                        {organization.subscriptionTier}
                      </span>
                      <Link
                        href={`${billingControlHref}&orgId=${organization.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--v2-accent)] px-4 py-2 text-xs font-black text-white"
                      >
                        ניהול מנוי
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="v2-panel v2-panel-highlight p-6">
              <p className="text-sm font-black text-[color:var(--v2-ink)]">מה נגיש מכאן</p>
              <div className="mt-4 grid gap-3">
                {[
                  "גישה ישירה למרכז המנויים המלא.",
                  "תמונת מצב תפעולית דרך System Health.",
                  "שידור רוחבי לכל המשתמשים הפעילים.",
                  "מעבר מהיר ל-Intelligence ולבקרת החיוב.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/82 px-4 py-4">
                    <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="v2-panel p-6">
            <div className="mb-5">
              <span className="v2-eyebrow">Audit Trail</span>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)]">
                יומן פעולות מרוכז לכל שינוי קריטי
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--v2-muted)]">
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
