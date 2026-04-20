import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BrainCircuit, ScanSearch, Sparkles, Workflow } from "lucide-react";
import InsightsWorkspaceV2 from "@/components/insights/InsightsWorkspaceV2";
import { IntelligenceDashboardContent } from "@/app/workspace-content/intelligence/IntelligenceDashboardContent";
import { authOptions } from "@/lib/auth";
import { loadInsightsWorkspaceProps } from "@/lib/load-insights-workspace";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import {
  AxisCard,
  SplitDualityAxes,
  SplitDualityBridge,
  SplitDualityHeadline,
  SplitDualityShell,
} from "@/components/workspace/SplitDuality";

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
    <SplitDualityShell mode="home">
      <div className="relative z-10 mx-auto max-w-[1400px]" dir="rtl">
        <div className="space-y-8">
          <SplitDualityHeadline
            eyebrow={t("workspaceAiHub.eyebrow")}
            title={t("workspaceAiHub.title")}
            subtitle={t("workspaceAiHub.subtitle")}
          />

          <SplitDualityBridge
            eyebrow={t("workspaceAiHub.aiBridgeEyebrow")}
            insight={t("workspaceAiHub.aiBridgeInsight")}
            ctaLabel={t("workspaceAiHub.aiBridgeCta")}
            ctaHref="/app/ai#insights"
          />

          {/* Quick actions */}
          <div className="relative z-10 grid gap-3 sm:grid-cols-3">
            <Link
              href="/app/ai#scanner"
              className="group flex items-start gap-3 rounded-lg border border-[color:var(--axis-ai-border)] bg-white/80 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[color:var(--axis-ai)] hover:shadow-[var(--shadow-sm)]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}
              >
                <ScanSearch className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-black text-[color:var(--ink-900)]">{t("workspaceAiHub.scannerTitle")}</p>
                <p className="mt-1 text-[12px] text-[color:var(--ink-500)]">{t("workspaceAiHub.scannerBody")}</p>
              </div>
            </Link>
            <Link
              href="/app/ai#insights"
              className="group flex items-start gap-3 rounded-lg border border-[color:var(--axis-ai-border)] bg-white/80 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[color:var(--axis-ai)] hover:shadow-[var(--shadow-sm)]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}
              >
                <BrainCircuit className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-black text-[color:var(--ink-900)]">{t("workspaceAiHub.tabAssistant")}</p>
                <p className="mt-1 text-[12px] text-[color:var(--ink-500)]">{t("workspaceAiHub.assistantBody")}</p>
              </div>
            </Link>
            <Link
              href="/app/automations"
              className="group flex items-start gap-3 rounded-lg border border-[color:var(--axis-ai-border)] bg-white/80 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[color:var(--axis-ai)] hover:shadow-[var(--shadow-sm)]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}
              >
                <Workflow className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-black text-[color:var(--ink-900)]">{t("workspaceAiHub.automationsTitle")}</p>
                <p className="mt-1 text-[12px] text-[color:var(--ink-500)]">{t("workspaceAiHub.automationsBody")}</p>
              </div>
            </Link>
          </div>

          {/* Insights workspace */}
          <div id="insights" className="relative z-10">
            <InsightsWorkspaceV2 {...insightsProps} />
          </div>

          {/* Executive intelligence */}
          <div className="relative z-10">
            <SplitDualityAxes
              mode="home"
              leadingAxis={
                <AxisCard
                  axis="ai"
                  eyebrow={t("workspaceAiHub.executiveEyebrow")}
                  title={t("workspaceAiHub.executiveTitle")}
                  action={
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--axis-ai)]">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      {t("workspaceAiHub.executiveBadge")}
                    </span>
                  }
                >
                  <IntelligenceDashboardContent fallbackHref="/app/ai" skipRedirect />
                </AxisCard>
              }
              trailingAxis={
                <AxisCard
                  axis="ai"
                  eyebrow={t("workspaceAiHub.axisConnectionsEyebrow")}
                  title={t("workspaceAiHub.axisConnectionsTitle")}
                >
                  <p className="text-[13px] leading-6 text-[color:var(--ink-600)]">
                    {t("workspaceAiHub.axisConnectionsBody")}
                  </p>
                  <div className="mt-4 grid gap-2">
                    <Link
                      href="/app/clients"
                      className="flex items-center justify-between rounded-lg border border-[color:var(--axis-clients-border)] bg-[color:var(--axis-clients-soft)] px-3 py-2 text-[13px] font-black text-[color:var(--axis-clients-ink)] transition hover:bg-white"
                    >
                      <span>{t("workspaceAiHub.goClients")}</span>
                      <span>→</span>
                    </Link>
                    <Link
                      href="/app/finance"
                      className="flex items-center justify-between rounded-lg border border-[color:var(--axis-finance-border)] bg-[color:var(--axis-finance-soft)] px-3 py-2 text-[13px] font-black text-[color:var(--axis-finance-ink)] transition hover:bg-white"
                    >
                      <span>{t("workspaceAiHub.goFinance")}</span>
                      <span>→</span>
                    </Link>
                    <Link
                      href="/app/documents"
                      className="flex items-center justify-between rounded-lg border border-[color:var(--line)] bg-white/70 px-3 py-2 text-[13px] font-black text-[color:var(--ink-900)] transition hover:bg-white"
                    >
                      <span>{t("workspaceAiHub.goDocuments")}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </AxisCard>
              }
            />
          </div>
        </div>
      </div>
    </SplitDualityShell>
  );
}
