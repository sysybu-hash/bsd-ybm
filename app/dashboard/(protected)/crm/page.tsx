import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/is-admin";
import CrmClient from "./CrmClient";
import type { CrmAdminOrganizationRow } from "./CrmOrganizationsAdminTable";
import { dedupeOrganizationsForCrmDisplay } from "./dedupe-organizations";

async function loadContactsProjects(orgId: string) {
  const [contacts, projects] = await Promise.all([
    prisma.contact.findMany({
      where: { organizationId: orgId },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { contacts, projects };
}

export default async function CRMPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  if (!session?.user?.id) {
    redirect("/login");
  }

  const platformDev = isAdmin(email);
  const userId = session.user.id;

  // כל משתמש מחובר יכול להשתמש ב-CRM של הארגון שלו
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  const orgId = dbUser?.organizationId ?? session.user.organizationId ?? null;

  type Loaded = Awaited<ReturnType<typeof loadContactsProjects>>;
  let contacts: Loaded["contacts"] = [];
  let projects: Loaded["projects"] = [];
  let organizations: CrmAdminOrganizationRow[] = [];

  if (orgId) {
    const loaded = await loadContactsProjects(orgId);
    contacts = loaded.contacts;
    projects = loaded.projects;
  }

  // טבלת כל הארגונים — רק לאדמין הפלטפורמה
  if (platformDev) {
    const organizationsRaw = await prisma.organization.findMany({
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

    const orgIds = organizationsRaw.map((o) => o.id);
    const invoiceSums =
      orgIds.length > 0
        ? await prisma.invoice.groupBy({
            by: ["organizationId"],
            where: { organizationId: { in: orgIds } },
            _sum: { amount: true },
          })
        : [];
    const totalByOrgId = new Map(
      invoiceSums.map((s) => [s.organizationId, s._sum.amount ?? 0]),
    );

    organizations = dedupeOrganizationsForCrmDisplay(organizationsRaw, totalByOrgId);
  }

  const hasOrganization = Boolean(orgId);

  return (
    <div className="min-h-screen bg-[#f8fafc]" dir="rtl">
      <CrmClient
          hasOrganization={hasOrganization}
          showUnifiedBillingLinks={platformDev}
          contacts={contacts.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: (c as { phone?: string | null }).phone ?? null,
            notes: (c as { notes?: string | null }).notes ?? null,
            value: (c as { value?: number | null }).value ?? null,
            status: c.status,
            project: c.project ? { id: c.project.id, name: c.project.name } : null,
            createdAt: c.createdAt.toISOString(),
          }))}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            isActive: p.isActive,
            activeFrom: p.activeFrom?.toISOString() ?? null,
            activeTo: p.activeTo?.toISOString() ?? null,
          }))}
          organizations={organizations}
        />
    </div>
  );
}
