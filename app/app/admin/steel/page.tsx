import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { prisma } from "@/lib/prisma";
import { SuperAdminWorkspace } from "@/components/admin/SuperAdminWorkspace";
import type { SuperAdminLogRow, SystemHealthKpis } from "@/components/admin/SuperAdminWorkspace";

export const dynamic = "force-dynamic";

function logStatusForAction(action: string): "success" | "warning" | "error" {
  const a = action.toLowerCase();
  if (a.includes("fail") || a.includes("error") || a.includes("delete")) return "error";
  if (a.includes("warn") || a.includes("skip")) return "warning";
  return "success";
}

export default async function AdminSteelLockPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    redirect("/app");
  }

  const now = new Date();
  let dbStatus: SystemHealthKpis["dbStatus"] = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  const hasAiKeys = Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.ANTHROPIC_API_KEY?.trim(),
  );
  const aiEngineStatus: SystemHealthKpis["aiEngineStatus"] = hasAiKeys ? "ok" : "offline";

  const [activeSessions, rawLogs] = await Promise.all([
    prisma.session.count({ where: { expires: { gt: now } } }),
    prisma.activityLog.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
    }),
  ]);

  const health: SystemHealthKpis = {
    dbStatus,
    aiEngineStatus,
    meckanoApiStatus: "ok",
    activeSessions,
  };

  const recentLogs: SuperAdminLogRow[] = rawLogs.map((row) => ({
    id: row.id,
    action: row.action,
    user: [row.user?.name || row.user?.email, row.organization?.name].filter(Boolean).join(" · ") || "—",
    time: row.createdAt.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" }),
    status: logStatusForAction(row.action),
  }));

  return (
    <div className="w-full min-w-0" dir="rtl">
      <SuperAdminWorkspace health={health} recentLogs={recentLogs} />
    </div>
  );
}
