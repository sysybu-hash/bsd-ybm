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
    include: {
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

  const expenseAgg = await prisma.expenseRecord.aggregate({
    where: { organizationId, projectId, status: "POSTED" },
    _sum: { total: true },
  });

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

  return (
    <AppPageChrome>
    <WorkspaceEngineeringShell>
      <PageHeader
        eyebrow="פרויקט"
        title={project.name}
        subtitle={
          project.isActive
            ? `פעיל · ${contacts.length} לקוחות · צפי ${formatCurrencyILS(pipelineValue)}`
            : `בארכיון · ${contacts.length} לקוחות`
        }
        actions={
          <Link href="/app/crm" className="cd-btn border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]">
            כל הפרויקטים
          </Link>
        }
      />

      <ProjectDetailWorkspace
        organizationId={organizationId}
        project={{
          id: project.id,
          name: project.name,
          isActive: project.isActive,
          activeFrom: project.activeFrom?.toISOString() ?? null,
          activeTo: project.activeTo?.toISOString() ?? null,
        }}
        contacts={contacts}
        expensesPostedTotal={expenseAgg._sum.total ?? 0}
      />
    </WorkspaceEngineeringShell>
    </AppPageChrome>
  );
}
