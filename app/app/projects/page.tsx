import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FolderKanban, ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { BentoGrid, ProgressBar, Tile, TileHeader, TileLink } from "@/components/ui/bento";

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
  const t = createTranslator(messages);
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  const activeProjects = projectsRaw.filter((project) => project.isActive);
  const completionRate = projectsRaw.length > 0 ? Math.round((activeProjects.length / projectsRaw.length) * 100) : 0;

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      {/* ── Hero: ברכה + 4 KPI + תובנת AI ── */}
      <Tile tone="clients" span={12}>
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tile-eyebrow">Projects · Command Center</p>
              <h1 className="mt-2 text-[28px] font-black tracking-tight text-[color:var(--ink-900)]">
                מרכז פרויקטים
              </h1>
              <p className="mt-1 text-sm text-[color:var(--ink-500)]">
                ניהול ובקרה על כל אתרי העבודה והפעילות המקצועית
              </p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--axis-clients-soft)] sm:flex">
              <FolderKanban className="h-6 w-6 text-[color:var(--axis-clients)]" aria-hidden />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/40 bg-white/30 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">סה"כ פרויקטים</p>
              <p className="mt-1 text-xl font-black text-[color:var(--ink-900)]">{projectsRaw.length}</p>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/30 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">פעילים</p>
              <p className="mt-1 text-xl font-black text-[color:var(--ink-900)]">{activeProjects.length}</p>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/30 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">שיוכי לקוחות</p>
              <p className="mt-1 text-xl font-black text-[color:var(--ink-900)]">{projectsRaw.reduce((s, p) => s + p._count.contacts, 0)}</p>
            </div>
            <div className="rounded-xl border border-white/40 bg-white/30 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">שיעור פעילות</p>
              <p className="mt-1 text-xl font-black text-[color:var(--ink-900)]">{completionRate}%</p>
            </div>
          </div>
        </div>
      </Tile>

      <BentoGrid>
        <Tile tone="neutral" span={12}>
          <TileHeader eyebrow="רשימת פרויקטים פעילה" />
          {projectsRaw.length === 0 ? (
            <div className="mt-6 flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-8 text-center">
              <p className="text-sm font-bold text-[color:var(--ink-500)]">אין עדיין פרויקטים במערכת.</p>
              <Link href="/app/clients" className="mt-4 text-xs font-black text-[color:var(--axis-clients)] hover:underline">
                צור פרויקט חדש דרך כרטיס לקוח ←
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectsRaw.map((project) => (
                <Link
                  key={project.id}
                  href={`/app/clients?projectId=${encodeURIComponent(project.id)}`}
                  className="group relative overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white p-5 transition hover:border-[color:var(--axis-clients)] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)] group-hover:bg-[color:var(--axis-clients)] group-hover:text-white transition-colors">
                          <FolderKanban className="h-5 w-5" aria-hidden />
                        </div>
                        <h3 className="truncate text-[16px] font-black text-[color:var(--ink-900)]">{project.name}</h3>
                      </div>
                      
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          project.isActive 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {project.isActive ? "Active" : "Archived"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[color:var(--ink-500)]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          {project._count.contacts}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[color:var(--ink-500)]">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden />
                          {project.activeFrom ? new Date(project.activeFrom).toLocaleDateString("he-IL") : "—"}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[color:var(--ink-300)] group-hover:text-[color:var(--axis-clients)] transition-colors" />
                  </div>
                  <div className="mt-5">
                    <ProgressBar value={project.isActive ? 100 : 0} axis="clients" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Tile>
      </BentoGrid>
    </div>
  );
}
