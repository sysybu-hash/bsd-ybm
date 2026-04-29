import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { loadWorkspaceHomeData } from "@/lib/load-workspace-home";
import WorkspaceHomeView from "@/components/workspace/WorkspaceHomeView";
import AppPageChrome from "@/components/workspace/AppPageChrome";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;
  if (!organizationId) {
    redirect("/login");
  }

  const data = await loadWorkspaceHomeData(organizationId);
  const userFirst = (session?.user?.name ?? session?.user?.email ?? "").split(/[\s@]/)[0] || "ברוך הבא";
  const todayLabel = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <AppPageChrome>
      <WorkspaceHomeView userFirst={userFirst} todayLabel={todayLabel} data={data} />
    </AppPageChrome>
  );
}
