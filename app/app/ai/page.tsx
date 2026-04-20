import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BrainCircuit,
  CreditCard,
  ScanSearch,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import InsightsWorkspaceV2 from "@/components/insights/InsightsWorkspaceV2";
import { IntelligenceDashboardContent } from "@/app/workspace-content/intelligence/IntelligenceDashboardContent";
import { authOptions } from "@/lib/auth";
import { loadInsightsWorkspaceProps } from "@/lib/load-insights-workspace";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { BentoGrid, ProgressRing, Tile, TileHeader } from "@/components/ui/bento";

export const metadata = {
  title: "AI | BSD-YBM",
};

export const dynamic = "force-dynamic";

export default async function AppAiHubPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;
  if (!organizationId) redirect("/login");

  const insightsProps = await loadInsightsWorkspaceProps(organizationId);
  const t = createTranslator(await readRequestMessages());

  return (
    <div className="mx-auto max-w-[1440px] space-y-6" dir="rtl">
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          {t("workspaceAiHub.eyebrow")}
        </p>
        <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">
          {t("workspaceAiHub.title")}
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          {t("workspaceAiHub.subtitle")}
        </p>
      </header>

      <BentoGrid>
        {/* AI Bridge hero */}
        <Tile tone="ai" span={8}>
          <TileHeader eyebrow={t("workspaceAiHub.aiBridgeEyebrow")} liveDot />
          <p className="mt-3 text-[15px] leading-7 text-white/95">
            {t("workspaceAiHub.aiBridgeInsight")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="#insights" className="tile-cta">
              {t("workspaceAiHub.aiBridgeCta")}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/app/inbox" className="tile-cta">
              <ScanSearch className="h-4 w-4" aria-hidden />
              {t("workspaceAiHub.scannerTitle")}
            </Link>
          </div>
        </Tile>

        {/* AI status ring */}
        <Tile tone="ai" span={4}>
          <TileHeader eyebrow={t("workspaceAiHub.executiveEyebrow")} />
          <div className="mt-4 flex items-center justify-center">
            <ProgressRing value={94} axis="ai" size={130} strokeWidth={10}>
              <span className="text-2xl font-black text-white tabular-nums">94%</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-violet-200/80">
                {t("workspaceAiHub.executiveBadge")}
              </span>
            </ProgressRing>
          </div>
        </Tile>

        {/* Scanner */}
        <Tile tone="lavender" span={4} href="/app/inbox" ariaLabel={t("workspaceAiHub.scannerTitle")}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}>
              <ScanSearch className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[13px] font-black text-[color:var(--axis-ai-ink)]">{t("workspaceAiHub.scannerTitle")}</p>
              <p className="mt-1 text-[12px] text-[color:var(--axis-ai-ink)]/80">{t("workspaceAiHub.scannerBody")}</p>
            </div>
          </div>
        </Tile>

        {/* Assistant */}
        <Tile tone="lavender" span={4} href="/app/ai#insights" ariaLabel={t("workspaceAiHub.tabAssistant")}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}>
              <BrainCircuit className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[13px] font-black text-[color:var(--axis-ai-ink)]">{t("workspaceAiHub.tabAssistant")}</p>
              <p className="mt-1 text-[12px] text-[color:var(--axis-ai-ink)]/80">{t("workspaceAiHub.assistantBody")}</p>
            </div>
          </div>
        </Tile>

        {/* Automations */}
        <Tile tone="lavender" span={4} href="/app/automations" ariaLabel={t("workspaceAiHub.automationsTitle")}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}>
              <Workflow className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[13px] font-black text-[color:var(--axis-ai-ink)]">{t("workspaceAiHub.automationsTitle")}</p>
              <p className="mt-1 text-[12px] text-[color:var(--axis-ai-ink)]/80">{t("workspaceAiHub.automationsBody")}</p>
            </div>
          </div>
        </Tile>

        {/* Insights deep-dive */}
        <Tile tone="neutral" span={12}>
          <div id="insights" />
          <TileHeader
            eyebrow={t("workspaceAiHub.executiveTitle")}
            action={
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[color:var(--axis-ai)]">
                <Sparkles className="h-3 w-3" aria-hidden />
                {t("workspaceAiHub.executiveBadge")}
              </span>
            }
          />
          <div className="mt-4">
            <InsightsWorkspaceV2 {...insightsProps} />
          </div>
        </Tile>

        {/* Connections */}
        <Tile tone="neutral" span={12}>
          <TileHeader eyebrow={t("workspaceAiHub.axisConnectionsEyebrow")} />
          <p className="mt-2 text-[14px] leading-6 text-[color:var(--ink-600)]">
            {t("workspaceAiHub.axisConnectionsBody")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link
              href="/app/clients"
              className="flex items-center justify-between rounded-lg border border-[color:var(--axis-clients-border)] bg-[color:var(--axis-clients-soft)] px-4 py-3 text-[13px] font-black text-[color:var(--axis-clients-ink)] transition hover:bg-[color:var(--axis-clients)] hover:text-white"
            >
              <span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4" aria-hidden />{t("workspaceAiHub.goClients")}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/app/finance"
              className="flex items-center justify-between rounded-lg border border-[color:var(--axis-finance-border)] bg-[color:var(--axis-finance-soft)] px-4 py-3 text-[13px] font-black text-[color:var(--axis-finance-ink)] transition hover:bg-[color:var(--axis-finance)] hover:text-white"
            >
              <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4" aria-hidden />{t("workspaceAiHub.goFinance")}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/app/documents"
              className="flex items-center justify-between rounded-lg border border-[color:var(--line)] bg-white px-4 py-3 text-[13px] font-black text-[color:var(--ink-900)] transition hover:bg-[color:var(--ink-900)] hover:text-white hover:border-[color:var(--ink-900)]"
            >
              <span>{t("workspaceAiHub.goDocuments")}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Tile>

        {/* Executive intelligence */}
        <Tile tone="neutral" span={12}>
          <TileHeader eyebrow={t("workspaceAiHub.executiveEyebrow")} />
          <div className="mt-4">
            <IntelligenceDashboardContent fallbackHref="/app/ai" skipRedirect />
          </div>
        </Tile>
      </BentoGrid>
    </div>
  );
}
