import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { isPlatformDeveloperEmail } from "@/lib/platform-developers";
import CrmClient from "./CrmClient";
import type { CrmAdminOrganizationRow } from "./CrmOrganizationsAdminTable";

export default async function CRMPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  if (!session?.user?.id || !isPlatformDeveloperEmail(email)) {
    redirect("/dashboard");
  }

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
        users: { take: 1, select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const orgId = dbUser?.organizationId ?? null;
  const hasOrganization = Boolean(orgId);

  const [contacts, projects] = orgId
    ? await Promise.all([
        prisma.contact.findMany({
          where: { organizationId: orgId },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.project.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], []];

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

  const organizations: CrmAdminOrganizationRow[] = organizationsRaw.map((o) => ({
    id: o.id,
    name: o.name,
    plan: o.plan,
    users: o.users,
    invoiceTotalAmount: totalByOrgId.get(o.id) ?? 0,
  }));

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
