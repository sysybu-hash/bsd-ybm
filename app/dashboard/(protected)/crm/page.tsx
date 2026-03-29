import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import { hasMeckanoAccess } from "@/lib/meckano-access";
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

  const platformDev = isPlatformDeveloperEmail(email);
  const meckanoOp = hasMeckanoAccess(session.user.email);

  if (!platformDev && !meckanoOp) {
    redirect("/dashboard");
  }

  let orgId: string | null = null;
  let organizations: CrmAdminOrganizationRow[] = [];
  type Loaded = Awaited<ReturnType<typeof loadContactsProjects>>;
  let contacts: Loaded["contacts"] = [];
  let projects: Loaded["projects"] = [];

  if (platformDev) {
    const userId = session.user.id;
    const [dbUser, organizationsRaw] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      }),
      prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          plan: true,
          createdAt: true,
          users: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: { email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    orgId = dbUser?.organizationId ?? null;
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

    organizations = dedupeOrganizationsForCrmDisplay(
      organizationsRaw,
      totalByOrgId,
    );

    if (orgId) {
      const loaded = await loadContactsProjects(orgId);
      contacts = loaded.contacts;
      projects = loaded.projects;
    }
  } else {
    orgId = session.user.organizationId ?? null;
    if (orgId) {
      const loaded = await loadContactsProjects(orgId);
      contacts = loaded.contacts;
      projects = loaded.projects;
    }
    organizations = [];
  }

  const hasOrganization = Boolean(orgId);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10" dir="rtl">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--heading-color,#2563eb)] italic tracking-tighter mb-2">
              מערכת ניהול לקוחות (CRM)
            </h1>
            <p className="text-slate-500 text-sm font-semibold">
              לידים, פרויקטים, ארגונים וסיכומי Intelligence מבוססי AI
            </p>
          </div>
          <a
            href="#crm-new-contact"
            className="bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-95 text-white px-8 py-3.5 rounded-2xl text-sm font-black inline-flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all border border-white/10"
          >
            <Plus size={18} /> הוספת לקוח חדש
          </a>
        </div>

        <CrmClient
          hasOrganization={hasOrganization}
          contacts={contacts.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
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
    </div>
  );
}
