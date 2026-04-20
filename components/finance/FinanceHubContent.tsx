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
        eyebrow={t("workspaceFinance.eyebrow")}
        title={t("workspaceFinance.heroTitle")}
        description={t("workspaceFinance.heroSubtitle")}
        actions={
          <>
            <Link
              href="/app/settings/billing"
              className="v2-button v2-button-primary inline-flex shrink-0 items-center justify-center gap-2"
            >
              {t("workspaceFinance.subscriptionCta")}
              <CreditCard className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="/api/reports/finance-pdf"
              target="_blank"
              rel="noreferrer"
              className="v2-button v2-button-secondary inline-flex items-center justify-center gap-2"
            >
              {t("workspaceFinance.reportPdf")}
              <Download className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="/api/reports/finance-csv"
              target="_blank"
              rel="noreferrer"
              className="v2-button v2-button-secondary inline-flex items-center justify-center gap-2"
            >
              {t("workspaceFinance.reportCsv")}
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
            </a>
          </>
        }
        aside={
          <>
            <WorkspaceStatTile
              label={t("workspaceFinance.statPendingCollection")}
              value={formatCurrencyILS(totals.pendingCollection)}
              icon={Landmark}
              hint={t("workspaceFinance.statPendingCollectionHint")}
            />
            <WorkspaceStatTile
              label={t("workspaceFinance.statProjectedTotal")}
              value={formatCurrencyILS(forecast.totalProjected)}
              icon={TrendingUp}
              hint={t("workspaceFinance.statProjectedTotalHint")}
            />
          </>
        }
      />

      <WorkspaceSurface
        title={t("workspaceFinance.flowTitle")}
        description={t("workspaceFinance.flowSubtitle")}
        actions={
          <p className="text-sm text-[color:var(--v2-muted)]">
            {t("workspaceFinance.totalProjectedLabel")}{" "}
            <span className="font-black text-[color:var(--v2-ink)]">{formatCurrencyILS(forecast.totalProjected)}</span>
          </p>
        }
      >
        <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-[color:var(--v2-canvas)]">
          <div
            className="min-w-[2px] bg-emerald-500"
            style={{ flex: flexActual > 0 ? flexActual : 0 }}
            title={`${t("workspaceFinance.barPaid")}: ${formatCurrencyILS(forecast.actual)}`}
          />
          <div
            className="min-w-[2px] bg-amber-500"
            style={{ flex: flexPending > 0 ? flexPending : 0 }}
            title={`${t("workspaceFinance.barPending")}: ${formatCurrencyILS(forecast.pending)}`}
          />
          <div
            className="min-w-[2px] bg-sky-500"
            style={{ flex: flexForecast > 0 ? flexForecast : 0 }}
            title={`${t("workspaceFinance.barForecast")}: ${formatCurrencyILS(forecast.forecast)}`}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
            <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceFinance.boxPaid")}</p>
            <p className="mt-1 text-lg font-black text-[color:var(--v2-ink)]">{formatCurrencyILS(forecast.actual)}</p>
          </div>
          <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
            <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceFinance.boxPending")}</p>
            <p className="mt-1 text-lg font-black text-[color:var(--v2-ink)]">{formatCurrencyILS(forecast.pending)}</p>
          </div>
          <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
            <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceFinance.boxForecast")}</p>
            <p className="mt-1 text-lg font-black text-[color:var(--v2-ink)]">{formatCurrencyILS(forecast.forecast)}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-[color:var(--v2-muted)]">
          {t("workspaceFinance.flowFootnote")}
        </p>
      </WorkspaceSurface>

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
          <div key={label} className="glass-2026-panel relative z-0 p-5">
            <Icon className="relative z-[1] h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <p className="relative z-[1] mt-3 text-xs font-bold uppercase tracking-wide text-[color:var(--v2-muted)]">{label}</p>
            <p className="relative z-[1] mt-1 text-xl font-black text-[color:var(--v2-ink)]">{value}</p>
            <p className="relative z-[1] mt-2 text-xs text-[color:var(--v2-muted)]">{sub}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <WorkspaceSurface title={t("workspaceFinance.linkedClientsTitle")} description={t("workspaceFinance.linkedClientsSubtitle")}>
          <div className="grid gap-3">
            {topPendingClients.length === 0 ? (
              <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                {t("workspaceFinance.linkedClientsEmpty")}
              </div>
            ) : null}
            {topPendingClients.map((client) => (
              <div key={client.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-[color:var(--v2-ink)]">{client.name}</p>
                  <span className="text-sm font-black text-[color:var(--v2-accent)]">
                    {formatCurrencyILS(client.totalPending)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                  {t("workspaceFinance.linkedClientsLine", {
                    count: String(client.invoiceCount),
                    project: client.project?.name ?? t("workspaceClients.card.noProject"),
                  })}
                </p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Link href="/app/clients" className="v2-button v2-button-secondary">
                {t("workspaceFinance.clientsCta")}
              </Link>
              <Link href="/app/ai" className="v2-button v2-button-secondary">
                {t("workspaceFinance.aiCta")}
              </Link>
            </div>
          </div>
        </WorkspaceSurface>

        <WorkspaceSurface title={t("workspaceFinance.projectsTitle")} description={t("workspaceFinance.projectsSubtitle")}>
          <div className="grid gap-3">
            {topProjects.length === 0 ? (
              <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                {t("workspaceFinance.projectsEmpty")}
              </div>
            ) : null}
            {topProjects.map((project) => (
              <div key={project.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-[color:var(--v2-ink)]">{project.name}</p>
                  <span className="text-sm font-black text-[color:var(--v2-accent)]">
                    {formatCurrencyILS(project.pendingCollection)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                  {t("workspaceFinance.projectsLine", {
                    deals: String(project.activeDeals),
                    billed: formatCurrencyILS(project.billedTotal),
                  })}
                </p>
              </div>
            ))}

            <div className="grid gap-3 md:grid-cols-2">
              <Link
                href="/app/documents/erp"
                className="glass-2026-panel relative z-0 flex items-center justify-between gap-4 p-6 transition hover:border-[color:var(--v2-accent)]"
              >
                <div>
                  <p className="font-black text-[color:var(--v2-ink)]">{t("workspaceFinance.erpCardTitle")}</p>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{t("workspaceFinance.erpCardBody")}</p>
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
              </Link>
              <Link
                href="/app/documents/issue"
                className="glass-2026-panel relative z-0 flex items-center justify-between gap-4 p-6 transition hover:border-[color:var(--v2-accent)]"
              >
                <div>
                  <p className="font-black text-[color:var(--v2-ink)]">{t("workspaceFinance.issueCardTitle")}</p>
                  <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{t("workspaceFinance.issueCardBody")}</p>
                </div>
                <FileText className="h-5 w-5 shrink-0 text-[color:var(--v2-accent)]" aria-hidden />
              </Link>
            </div>
          </div>
        </WorkspaceSurface>
      </div>
    </div>
  );
}
