import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { COOKIE_LOCALE, isRtlLocale, normalizeLocale } from "@/lib/i18n/config";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import { tierAllowance } from "@/lib/subscription-tier-config";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/login");

  const organizationId = session.user.organizationId;
  const userFirstName =
    (session.user?.name ?? "").trim().split(" ")[0] ||
    session.user?.email?.split("@")[0] ||
    "";

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  // חישוב 6 חודשים אחורה לגרף sparkline
  const sparkMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monthStart);
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });

  const [
    organization,
    activeClientsCount,
    activeProjectsCount,
    openDealsCount,
    issuedThisMonth,
    issuedPrevMonth,
    recentProjectsRaw,
    recentDocumentsRaw,
    sparklineRaw,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true, constructionTrade: true },
    }),
    prisma.contact.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.project.count({ where: { organizationId, isActive: true } }),
    prisma.contact.count({
      where: { organizationId, status: { in: ["LEAD", "PROPOSAL"] } },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, date: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, date: { gte: prevMonthStart, lt: monthStart } },
      _sum: { total: true },
    }),
    prisma.project.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: { select: { contacts: true } },
      },
    }),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        clientName: true,
        total: true,
        status: true,
        date: true,
      },
    }),
    // sparkline: סכום לכל אחד מ-6 החודשים האחרונים
    Promise.all(
      sparkMonths.map((from) => {
        const to = new Date(from);
        to.setMonth(to.getMonth() + 1);
        return prisma.issuedDocument
          .aggregate({
            where: { organizationId, date: { gte: from, lt: to } },
            _sum: { total: true },
          })
          .then((r) => r._sum.total ?? 0);
      }),
    ),
  ]);

  const jar = await cookies();
  const uiLocale = normalizeLocale(jar.get(COOKIE_LOCALE)?.value);
  const dirRtl = isRtlLocale(uiLocale);

  const tier = organization?.subscriptionTier ?? "FREE";
  const allowance = tierAllowance(tier);
  const scanLimit = Math.max(1, allowance.cheapScans + allowance.premiumScans);

  const issuedThisSum = issuedThisMonth._sum.total ?? 0;
  const issuedPrevSum = issuedPrevMonth._sum.total ?? 0;
  const financeTrendPct =
    issuedPrevSum > 0
      ? Math.round(((issuedThisSum - issuedPrevSum) / issuedPrevSum) * 100)
      : issuedThisSum > 0
        ? 100
        : 0;

  // ספירת מסמכים שנסרקו (כאן נשתמש במספר המסמכים שהופקו כגישה פשוטה)
  const scanUsed = await prisma.document.count({ where: { organizationId } });

  const recentProjects = recentProjectsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    isActive: p.isActive,
    contactCount: p._count.contacts,
  }));

  const recentDocuments = recentDocumentsRaw.map((doc) => ({
    id: doc.id,
    kind: String(doc.type),
    contactName: doc.clientName ?? null,
    total: doc.total,
    status: String(doc.status),
    dateStr: doc.date.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <div className="w-full min-w-0 px-4 pb-8 pt-6 sm:px-6" dir={dirRtl ? "rtl" : "ltr"}>
      <ExecutiveDashboard
        userFirstName={userFirstName}
        scanUsed={scanUsed}
        scanLimit={scanLimit}
        cashDisplay={formatCurrencyILS(issuedThisSum)}
        cashChangePct={financeTrendPct}
        activeClientsCount={activeClientsCount}
        activeProjectsCount={activeProjectsCount}
        openDealsCount={openDealsCount}
        recentProjects={recentProjects}
        recentDocuments={recentDocuments}
        sparklineValues={sparklineRaw as number[]}
        constructionTrade={organization?.constructionTrade}
      />
    </div>
  );
}
