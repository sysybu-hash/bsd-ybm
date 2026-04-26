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
import { HeaderResponsiveLabel } from "@/components/layout/WorkspacePageHeader";
import AppAiHubInlineAssistant from "@/components/ai/AppAiHubInlineAssistant";
import InsightsWorkspaceV2 from "@/components/insights/InsightsWorkspaceV2";
import { IntelligenceDashboardContent } from "@/app/workspace-content/intelligence/IntelligenceDashboardContent";
import { authOptions } from "@/lib/auth";
import { loadInsightsWorkspaceProps } from "@/lib/load-insights-workspace";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { prisma } from "@/lib/prisma";
import { BentoGrid, ProgressRing, Tile, TileHeader } from "@/components/ui/bento";

export const metadata = {
  title: "AI | BSD-YBM",
};

export const dynamic = "force-dynamic";

export default async function AppAiHubPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;
  if (!organizationId) redirect("/login");

  const [insightsProps, organization] = await Promise.all([
    loadInsightsWorkspaceProps(organizationId),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { industry: true, constructionTrade: true, industryConfigJson: true },
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

  const userFirstName =
    (session.user?.name ?? "").trim().split(" ")[0] ||
    session.user?.email?.split("@")[0] ||
    "";

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      {/* ── Hero: ברכה + 4 KPI + תובנת AI ── */}
      <Tile tone="ai" span={12}>
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tile-eyebrow">Intelligence · Command Center</p>
              <h1 className="mt-2 text-[28px] font-black tracking-tight text-white">
                {t("workspaceAiHub.title")}
              </h1>
              <p className="mt-1 text-sm text-violet-200">
                {t("workspaceAiHub.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/app/inbox"
                className="bento-btn bento-btn--primary"
                style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.4)", color: "white" }}
              >
                <ScanSearch className="h-4 w-4" strokeWidth={2} aria-hidden />
                <HeaderResponsiveLabel short={t("workspaceAiHub.scannerTitle")} long={t("workspaceAiHub.scannerTitle")} />
              </Link>
              <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-white/10 sm:flex">
                <BrainCircuit className="h-6 w-6 text-white" aria-hidden />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">רמת מוכנות</p>
              <p className="mt-1 text-xl font-black text-white">94%</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">סריקות היום</p>
              <p className="mt-1 text-xl font-black text-white">12</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">דיוק ממוצע</p>
              <p className="mt-1 text-xl font-black text-white">98.2%</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">חיסכון זמן</p>
              <p className="mt-1 text-xl font-black text-white">~4.5h</p>
            </div>
          </div>
        </div>
      </Tile>

      <BentoGrid>
        {/* AI Insight (dark, hero) */}
        <Tile tone="ai" span={8}>
          <TileHeader eyebrow={t("workspaceAiHub.aiBridgeEyebrow")} liveDot />
          <p className="mt-3 text-[15px] leading-7 text-white/95">
            {t("workspaceAiHub.aiBridgeInsight")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="#insights" className="bento-btn bg-white/10 border-white/20 text-white hover:bg-white/20">
              {t("workspaceAiHub.aiBridgeCta")}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
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

        {/* Assistant — מקומי */}
        <Tile tone="lavender" span={4}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--axis-ai-soft)", color: "var(--axis-ai)" }}>
              <BrainCircuit className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[13px] font-black text-[color:var(--axis-ai-ink)]">{t("workspaceAiHub.tabAssistant")}</p>
              <p className="mt-1 text-[12px] text-[color:var(--axis-ai-ink)]/80">{t("workspaceAiHub.assistantBody")}</p>
            </div>
          </div>
          <div className="mt-4 max-h-[420px] overflow-y-auto">
            <AppAiHubInlineAssistant
              orgId={organizationId}
              industryProfile={industryProfile}
              userFirstName={userFirstName}
            />
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
