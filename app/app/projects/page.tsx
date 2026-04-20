import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";

export const dynamic = "force-dynamic";

export default async function AppProjectsPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const [organization, projectsRaw] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        industry: true,
        constructionTrade: true,
        industryConfigJson: true,
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

  const messages = await readRequestMessages();
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
            <FolderKanban className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)] sm:text-4xl">פרויקטים</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--v2-muted)] sm:text-base">
              כל הפרויקטים בארגון — קישור ללקוחות דרך{" "}
              <Link href="/app/clients" className="font-bold text-[color:var(--v2-accent)] hover:underline">
                {industryProfile.clientsLabel}
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <div className="v2-panel overflow-hidden">
        <div className="border-b border-[color:var(--v2-line)] px-5 py-4">
          <p className="text-sm font-black text-[color:var(--v2-ink)]">רשימת פרויקטים</p>
        </div>
        <ul className="divide-y divide-[color:var(--v2-line)]">
          {projectsRaw.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-[color:var(--v2-muted)]">אין עדיין פרויקטים. צור פרויקט ממסך הלקוחות.</li>
          ) : (
            projectsRaw.map((project) => (
              <li key={project.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-[color:var(--v2-ink)]">{project.name}</p>
                  <p className="mt-1 text-xs text-[color:var(--v2-muted)]">
                    {project.isActive ? "פעיל" : "לא פעיל"} · {project._count.contacts} אנשי קשר
                  </p>
                </div>
                <Link
                  href={`/app/clients?projectId=${encodeURIComponent(project.id)}`}
                  className="text-sm font-bold text-[color:var(--v2-accent)] hover:underline"
                >
                  ללקוחות בפרויקט
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
