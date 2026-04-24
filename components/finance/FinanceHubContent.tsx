import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Landmark,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import FinanceHubAiAssist from "@/components/finance/FinanceHubAiAssist";
import WorkspacePageHeader, { HeaderResponsiveLabel } from "@/components/layout/WorkspacePageHeader";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import type { CommercialHubSnapshot } from "@/lib/workspace/load-commercial-hub";
import {
  BentoGrid,
  ProgressBar,
  ProgressRing,
  Sparkline,
  Tile,
  TileHeader,
  TileLink,
} from "@/components/ui/bento";

type Props = {
  snapshot: CommercialHubSnapshot;
  organizationId: string;
  industryProfile: IndustryProfile;
  userFirstName: string;
};

export default async function FinanceHubContent({
  snapshot,
  organizationId,
  industryProfile,
  userFirstName,
}: Props) {
  const messages = await readRequestMessages();
  const t = createTranslator(messages);
  const { forecast, totals, contacts, projects, issuedMonthOverMonthPct } = snapshot;
  const totalInvoiced = totals.pendingIssuedTotal + totals.paidIssuedTotal;
  const collectionRate = totalInvoiced > 0 ? Math.round((totals.paidIssuedTotal / totalInvoiced) * 100) : 0;
  const target = Math.max(60_000, Math.ceil((totalInvoiced * 1.3) / 1000) * 1000);
  const targetProgress = target > 0 ? Math.min(100, Math.round((totalInvoiced / target) * 100)) : 0;

  const topPendingClients = contacts
    .filter((c) => c.totalPending > 0)
    .sort((a, b) => b.totalPending - a.totalPending)
    .slice(0, 5);
  const topProjects = [...projects]
    .sort((a, b) => b.pendingCollection - a.pendingCollection)
    .slice(0, 4);

  // cash spark pattern (rising)
  const cashSpark = [3, 5, 4, 7, 6, 9, 8, 12, 10, 15].map((v) => v * Math.max(1, totalInvoiced / 1500));

  // AI insight
  const insightParts: string[] = [];
  if (totals.pendingIssuedCount > 0) {
    insightParts.push(
      t("workspaceFinance.aiInsight.pending", {
        count: String(totals.pendingIssuedCount),
        amount: formatCurrencyILS(totals.pendingIssuedTotal),
      }),
    );
  }
  if (collectionRate > 0) {
    insightParts.push(t("workspaceFinance.aiInsight.collection", { rate: String(collectionRate) }));
  }
  if (topPendingClients.length > 0) {
    insightParts.push(t("workspaceFinance.aiInsight.topClient", { client: topPendingClients[0].name }));
  }
  if (insightParts.length === 0) {
    insightParts.push(t("workspaceFinance.aiInsight.empty"));
  }
  const insightText = insightParts.join(" · ");

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      <WorkspacePageHeader
        eyebrow={t("workspaceFinance.eyebrow")}
        title={t("workspaceFinance.heroTitle")}
        subtitle={t("workspaceFinance.heroSubtitle")}
        actions={
          <Link
            href="/app/documents/issue"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[color:var(--axis-finance)] px-4 py-2.5 text-sm font-black text-white shadow-lg hover:bg-[color:var(--axis-finance-strong)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            <HeaderResponsiveLabel short={t("workspaceFinance.issueCtaShort")} long={t("workspaceFinance.issueCta")} />
          </Link>
        }
      />

      <BentoGrid>
        {/* AI Insight (dark, hero) */}
        <Tile tone="ai" span={4} rows={2}>
          <TileHeader eyebrow={t("workspaceFinance.aiInsight.eyebrow")} liveDot />
          <p className="mt-3 text-[14px] leading-6 text-white/95 line-clamp-4">
            {insightText}
          </p>
          <div className="mt-5 flex items-center justify-center">
            <ProgressRing value={collectionRate} axis="ai" size={150} strokeWidth={12}>
              <span className="text-3xl font-black text-white tabular-nums">{collectionRate}%</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-violet-200/80">
                {t("workspaceFinance.statCollectionRate")}
              </span>
            </ProgressRing>
          </div>
          <div className="mt-5 flex justify-center">
            <FinanceHubAiAssist
              orgId={organizationId}
              industryProfile={industryProfile}
              userFirstName={userFirstName}
              insightText={insightText}
              sectionLabel={t("workspaceFinance.eyebrow")}
              variant="hero"
            />
          </div>
        </Tile>

        {/* Finance Hero */}
        <Tile tone="finance" span={8}>
          <div>
            <p className="tile-eyebrow">{t("workspaceFinance.totalInvoicedLabel")}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--axis-finance-ink)]/80">
              {t("workspaceFinance.heroKpiSub")}
            </p>
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="tile-hero-value text-[color:var(--axis-finance-ink)]">
              {formatCurrencyILS(totalInvoiced)}
            </p>
            <div className="hidden flex-1 self-stretch sm:block">
              <Sparkline values={cashSpark} axis="finance" height={60} />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-[color:var(--ink-600)]">
              <span>{t("workspaceHome.axisFinance.target", { amount: formatCurrencyILS(target) })}</span>
              <span className="tabular-nums">
                {targetProgress}% ·{" "}
                <span
                  className={
                    issuedMonthOverMonthPct >= 0
                      ? "text-[color:var(--state-success)]"
                      : "text-[color:var(--state-warning)]"
                  }
                >
                  {issuedMonthOverMonthPct > 0 ? "+" : ""}
                  {issuedMonthOverMonthPct}%
                </span>
              </span>
            </div>
            <ProgressBar value={targetProgress} target={100} axis="finance" glow />
          </div>
        </Tile>

        {/* Paid box */}
        <Tile tone="neutral" span={3}>
          <TileHeader eyebrow={t("workspaceFinance.boxPaid")} />
          <p className="tile-hero-value mt-3 text-[color:var(--state-success)]">
            {formatCurrencyILS(totals.paidIssuedTotal)}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase text-[color:var(--ink-500)]">
            {t("workspaceFinance.statPaidIssuedHint", { count: String(totals.paidIssuedCount) })}
          </p>
          <div className="mt-3">
            <ProgressBar value={collectionRate} axis="success" />
          </div>
        </Tile>

        {/* Pending box */}
        <Tile tone="neutral" span={3}>
          <TileHeader eyebrow={t("workspaceFinance.boxPending")} />
          <p className="tile-hero-value mt-3 text-[color:var(--state-warning)]">
            {formatCurrencyILS(totals.pendingIssuedTotal)}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase text-[color:var(--ink-500)]">
            {t("workspaceFinance.statPendingIssuedHint", { count: String(totals.pendingIssuedCount) })}
          </p>
          <div className="mt-3">
            <ProgressBar value={totalInvoiced > 0 ? Math.round((totals.pendingIssuedTotal / totalInvoiced) * 100) : 0} axis="warning" />
          </div>
        </Tile>

        {/* Forecast box */}
        <Tile tone="finance" span={3}>
          <TileHeader eyebrow={t("workspaceFinance.boxForecast")} />
          <p className="mt-3 flex items-baseline gap-2">
            <span className="tile-hero-value text-[color:var(--axis-finance-ink)]">
              {collectionRate}%
            </span>
            <TrendingUp className="h-4 w-4 text-[color:var(--axis-finance)]" aria-hidden />
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase text-[color:var(--axis-finance-ink)]/80">
            {t("workspaceFinance.statProjectedTotalHint")}
          </p>
          <div className="mt-3">
            <Sparkline values={cashSpark} axis="finance" height={40} />
          </div>
        </Tile>

        {/* Top pending clients */}
        <Tile tone="neutral" span={6}>
          <TileHeader
            eyebrow={t("workspaceFinance.linkedClientsTitle")}
            action={<TileLink href="/app/clients" tone="clients" label={t("workspaceFinance.clientsCta")} />}
          />
          {topPendingClients.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
              {t("workspaceFinance.linkedClientsEmpty")}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--line-subtle)]">
              {topPendingClients.map((client) => {
                const pct = totalInvoiced > 0 ? Math.min(100, (client.totalPending / totalInvoiced) * 100) : 0;
                return (
                  <li key={client.id}>
                    <Link
                      href={`/app/clients?clientId=${encodeURIComponent(client.id)}`}
                      className="block py-3 transition hover:bg-[color:var(--axis-finance-soft)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[13px] font-bold text-[color:var(--ink-900)]">
                          {client.name}
                        </p>
                        <span className="shrink-0 text-[13px] font-black tabular-nums text-[color:var(--axis-finance)]">
                          {formatCurrencyILS(client.totalPending)}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={pct} axis="warning" height={5} />
                      </div>
                      <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
                        {t("workspaceFinance.linkedClientsLine", {
                          count: String(client.invoiceCount),
                          project: client.project?.name ?? t("workspaceClients.card.noProject"),
                        })}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>

        {/* Top projects (finance pressure) */}
        <Tile tone="neutral" span={6}>
          <TileHeader
            eyebrow={t("workspaceFinance.projectsTitle")}
            action={<TileLink href="/app/projects" label={t("workspaceFinance.projectsAllCta")} />}
          />
          {topProjects.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
              {t("workspaceFinance.projectsEmpty")}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--line-subtle)]">
              {topProjects.map((project) => {
                const totalProject = project.billedTotal + project.pendingCollection;
                const pct = totalProject > 0 ? Math.round((project.pendingCollection / totalProject) * 100) : 0;
                return (
                  <li key={project.id}>
                    <Link
                      href={`/app/clients?projectId=${encodeURIComponent(project.id)}`}
                      className="block py-3 transition hover:bg-[color:var(--canvas-sunken)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[13px] font-bold text-[color:var(--ink-900)]">{project.name}</p>
                        <span className="shrink-0 text-[13px] font-black tabular-nums text-[color:var(--axis-finance)]">
                          {formatCurrencyILS(project.pendingCollection)}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={pct} axis="finance" height={5} />
                      </div>
                      <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
                        {t("workspaceFinance.projectsLine", {
                          deals: String(project.activeDeals),
                          billed: formatCurrencyILS(project.billedTotal),
                        })}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>

        {/* Actions tile */}
        <Tile tone="neutral" span={12} padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-500)]">
              {t("workspaceFinance.quickActionsTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/documents/issue"
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--axis-finance-border)] bg-[color:var(--axis-finance-soft)] px-3 py-2 text-[12px] font-bold text-[color:var(--axis-finance-ink)] transition hover:bg-[color:var(--axis-finance)] hover:text-white"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden />
                {t("workspaceFinance.issueCta")}
              </Link>
              <Link
                href="/app/documents/erp"
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] transition hover:bg-[color:var(--ink-900)] hover:text-white hover:border-[color:var(--ink-900)]"
              >
                <Landmark className="h-3.5 w-3.5" aria-hidden />
                {t("workspaceFinance.erpCardTitle")}
              </Link>
              <Link
                href="/app/settings/billing"
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] transition hover:bg-[color:var(--ink-900)] hover:text-white hover:border-[color:var(--ink-900)]"
              >
                <CreditCard className="h-3.5 w-3.5" aria-hidden />
                {t("workspaceFinance.subscriptionCta")}
              </Link>
              <a
                href="/api/reports/finance-pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] transition hover:bg-[color:var(--ink-900)] hover:text-white hover:border-[color:var(--ink-900)]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {t("workspaceFinance.reportPdf")}
              </a>
              <a
                href="/api/reports/finance-csv"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] transition hover:bg-[color:var(--ink-900)] hover:text-white hover:border-[color:var(--ink-900)]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
                {t("workspaceFinance.reportCsv")}
              </a>
              <FinanceHubAiAssist
                orgId={organizationId}
                industryProfile={industryProfile}
                userFirstName={userFirstName}
                insightText={insightText}
                sectionLabel={t("workspaceFinance.eyebrow")}
                variant="compact"
              />
            </div>
          </div>
        </Tile>
      </BentoGrid>

      <div className="flex items-center gap-2 rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2 text-[11px] text-[color:var(--ink-500)]">
        <Sparkles className="h-3.5 w-3.5 text-[color:var(--axis-ai)]" aria-hidden />
        {t("workspaceFinance.footerHint")}
      </div>
    </div>
  );
}
