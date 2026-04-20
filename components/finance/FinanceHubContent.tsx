import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Landmark,
  Plus,
  TrendingUp,
} from "lucide-react";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import type { CommercialHubSnapshot } from "@/lib/workspace/load-commercial-hub";
import {
  AxisCard,
  AxisSeeAllLink,
  SplitDualityAxes,
  SplitDualityBridge,
  SplitDualityHeadline,
  SplitDualityShell,
} from "@/components/workspace/SplitDuality";

type Props = {
  snapshot: CommercialHubSnapshot;
};

export default async function FinanceHubContent({ snapshot }: Props) {
  const messages = await readRequestMessages();
  const t = createTranslator(messages);
  const { forecast, totals, contacts, projects } = snapshot;
  const flexActual = Math.max(forecast.actual, 0);
  const flexPending = Math.max(forecast.pending, 0);
  const flexForecast = Math.max(forecast.forecast, 0);
  const topPendingClients = contacts
    .filter((contact) => contact.totalPending > 0)
    .sort((left, right) => right.totalPending - left.totalPending)
    .slice(0, 5);
  const topProjects = [...projects]
    .sort((left, right) => right.pendingCollection - left.pendingCollection)
    .slice(0, 4);

  const totalInvoiced = totals.pendingIssuedTotal + totals.paidIssuedTotal;
  const collectionRate = totalInvoiced > 0 ? Math.round((totals.paidIssuedTotal / totalInvoiced) * 100) : 0;

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
    insightParts.push(
      t("workspaceFinance.aiInsight.collection", { rate: String(collectionRate) }),
    );
  }
  if (topPendingClients.length > 0) {
    insightParts.push(
      t("workspaceFinance.aiInsight.topClient", { client: topPendingClients[0].name }),
    );
  }
  if (insightParts.length === 0) {
    insightParts.push(t("workspaceFinance.aiInsight.empty"));
  }

  return (
    <SplitDualityShell mode="finance">
      <div className="relative z-10 mx-auto max-w-[1400px]" dir="rtl">
        <div className="space-y-8">
          <SplitDualityHeadline
            eyebrow={t("workspaceFinance.eyebrow")}
            title={t("workspaceFinance.heroTitle")}
            subtitle={t("workspaceFinance.heroSubtitle")}
          />

          <SplitDualityBridge
            eyebrow={t("workspaceFinance.aiInsight.eyebrow")}
            insight={insightParts.join(" · ")}
            ctaLabel={t("workspaceHome.aiNarrative.open")}
            ctaHref="/app/ai"
          />

          {/* Action bar */}
          <div className="relative z-10 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/app/documents/issue"
              className="v2-button v2-button-primary axis-finance"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("workspaceFinance.issueCta")}
            </Link>
            <Link href="/app/settings/billing" className="v2-button v2-button-secondary">
              <CreditCard className="h-4 w-4" aria-hidden />
              {t("workspaceFinance.subscriptionCta")}
            </Link>
            <a
              href="/api/reports/finance-pdf"
              target="_blank"
              rel="noreferrer"
              className="v2-button v2-button-secondary"
            >
              <Download className="h-4 w-4" aria-hidden />
              {t("workspaceFinance.reportPdf")}
            </a>
            <a
              href="/api/reports/finance-csv"
              target="_blank"
              rel="noreferrer"
              className="v2-button v2-button-secondary"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              {t("workspaceFinance.reportCsv")}
            </a>
          </div>

          {/* Dual axes (finance dominant 65/35) */}
          <SplitDualityAxes
            mode="finance"
            leadingAxis={
              <AxisCard
                axis="clients"
                eyebrow={t("workspaceFinance.linkedClientsTitle")}
                title={t("workspaceFinance.clientsSupportTitle")}
                action={<AxisSeeAllLink axis="clients" href="/app/clients" label={t("workspaceFinance.clientsCta")} />}
              >
                {topPendingClients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[color:var(--ink-500)]">
                    {t("workspaceFinance.linkedClientsEmpty")}
                  </div>
                ) : (
                  <ul className="divide-y divide-[color:var(--line-subtle)]">
                    {topPendingClients.map((client) => (
                      <li key={client.id}>
                        <Link
                          href={`/app/advanced?clientId=${encodeURIComponent(client.id)}`}
                          className="flex items-start justify-between gap-3 rounded-md px-1 py-3 transition hover:bg-[color:var(--axis-clients-soft)]"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[color:var(--ink-900)]">{client.name}</p>
                            <p className="mt-0.5 text-[12px] text-[color:var(--ink-500)]">
                              {t("workspaceFinance.linkedClientsLine", {
                                count: String(client.invoiceCount),
                                project: client.project?.name ?? t("workspaceClients.card.noProject"),
                              })}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-black tabular-nums text-[color:var(--axis-finance)]">
                            {formatCurrencyILS(client.totalPending)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/app/clients" className="v2-button v2-button-secondary text-xs">
                    {t("workspaceFinance.clientsCta")}
                  </Link>
                  <Link href="/app/ai" className="v2-button v2-button-secondary text-xs">
                    {t("workspaceFinance.aiCta")}
                  </Link>
                </div>
              </AxisCard>
            }
            trailingAxis={
              <div className="space-y-6">
                {/* Primary KPI Block */}
                <AxisCard
                  axis="finance"
                  eyebrow={t("workspaceFinance.monthTitle")}
                  title={t("workspaceFinance.heroTitle")}
                >
                  <div className="mb-4 border-b border-[color:var(--line-subtle)] pb-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                      {t("workspaceFinance.totalInvoicedLabel")}
                    </p>
                    <p className="sd-hero-value sd-hero-value--finance mt-1">
                      {formatCurrencyILS(totalInvoiced)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--state-success-soft)] p-3">
                      <p className="text-[11px] font-bold uppercase text-[color:var(--ink-500)]">
                        {t("workspaceFinance.boxPaid")}
                      </p>
                      <p className="mt-1 text-lg font-black tabular-nums text-[color:var(--state-success)]">
                        {formatCurrencyILS(totals.paidIssuedTotal)}
                      </p>
                      <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
                        {t("workspaceFinance.statPaidIssuedHint", { count: String(totals.paidIssuedCount) })}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--state-warning-soft)] p-3">
                      <p className="text-[11px] font-bold uppercase text-[color:var(--ink-500)]">
                        {t("workspaceFinance.boxPending")}
                      </p>
                      <p className="mt-1 text-lg font-black tabular-nums text-[color:var(--state-warning)]">
                        {formatCurrencyILS(totals.pendingIssuedTotal)}
                      </p>
                      <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
                        {t("workspaceFinance.statPendingIssuedHint", { count: String(totals.pendingIssuedCount) })}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--axis-finance-soft)] p-3">
                      <p className="text-[11px] font-bold uppercase text-[color:var(--ink-500)]">
                        {t("workspaceFinance.boxForecast")}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-lg font-black tabular-nums text-[color:var(--ink-900)]">
                        <TrendingUp className="h-4 w-4 text-[color:var(--axis-finance)]" aria-hidden />
                        {collectionRate}%
                      </p>
                      <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
                        {t("workspaceFinance.statProjectedTotalHint")}
                      </p>
                    </div>
                  </div>

                  {/* Flow stack bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase text-[color:var(--ink-500)]">
                        {t("workspaceFinance.flowTitle")}
                      </p>
                      <p className="text-[11px] text-[color:var(--ink-500)]">
                        {t("workspaceFinance.totalProjectedLabel")}{" "}
                        <span className="font-black text-[color:var(--ink-900)]">
                          {formatCurrencyILS(forecast.totalProjected)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-[color:var(--canvas-sunken)]">
                      <div
                        className="min-w-[2px]"
                        style={{ flex: flexActual > 0 ? flexActual : 0, background: "var(--state-success)" }}
                        title={`${t("workspaceFinance.barPaid")}: ${formatCurrencyILS(forecast.actual)}`}
                      />
                      <div
                        className="min-w-[2px]"
                        style={{ flex: flexPending > 0 ? flexPending : 0, background: "var(--axis-finance)" }}
                        title={`${t("workspaceFinance.barPending")}: ${formatCurrencyILS(forecast.pending)}`}
                      />
                      <div
                        className="min-w-[2px]"
                        style={{ flex: flexForecast > 0 ? flexForecast : 0, background: "var(--state-info)" }}
                        title={`${t("workspaceFinance.barForecast")}: ${formatCurrencyILS(forecast.forecast)}`}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-[color:var(--ink-400)]">
                      {t("workspaceFinance.flowFootnote")}
                    </p>
                  </div>
                </AxisCard>

                {/* Projects */}
                <AxisCard
                  axis="finance"
                  eyebrow={t("workspaceFinance.projectsTitle")}
                  title={t("workspaceFinance.projectsSubtitle")}
                  action={
                    <AxisSeeAllLink
                      axis="finance"
                      href="/app/projects"
                      label={t("workspaceFinance.projectsAllCta")}
                    />
                  }
                >
                  {topProjects.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
                      {t("workspaceFinance.projectsEmpty")}
                    </div>
                  ) : (
                    <ul className="divide-y divide-[color:var(--line-subtle)]">
                      {topProjects.map((project) => (
                        <li key={project.id}>
                          <Link
                            href={`/app/projects?projectId=${encodeURIComponent(project.id)}`}
                            className="flex items-start justify-between gap-3 rounded-md px-1 py-3 transition hover:bg-[color:var(--axis-finance-soft)]"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-bold text-[color:var(--ink-900)]">{project.name}</p>
                              <p className="mt-0.5 text-[12px] text-[color:var(--ink-500)]">
                                {t("workspaceFinance.projectsLine", {
                                  deals: String(project.activeDeals),
                                  billed: formatCurrencyILS(project.billedTotal),
                                })}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-black tabular-nums text-[color:var(--axis-finance)]">
                              {formatCurrencyILS(project.pendingCollection)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Action cards */}
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Link
                      href="/app/documents/erp"
                      className="group flex items-center justify-between gap-3 rounded-lg border border-[color:var(--line)] bg-white/60 p-4 transition hover:border-[color:var(--axis-finance)] hover:bg-white"
                    >
                      <div>
                        <p className="font-bold text-[color:var(--ink-900)]">{t("workspaceFinance.erpCardTitle")}</p>
                        <p className="mt-0.5 text-[12px] text-[color:var(--ink-500)]">{t("workspaceFinance.erpCardBody")}</p>
                      </div>
                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 text-[color:var(--axis-finance)] transition group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                    <Link
                      href="/app/documents/issue"
                      className="group flex items-center justify-between gap-3 rounded-lg border border-[color:var(--line)] bg-white/60 p-4 transition hover:border-[color:var(--axis-finance)] hover:bg-white"
                    >
                      <div>
                        <p className="font-bold text-[color:var(--ink-900)]">{t("workspaceFinance.issueCardTitle")}</p>
                        <p className="mt-0.5 text-[12px] text-[color:var(--ink-500)]">{t("workspaceFinance.issueCardBody")}</p>
                      </div>
                      <FileText
                        className="h-4 w-4 shrink-0 text-[color:var(--axis-finance)]"
                        aria-hidden
                      />
                    </Link>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2 text-[11px] text-[color:var(--ink-500)]">
                    <Landmark className="h-3.5 w-3.5 text-[color:var(--axis-finance)]" aria-hidden />
                    {t("workspaceFinance.footerHint")}
                  </div>
                </AxisCard>
              </div>
            }
          />
        </div>
      </div>
    </SplitDualityShell>
  );
}
