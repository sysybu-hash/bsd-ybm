import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import WorkspaceEngineeringShell from "@/components/workspace/WorkspaceEngineeringShell";
import { PageHeader } from "@/components/ui/claude";
import ProjectDetailWorkspace from "@/components/crm/ProjectDetailWorkspace";
import AppPageChrome from "@/components/workspace/AppPageChrome";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;
  if (!organizationId) redirect("/login");

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: {
      id: true,
      name: true,
      isActive: true,
      activeFrom: true,
      activeTo: true,
      meckanoZoneId: true,
      contacts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          value: true,
          issuedDocuments: { select: { total: true, status: true } },
        },
      },
    },
  });

  if (!project) notFound();

  const contactIds = project.contacts.map((c) => c.id);

  const [expenseAgg, expenseRows, issuedRows, allProjects, meckanoZones] = await Promise.all([
    prisma.expenseRecord.aggregate({
      where: { organizationId, projectId, status: "POSTED" },
      _sum: { total: true },
    }),
    prisma.expenseRecord.findMany({
      where: { organizationId, projectId },
      orderBy: { expenseDate: "desc" },
      take: 40,
      select: {
        id: true,
        vendorName: true,
        total: true,
        expenseDate: true,
        status: true,
      },
    }),
    contactIds.length
      ? prisma.issuedDocument.findMany({
          where: { organizationId, contactId: { in: contactIds } },
          orderBy: { date: "desc" },
          take: 40,
          select: {
            id: true,
            type: true,
            number: true,
            date: true,
            total: true,
            status: true,
            clientName: true,
          },
        })
      : Promise.resolve([]),
    prisma.project.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.meckanoZone.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const contacts = project.contacts.map((c) => {
    const totalBilled = c.issuedDocuments.reduce((s, d) => s + d.total, 0);
    const totalPending = c.issuedDocuments.filter((d) => d.status === "PENDING").reduce((s, d) => s + d.total, 0);
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      value: c.value,
      totalBilled,
      totalPending,
    };
  });

  const pipelineValue = contacts.reduce((s, c) => s + (c.value ?? 0), 0);

  const messages = await readRequestMessages();
  const t = createTranslator(messages);

  const subtitle = project.isActive
    ? t("workspaceClients.projectDetail.subtitleActive", {
        count: String(contacts.length),
        pipeline: formatCurrencyILS(pipelineValue),
      })
    : t("workspaceClients.projectDetail.subtitleArchived", { count: String(contacts.length) });

  return (
    <AppPageChrome>
      <WorkspaceEngineeringShell>
        <PageHeader
          eyebrow={t("workspaceClients.projectDetail.pageEyebrow")}
          title={project.name}
          subtitle={subtitle}
          actions={
            <Link
              href="/app/crm?hub=projects"
              className="cd-btn border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
            >
              {t("workspaceClients.projectDetail.backAllProjects")}
            </Link>
          }
        />

        <ProjectDetailWorkspace
          project={{
            id: project.id,
            name: project.name,
            isActive: project.isActive,
            activeFrom: project.activeFrom?.toISOString() ?? null,
            activeTo: project.activeTo?.toISOString() ?? null,
            meckanoZoneId: project.meckanoZoneId ?? null,
          }}
          contacts={contacts}
          expensesPostedTotal={expenseAgg._sum.total ?? 0}
          expenseRows={expenseRows.map((e) => ({
            id: e.id,
            vendorName: e.vendorName,
            total: e.total,
            expenseDate: e.expenseDate.toISOString(),
            status: e.status,
          }))}
          issuedRows={issuedRows.map((d) => ({
            id: d.id,
            type: String(d.type),
            number: d.number,
            date: d.date.toISOString(),
            total: d.total,
            status: d.status,
            clientName: d.clientName,
          }))}
          allProjects={allProjects}
          meckanoZones={meckanoZones}
        />
      </WorkspaceEngineeringShell>
    </AppPageChrome>
  );
}
