import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Landmark,
  TrendingUp,
} from "lucide-react";
import {
  WorkspacePageHero,
  WorkspaceStatTile,
  WorkspaceSurface,
} from "@/components/workspace/WorkspacePageScaffold";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import type { CommercialHubSnapshot } from "@/lib/workspace/load-commercial-hub";

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
    .slice(0, 4);
  const topProjects = [...projects]
    .sort((left, right) => right.pendingCollection - left.pendingCollection)
    .slice(0, 4);

  return (
    <div className="grid gap-6" dir="rtl">
      <WorkspacePageHero
        axis="finance"
        eyebrow={t("workspaceFinance.eyebrow")}
        title={t("workspaceFinance.heroTitle")}
        description={t("workspaceFinance.heroSubtitle")}
        actions={
          <>
            <Link
              href="/app/settings/billing"
              className="v2-button v2-button-primary axis-finance"
            >
              {t("workspaceFinance.subscriptionCta")}
              <CreditCard className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="/api/reports/finance-pdf"
              target="_blank"
              rel="noreferrer"
              className="v2-button v2-button-secondary"
            >
              {t("workspaceFinance.reportPdf")}
              <Download className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="/api/reports/finance-csv"
              target="_blank"
              rel="noreferrer"
              className="v2-button v2-button-secondary"
            >
              {t("workspaceFinance.reportCsv")}
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
            </a>
          </>
        }
        aside={
          <>
            <WorkspaceStatTile
              axis="finance"
              label={t("workspaceFinance.statPendingCollection")}
              value={formatCurrencyILS(totals.pendingCollection)}
              icon={Landmark}
              hint={t("workspaceFinance.statPendingCollectionHint")}
            />
            <WorkspaceStatTile
              axis="finance"
              label={t("workspaceFinance.statProjectedTotal")}
              value={formatCurrencyILS(forecast.totalProjected)}
              icon={TrendingUp}
              hint={t("workspaceFinance.statProjectedTotalHint")}
            />
          </>
        }
      />

      {/* Flow (cash forecast stack) */}
      <WorkspaceSurface
        axis="finance"
        title={t("workspaceFinance.flowTitle")}
        description={t("workspaceFinance.flowSubtitle")}
        actions={
          <p className="text-sm text-[color:var(--ink-500)]">
            {t("workspaceFinance.totalProjectedLabel")}{" "}
            <span className="font-black text-[color:var(--ink-900)]">{formatCurrencyILS(forecast.totalProjected)}</span>
          </p>
        }
      >
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-[color:var(--canvas-sunken)]">
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
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">{t("workspaceFinance.boxPaid")}</p>
            <p className="mt-1 text-lg font-black tabular-nums text-[color:var(--state-success)]">{formatCurrencyILS(forecast.actual)}</p>
          </div>
          <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">{t("workspaceFinance.boxPending")}</p>
            <p className="mt-1 text-lg font-black tabular-nums text-[color:var(--axis-finance)]">{formatCurrencyILS(forecast.pending)}</p>
          </div>
          <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">{t("workspaceFinance.boxForecast")}</p>
            <p className="mt-1 text-lg font-black tabular-nums text-[color:var(--state-info)]">{formatCurrencyILS(forecast.forecast)}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-[color:var(--ink-400)]">
          {t("workspaceFinance.flowFootnote")}
        </p>
      </WorkspaceSurface>

      {/* KPI grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: t("workspaceFinance.statOpenDocs"),
            value: totals.pendingIssuedCount.toString(),
            sub: formatCurrencyILS(totals.pendingIssuedTotal),
            icon: Landmark,
          },
          {
            label: t("workspaceFinance.statPendingIssued"),
            value: formatCurrencyILS(totals.pendingIssuedTotal),
            sub: t("workspaceFinance.statPendingIssuedHint", { count: String(totals.pendingIssuedCount) }),
            icon: FileSpreadsheet,
          },
          {
            label: t("workspaceFinance.statPaidIssued"),
            value: formatCurrencyILS(totals.paidIssuedTotal),
            sub: t("workspaceFinance.statPaidIssuedHint", { count: String(totals.paidIssuedCount) }),
            icon: ArrowUpRight,
          },
          {
            label: t("workspaceFinance.statSettings"),
            value: t("workspaceFinance.statSettingsValue"),
            sub: t("workspaceFinance.statSettingsHint"),
            icon: CreditCard,
          },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="holo-border-card axis-finance flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[color:var(--ink-500)]">{label}</p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--axis-finance-soft)", color: "var(--axis-finance)" }}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xl font-black tabular-nums text-[color:var(--ink-900)]">{value}</p>
            <p className="text-[12px] leading-relaxed text-[color:var(--ink-500)]">{sub}</p>
          </div>
        ))}
      </section>

      {/* Two-column: top clients × top projects */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <WorkspaceSurface
          axis="clients"
          title={t("workspaceFinance.linkedClientsTitle")}
          description={t("workspaceFinance.linkedClientsSubtitle")}
        >
          <div className="grid gap-3">
            {topPendingClients.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
                {t("workspaceFinance.linkedClientsEmpty")}
              </div>
            ) : (
              topPendingClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[color:var(--ink-900)]">{client.name}</p>
                    <p className="mt-1 text-[12px] text-[color:var(--ink-500)]">
                      {t("workspaceFinance.linkedClientsLine", {
                        count: String(client.invoiceCount),
                        project: client.project?.name ?? t("workspaceClients.card.noProject"),
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-black tabular-nums text-[color:var(--axis-finance)]">
                    {formatCurrencyILS(client.totalPending)}
                  </span>
                </div>
              ))
            )}
            <div className="mt-1 flex flex-wrap gap-2">
              <Link href="/app/clients" className="v2-button v2-button-secondary">
                {t("workspaceFinance.clientsCta")}
              </Link>
              <Link href="/app/ai" className="v2-button v2-button-secondary">
                {t("workspaceFinance.aiCta")}
              </Link>
            </div>
          </div>
        </WorkspaceSurface>

        <WorkspaceSurface
          axis="finance"
          title={t("workspaceFinance.projectsTitle")}
          description={t("workspaceFinance.projectsSubtitle")}
        >
          <div className="grid gap-3">
            {topProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
                {t("workspaceFinance.projectsEmpty")}
              </div>
            ) : (
              topProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[color:var(--ink-900)]">{project.name}</p>
                    <p className="mt-1 text-[12px] text-[color:var(--ink-500)]">
                      {t("workspaceFinance.projectsLine", {
                        deals: String(project.activeDeals),
                        billed: formatCurrencyILS(project.billedTotal),
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-black tabular-nums text-[color:var(--axis-finance)]">
                    {formatCurrencyILS(project.pendingCollection)}
                  </span>
                </div>
              ))
            )}

            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <Link
                href="/app/documents/erp"
                className="group flex items-center justify-between gap-4 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 transition hover:border-[color:var(--axis-finance)] hover:shadow-[var(--shadow-sm)]"
              >
                <div>
                  <p className="font-bold text-[color:var(--ink-900)]">{t("workspaceFinance.erpCardTitle")}</p>
                  <p className="mt-1 text-[13px] text-[color:var(--ink-500)]">{t("workspaceFinance.erpCardBody")}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--axis-finance)] transition group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/app/documents/issue"
                className="group flex items-center justify-between gap-4 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 transition hover:border-[color:var(--axis-finance)] hover:shadow-[var(--shadow-sm)]"
              >
                <div>
                  <p className="font-bold text-[color:var(--ink-900)]">{t("workspaceFinance.issueCardTitle")}</p>
                  <p className="mt-1 text-[13px] text-[color:var(--ink-500)]">{t("workspaceFinance.issueCardBody")}</p>
                </div>
                <FileText className="h-4 w-4 shrink-0 text-[color:var(--axis-finance)] transition group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            </div>
          </div>
        </WorkspaceSurface>
      </div>
    </div>
  );
}
