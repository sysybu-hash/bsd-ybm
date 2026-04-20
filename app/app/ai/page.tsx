import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import InsightsWorkspaceV2 from "@/components/insights/InsightsWorkspaceV2";
import { IntelligenceDashboardContent } from "@/app/workspace-content/intelligence/IntelligenceDashboardContent";
import { authOptions } from "@/lib/auth";
import { loadInsightsWorkspaceProps } from "@/lib/load-insights-workspace";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";

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
  const t = createTranslator(await readRequestMessages());

  return (
    <div className="grid gap-10" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-5 sm:p-6">
        <h1 className="text-xl font-black text-[color:var(--v2-ink)] sm:text-2xl">{t("workspaceAiHub.title")}</h1>
        <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{t("workspaceAiHub.subtitle")}</p>
      </section>
      <InsightsWorkspaceV2 {...insightsProps} />

      <section className="border-t border-[color:var(--v2-line)] pt-10">
        <h2 className="mb-4 text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceAiHub.executiveTitle")}</h2>
        <IntelligenceDashboardContent fallbackHref="/app/ai" skipRedirect />
      </section>
    </div>
  );
}
