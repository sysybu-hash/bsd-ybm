import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import FinanceHubContent from "@/components/finance/FinanceHubContent";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import type { IndustryType } from "@/lib/professions/config";
import type { FinanceExpenseRow, FinanceIssuedRow } from "@/lib/finance-workspace-types";
import { loadCommercialHubSnapshot } from "@/lib/workspace/load-commercial-hub";
import WorkspaceEngineeringShell from "@/components/workspace/WorkspaceEngineeringShell";
import ErpScrollToHash from "@/components/ErpScrollToHash";
import ErpScanExpenseBridge from "@/components/finance/ErpScanExpenseBridge";
import AppPageChrome from "@/components/workspace/AppPageChrome";

export const dynamic = "force-dynamic";

const validFinanceTabs = ["overview", "documents", "collection", "expenses"] as const;

export default async function ErpPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tabParam = typeof sp.tab === "string" ? sp.tab : undefined;
  const initialFinanceTab =
    tabParam && (validFinanceTabs as readonly string[]).includes(tabParam)
      ? (tabParam as (typeof validFinanceTabs)[number])
      : undefined;
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) redirect("/login");

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    snapshot,
    organization,
    issuedForTable,
    expensesRaw,
    expenseMonthPosted,
    contactPick,
    projectPick,
  ] = await Promise.all([
    loadCommercialHubSnapshot(organizationId),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { industry: true, constructionTrade: true, industryConfigJson: true },
    }),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { date: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        number: true,
        status: true,
        clientName: true,
        total: true,
        date: true,
        contactId: true,
        contact: {
          select: {
            email: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.expenseRecord.findMany({
      where: { organizationId },
      orderBy: { expenseDate: "desc" },
      take: 80,
      include: {
        project: { select: { name: true } },
        contact: { select: { name: true } },
      },
    }),
    prisma.expenseRecord.aggregate({
      where: {
        organizationId,
        status: "POSTED",
        expenseDate: { gte: monthStart },
      },
      _sum: { total: true },
    }),
    prisma.contact.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const issuedDocuments: FinanceIssuedRow[] = issuedForTable.map((d) => ({
    id: d.id,
    type: d.type,
    number: d.number,
    status: d.status,
    clientName: d.clientName,
    total: d.total,
    date: d.date.toISOString(),
    contactId: d.contactId,
    projectName: d.contact?.project?.name ?? null,
    projectId: d.contact?.project?.id ?? null,
    contactEmail: d.contact?.email ?? null,
  }));

  const expenses: FinanceExpenseRow[] = expensesRaw.map((e) => ({
    id: e.id,
    vendorName: e.vendorName,
    invoiceNumber: e.invoiceNumber,
    description: e.description,
    expenseDate: e.expenseDate.toISOString(),
    total: e.total,
    amountNet: e.amountNet,
    vat: e.vat,
    allocation: e.allocation,
    status: e.status,
    projectId: e.projectId,
    contactId: e.contactId,
    projectName: e.project?.name ?? null,
    contactName: e.contact?.name ?? null,
  }));

  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  const userFirstName =
    (session.user?.name ?? "").trim().split(" ")[0] ||
    session.user?.email?.split("@")[0] ||
    "";

  const industryForScan = (organization?.industry ?? "CONSTRUCTION") as IndustryType;

  const projectOptions = projectPick.map((p) => ({ id: p.id, name: p.name }));
  const contactOptions = contactPick.map((c) => ({ id: c.id, name: c.name }));

  return (
    <AppPageChrome>
    <WorkspaceEngineeringShell>
      <ErpScrollToHash />
      <div id="erp-wizard" className="scroll-mt-24" />
      <FinanceHubContent
        snapshot={snapshot}
        organizationId={organizationId}
        industryProfile={industryProfile}
        userFirstName={userFirstName}
        issuedDocuments={issuedDocuments}
        expenses={expenses}
        expenseMonthPostedTotal={expenseMonthPosted._sum.total ?? 0}
        projectOptions={projectOptions}
        contactOptions={contactOptions}
        initialFinanceTab={initialFinanceTab}
      />
      <section className="mt-10 w-full min-w-0 scroll-mt-24" aria-label="סריקת מסמכים">
        <ErpScanExpenseBridge industry={industryForScan} />
      </section>
    </WorkspaceEngineeringShell>
    </AppPageChrome>
  );
}
