import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import WorkspaceEngineeringShell from "@/components/workspace/WorkspaceEngineeringShell";
import { PageHeader } from "@/components/ui/claude";
import ClientDetailWorkspace from "@/components/crm/ClientDetailWorkspace";
import AppPageChrome from "@/components/workspace/AppPageChrome";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;
  if (!organizationId) redirect("/login");

  const { clientId } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id: clientId, organizationId },
    include: {
      project: { select: { id: true, name: true } },
      issuedDocuments: {
        orderBy: { date: "desc" },
        take: 40,
        select: { id: true, type: true, number: true, status: true, total: true, date: true },
      },
    },
  });

  if (!contact) notFound();

  const projectOptions = await prisma.project.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const expenses = await prisma.expenseRecord.findMany({
    where: { organizationId, contactId: clientId },
    orderBy: { expenseDate: "desc" },
    take: 40,
    select: {
      id: true,
      vendorName: true,
      total: true,
      expenseDate: true,
      status: true,
      allocation: true,
    },
  });

  const totalBilled = contact.issuedDocuments.reduce((s, d) => s + d.total, 0);
  const totalPending = contact.issuedDocuments
    .filter((d) => d.status === "PENDING")
    .reduce((s, d) => s + d.total, 0);

  return (
    <AppPageChrome>
    <WorkspaceEngineeringShell>
      <PageHeader
        eyebrow="לקוח"
        title={contact.name}
        subtitle={`${contact.status} · צפי ${formatCurrencyILS(contact.value ?? 0)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/crm"
              className="cd-btn border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
            >
              כל הפרויקטים והלקוחות
            </Link>
            <Link href="/app/erp#erp-wizard" className="cd-btn cd-btn-primary">
              הפקת מסמך
            </Link>
          </div>
        }
      />

      <ClientDetailWorkspace
        contact={{
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          status: contact.status,
          value: contact.value,
          notes: contact.notes,
          project: contact.project,
        }}
        issuedDocuments={contact.issuedDocuments.map((d) => ({
          id: d.id,
          type: d.type,
          number: d.number,
          status: d.status,
          total: d.total,
          date: d.date.toISOString(),
        }))}
        expenses={expenses.map((e) => ({
          id: e.id,
          vendorName: e.vendorName,
          total: e.total,
          expenseDate: e.expenseDate.toISOString(),
          status: e.status,
          allocation: e.allocation,
        }))}
        totalBilled={totalBilled}
        totalPending={totalPending}
        projectOptions={projectOptions}
      />
    </WorkspaceEngineeringShell>
    </AppPageChrome>
  );
}
