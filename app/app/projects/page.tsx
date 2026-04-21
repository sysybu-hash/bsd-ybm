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
    <div className="mx-auto max-w-[1440px] space-y-6" dir="rtl">
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          Projects
        </p>
        <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">
          מרכז פרויקטים
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          כל הפרויקטים בארגון, עם חיבור ישיר ללקוחות, שלבים ומשימות.
        </p>
      </header>

      <BentoGrid>
        <Tile tone="clients" span={8}>
          <TileHeader
            eyebrow="Projects"
            action={<TileLink href="/app/clients" tone="clients" label={industryProfile.clientsLabel} />}
          />
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="tile-hero-value text-[color:var(--axis-clients-ink)]">{activeProjects.length}</p>
            <div className="hidden flex-1 sm:block">
              <ProgressBar value={completionRate} axis="clients" glow />
            </div>
          </div>
          <p className="mt-2 text-[12px] font-semibold text-[color:var(--axis-clients-ink)]/80">
            {activeProjects.length} פעילים כרגע
          </p>
        </Tile>

        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="Snapshot" />
          <div className="mt-3 grid gap-3">
            <div className="flex items-center justify-between rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2">
              <span className="text-[12px] font-bold text-[color:var(--ink-500)]">סה&quot;כ פרויקטים</span>
              <span className="text-lg font-black text-[color:var(--ink-900)]">{projectsRaw.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2">
              <span className="text-[12px] font-bold text-[color:var(--ink-500)]">שיוכי לקוחות</span>
              <span className="text-lg font-black text-[color:var(--ink-900)]">{projectsRaw.reduce((s, p) => s + p._count.contacts, 0)}</span>
            </div>
          </div>
        </Tile>

        <Tile tone="neutral" span={12}>
          <TileHeader eyebrow="רשימת פרויקטים" />
          {projectsRaw.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-10 text-center text-sm text-[color:var(--ink-500)]">
              אין עדיין פרויקטים. צור פרויקט ממסך הלקוחות.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {projectsRaw.map((project) => (
                <Link
                  key={project.id}
                  href={`/app/clients?projectId=${encodeURIComponent(project.id)}`}
                  className="tile tile-interactive p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]">
                          <FolderKanban className="h-4 w-4" aria-hidden />
                        </span>
                        <p className="truncate text-[15px] font-black text-[color:var(--ink-900)]">{project.name}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`rounded-full px-2 py-0.5 font-bold ${project.isActive ? "bg-[color:var(--state-success-soft)] text-[color:var(--state-success)]" : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]"}`}>
                          {project.isActive ? "פעיל" : "לא פעיל"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[color:var(--ink-500)]">
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                          {project._count.contacts} אנשי קשר
                        </span>
                        <span className="inline-flex items-center gap-1 text-[color:var(--ink-500)]">
                          <Clock3 className="h-3 w-3" aria-hidden />
                          {project.activeFrom ? new Date(project.activeFrom).toLocaleDateString("he-IL") : "ללא תאריך"}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--ink-400)]" aria-hidden />
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
