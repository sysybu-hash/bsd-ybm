import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/is-admin";
import {
  buildMonthlyExpenseSeries,
  sumExpensesInCalendarMonth,
  formatExpenseTrendVsPrevious,
} from "@/lib/erp-stats";
import { getPriceSpikeAlerts } from "@/lib/erp-price-spikes";
import { getErpPriceComparisonForOrg } from "@/lib/erp-price-comparison-data";
import { getServerTranslator } from "@/lib/i18n/server";
import { intlLocaleForApp } from "@/lib/i18n/intl-locale";
import { DocStatus } from "@prisma/client";
import type { Document } from "@prisma/client";
import { tierAllowance } from "@/lib/subscription-tier-config";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";
import type { ErpStatCard } from "@/components/ERPDashboard";
import { dedupeOrganizationsForCrmDisplay } from "../crm/dedupe-organizations";
import type { CrmAdminOrganizationRow } from "../crm/CrmOrganizationsAdminTable";
import BusinessHubClient from "./BusinessHubClient";

export const metadata = { title: "מרכז עסקי — BSD-YBM" };

export default async function BusinessPage() {
  const { t, locale } = await getServerTranslator();
  const intlTag = intlLocaleForApp(locale);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const email = session.user.email?.trim().toLowerCase() ?? "";
  const platformDev = isAdmin(email);
  const userId = session.user.id;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  const orgId = dbUser?.organizationId ?? session.user.organizationId ?? null;

  /* ── ERP data ──────────────────────────────────── */
  let rawDocs: Document[] = [];
  if (orgId) {
    rawDocs = await prisma.document.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
  }

  const totalExpenses = rawDocs.reduce(
    (s, d) => s + ((d.aiData as { total?: number })?.total ?? 0),
    0,
  );
  const now = new Date();
  const expenseThisMonth = sumExpensesInCalendarMonth(rawDocs, now.getFullYear(), now.getMonth());
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const expensePrevMonth = sumExpensesInCalendarMonth(rawDocs, prevMonth.getFullYear(), prevMonth.getMonth());
  const avgPerDoc = rawDocs.length > 0 ? Math.round(totalExpenses / rawDocs.length) : 0;

  const stats: ErpStatCard[] = [
    {
      label: t("erpPage.statMonthExpenses"),
      value: `\u20aa${expenseThisMonth.toLocaleString(intlTag)}`,
      trend: formatExpenseTrendVsPrevious(expenseThisMonth, expensePrevMonth, t),
      valueClass: "text-indigo-600",
    },
    {
      label: t("erpPage.statDocsInView"),
      value: String(rawDocs.length),
      trend: t("erpPage.trendAllDocs"),
      valueClass: "text-gray-900",
    },
    {
      label: t("erpPage.statAvgInvoice"),
      value: rawDocs.length ? `\u20aa${avgPerDoc.toLocaleString(intlTag)}` : "\u2014",
      trend: t("erpPage.statAvgTrend"),
      valueClass: "text-emerald-600",
    },
  ];

  const chartData = buildMonthlyExpenseSeries(rawDocs, 6, locale);

  let flowSummary: {
    totalItems: number;
    totalIssued: number;
    totalExpenses: number;
  } | null = null;
  let priceSpikes: Awaited<ReturnType<typeof getPriceSpikeAlerts>> = [];

  if (orgId) {
    const [distinctLineKeys, issuedSum, spikes] = await Promise.all([
      prisma.documentLineItem.findMany({
        where: { organizationId: orgId },
        distinct: ["normalizedKey"],
        select: { normalizedKey: true },
      }),
      prisma.issuedDocument.aggregate({
        where: { organizationId: orgId, status: { not: DocStatus.CANCELLED } },
        _sum: { total: true },
      }),
      getPriceSpikeAlerts(orgId, 8),
    ]);
    priceSpikes = spikes;
    flowSummary = {
      totalItems: distinctLineKeys.length,
      totalIssued: issuedSum._sum.total ?? 0,
      totalExpenses,
    };
  }

  const geminiConfigured = !!(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  );

  const orgQuota = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          cheapScansRemaining: true,
          premiumScansRemaining: true,
          subscriptionTier: true,
        },
      })
    : null;

  const scanQuotaSummary =
    orgQuota != null
      ? (() => {
          const a = tierAllowance(orgQuota.subscriptionTier);
          return `\u05d6\u05d5\u05dc\u05d5\u05ea ${formatCreditsForDisplay(orgQuota.cheapScansRemaining)} / ${a.cheapScans} \u00b7 \u05e4\u05e8\u05d9\u05de\u05d9\u05d5\u05dd ${formatCreditsForDisplay(orgQuota.premiumScansRemaining)} / ${a.premiumScans}`;
        })()
      : null;

  const priceComparison = orgId ? await getErpPriceComparisonForOrg(orgId) : null;

  const docs = rawDocs.map((d) => ({
    id: d.id,
    fileName: d.fileName,
    type: d.type,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    aiData: d.aiData,
  }));

  /* ── Org billing info (for document preview/edit in CRM) ──────────────── */
  let orgBilling: {
    name: string;
    address: string | null;
    taxId: string | null;
    companyType: import("@prisma/client").CompanyType;
    isReportable: boolean;
  } | null = null;

  if (orgId) {
    const ob = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, address: true, taxId: true, companyType: true, isReportable: true },
    });
    if (ob) orgBilling = ob;
  }

  /* ── CRM data ──────────────────────────────────── */
  type InvoiceSerRow = {
    id: string; type: string; number: number; clientName: string;
    amount: number; vat: number; total: number; status: string;
    date: string; dueDate: string | null;
    items: { desc: string; qty: number; price: number }[]; createdAt: string;
  };
  type ErpSumRow = { totalBilled: number; totalPaid: number; totalPending: number; invoiceCount: number };
  type ContactSerialized = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    value: number | null;
    status: string;
    project: { id: string; name: string } | null;
    createdAt: string;
    issuedDocuments: InvoiceSerRow[];
    erp: ErpSumRow;
  };
  type ProjectSerialized = {
    id: string;
    name: string;
    isActive: boolean;
    activeFrom: string | null;
    activeTo: string | null;
  };

  let contacts: ContactSerialized[] = [];
  let projects: ProjectSerialized[] = [];
  let organizations: CrmAdminOrganizationRow[] = [];

  if (orgId) {
    const [rawContacts, rawProjects] = await Promise.all([
      prisma.contact.findMany({
        where: { organizationId: orgId },
        include: {
          project: { select: { id: true, name: true } },
          issuedDocuments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true, type: true, number: true, clientName: true,
              amount: true, vat: true, total: true, status: true,
              date: true, dueDate: true, items: true, createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    contacts = rawContacts.map((c) => {
      const invDocs = (c.issuedDocuments ?? []).map((d) => ({
        id: d.id,
        type: d.type,
        number: d.number,
        clientName: d.clientName,
        amount: d.amount,
        vat: d.vat,
        total: d.total,
        status: d.status,
        date: d.date.toISOString(),
        dueDate: d.dueDate?.toISOString() ?? null,
        items: d.items as { desc: string; qty: number; price: number }[],
        createdAt: d.createdAt.toISOString(),
      }));
      const totalBilled = invDocs.reduce((s, d) => s + d.total, 0);
      const totalPaid = invDocs.filter((d) => d.status === "PAID").reduce((s, d) => s + d.total, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone ?? null,
        notes: c.notes ?? null,
        value: c.value ?? null,
        status: c.status,
        project: c.project,
        createdAt: c.createdAt.toISOString(),
        issuedDocuments: invDocs,
        erp: {
          totalBilled,
          totalPaid,
          totalPending: totalBilled - totalPaid,
          invoiceCount: invDocs.length,
        },
      };
    });

    projects = rawProjects.map((p) => ({
      id: p.id,
      name: p.name,
      isActive: p.isActive,
      activeFrom: p.activeFrom?.toISOString() ?? null,
      activeTo: p.activeTo?.toISOString() ?? null,
    }));
  }

  if (platformDev) {
    const orgsRaw = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
        users: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const orgIds = orgsRaw.map((o) => o.id);
    const invSums =
      orgIds.length > 0
        ? await prisma.invoice.groupBy({
            by: ["organizationId"],
            where: { organizationId: { in: orgIds } },
            _sum: { amount: true },
          })
        : [];
    const totalByOrgId = new Map(
      invSums.map((s) => [s.organizationId, s._sum.amount ?? 0]),
    );
    organizations = dedupeOrganizationsForCrmDisplay(orgsRaw, totalByOrgId);
  }

  return (
    <BusinessHubClient
      geminiConfigured={geminiConfigured}
      scanQuotaSummary={scanQuotaSummary}
      stats={stats}
      chartData={chartData as { name: string; value: number }[]}
      flowSummary={flowSummary}
      priceSpikes={priceSpikes}
      docs={docs}
      priceComparison={priceComparison as any}
      contacts={contacts}
      projects={projects}
      hasOrganization={Boolean(orgId)}
      organizations={organizations}
      showUnifiedBillingLinks={platformDev}
      orgBilling={orgBilling}
    />
  );
}