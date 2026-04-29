import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientsWorkspaceV2 from "@/components/crm/ClientsWorkspaceV2";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import WorkspaceEngineeringShell from "@/components/workspace/WorkspaceEngineeringShell";
import AppPageChrome from "@/components/workspace/AppPageChrome";
import { PageHeader } from "@/components/ui/claude";

export const dynamic = "force-dynamic";

function clientInsightLine(c: {
  notes: string | null;
  totalBilled: number;
  totalPending: number;
  invoiceCount: number;
}): string {
  const n = c.notes?.trim();
  if (n) return n.length > 140 ? `${n.slice(0, 140)}…` : n;
  if (c.totalPending > 0) return `יתרה לגבייה: ${formatCurrencyILS(c.totalPending)}`;
  if (c.totalBilled > 0) return `הופק: ${formatCurrencyILS(c.totalBilled)} · ${c.invoiceCount} מסמכים`;
  return "אין היסטוריית הופקה";
}

function resolveInitialHub(opts: {
  initialClientId?: string;
  initialProjectFilter?: string;
  hub?: string;
}): "projects" | "clients" {
  if (opts.initialClientId) return "clients";
  if (opts.hub?.toLowerCase() === "projects") return "projects";
  if (opts.initialProjectFilter) return "clients";
  return "projects";
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; clientId?: string; hub?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) redirect("/login");

  const userFirstName =
    (session.user?.name ?? "").trim().split(" ")[0] ||
    session.user?.email?.split("@")[0] ||
    "";

  const sp = await searchParams;

  const [organization, contactsRaw, projectsRaw] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { industry: true, constructionTrade: true, industryConfigJson: true },
    }),
    prisma.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        status: true,
        value: true,
        createdAt: true,
        project: { select: { id: true, name: true } },
        issuedDocuments: { select: { total: true, status: true } },
      },
    }),
    prisma.project.findMany({
      where: { organizationId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
        activeFrom: true,
        activeTo: true,
        _count: { select: { contacts: true } },
      },
    }),
  ]);

  const projectMetrics = new Map<string, { totalValue: number; activeDeals: number }>();

  const contacts = contactsRaw.map((contact) => {
    const totalBilled = contact.issuedDocuments.reduce((sum, d) => sum + d.total, 0);
    const totalPending = contact.issuedDocuments
      .filter((d) => d.status === "PENDING")
      .reduce((sum, d) => sum + d.total, 0);

    if (contact.project?.id) {
      const current = projectMetrics.get(contact.project.id) ?? { totalValue: 0, activeDeals: 0 };
      current.totalValue += contact.value ?? 0;
      if (contact.status !== "CLOSED_LOST") current.activeDeals += 1;
      projectMetrics.set(contact.project.id, current);
    }

    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
      status: contact.status,
      value: contact.value,
      createdAt: contact.createdAt.toISOString(),
      project: contact.project,
      invoiceCount: contact.issuedDocuments.length,
      totalBilled,
      totalPending,
      insightLine: clientInsightLine({ notes: contact.notes, totalBilled, totalPending, invoiceCount: contact.issuedDocuments.length }),
    };
  });

  const projects = projectsRaw.map((project) => {
    const metrics = projectMetrics.get(project.id) ?? { totalValue: 0, activeDeals: 0 };
    return {
      id: project.id,
      name: project.name,
      isActive: project.isActive,
      activeFrom: project.activeFrom?.toISOString() ?? null,
      activeTo: project.activeTo?.toISOString() ?? null,
      contactCount: project._count.contacts,
      totalValue: metrics.totalValue,
      activeDeals: metrics.activeDeals,
    };
  });

  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  const projectIdParam = sp.projectId?.trim();
  const initialProjectFilter =
    projectIdParam && projects.some((p) => p.id === projectIdParam) ? projectIdParam : undefined;
  const clientIdParam = sp.clientId?.trim();
  const initialClientId =
    clientIdParam && contacts.some((c) => c.id === clientIdParam) ? clientIdParam : undefined;
  const initialHub = resolveInitialHub({
    initialClientId,
    initialProjectFilter,
    hub: sp.hub?.trim(),
  });

  return (
    <AppPageChrome>
    <WorkspaceEngineeringShell>
      <PageHeader
        eyebrow="CRM"
        title={industryProfile.clientsLabel}
        subtitle={`${projects.length} פרויקטים · ${contacts.length} לקוחות במערכת`}
        actions={
          <a href="/app/erp#erp-wizard" className="cd-btn border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]">
            כספים
          </a>
        }
      />
      <ClientsWorkspaceV2
        contacts={contacts}
        projects={projects}
        industryProfile={industryProfile}
        organizationId={organizationId}
        userFirstName={userFirstName}
        initialHub={initialHub}
        initialProjectFilter={initialProjectFilter}
        initialClientId={initialClientId}
        hideWorkspaceHero
      />
    </WorkspaceEngineeringShell>
    </AppPageChrome>
  );
}
