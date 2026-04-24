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

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  const [
    organization,
    documentsCount,
    activeClientsCount,
    hasMeckanoAccess,
    issuedThisMonth,
    issuedPrevMonth,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true, constructionTrade: true },
    }),
    prisma.document.count({ where: { organizationId } }),
    prisma.contact.count({ where: { organizationId, status: "ACTIVE" } }),
    canAccessMeckano(session),
    prisma.issuedDocument.aggregate({
      where: { organizationId, date: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, date: { gte: prevMonthStart, lt: monthStart } },
      _sum: { total: true },
    }),
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

  return (
    <div className="w-full min-w-0" dir={dirRtl ? "rtl" : "ltr"}>
      <ExecutiveDashboard
        scanUsed={documentsCount}
        scanLimit={scanLimit}
        cashDisplay={formatCurrencyILS(issuedThisSum)}
        cashChangePct={financeTrendPct}
        meckanoFieldActive={activeClientsCount}
        hasMeckano={hasMeckanoAccess}
        constructionTrade={organization?.constructionTrade}
      />
    </div>
  );
}
