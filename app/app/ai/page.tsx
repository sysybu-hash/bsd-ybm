import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import InsightsWorkspaceV2 from "@/components/insights/InsightsWorkspaceV2";
import { IntelligenceDashboardContent } from "@/app/workspace-content/intelligence/IntelligenceDashboardContent";
import { authOptions } from "@/lib/auth";
import { loadInsightsWorkspaceProps } from "@/lib/load-insights-workspace";

export const metadata = {
  title: "AI | BSD-YBM",
};

export const dynamic = "force-dynamic";

export default async function AppAiHubPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const insightsProps = await loadInsightsWorkspaceProps(organizationId);

  return (
    <div className="grid gap-10" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-5 sm:p-6">
        <h1 className="text-xl font-black text-[color:var(--v2-ink)] sm:text-2xl">תובנות והמלצות</h1>
        <p className="mt-2 text-sm text-[color:var(--v2-muted)]">סיכום פיננסי ותפעולי — מבוסס נתוני הארגון.</p>
      </section>
      <InsightsWorkspaceV2 {...insightsProps} />

      <section className="border-t border-[color:var(--v2-line)] pt-10">
        <h2 className="mb-4 text-lg font-black text-[color:var(--v2-ink)]">מודיעין וסוויטה מתקדמת</h2>
        <IntelligenceDashboardContent fallbackHref="/app/ai" skipRedirect />
      </section>
    </div>
  );
}
