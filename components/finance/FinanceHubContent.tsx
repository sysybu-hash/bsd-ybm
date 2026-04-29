import Link from "next/link";
import {
  ClipboardList,
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
import FinanceMainTabs from "@/components/finance/FinanceMainTabs";
import { HeaderResponsiveLabel } from "@/components/layout/WorkspacePageHeader";
import { PageHeader, Stat } from "@/components/ui/claude";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import type { FinanceExpenseRow, FinanceIssuedRow, FinanceSelectOption } from "@/lib/finance-workspace-types";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import type { CommercialHubSnapshot } from "@/lib/workspace/load-commercial-hub";

type Props = {
  snapshot: CommercialHubSnapshot;
  organizationId: string;
  industryProfile: IndustryProfile;
  userFirstName: string;
  issuedDocuments: FinanceIssuedRow[];
  expenses: FinanceExpenseRow[];
  expenseMonthPostedTotal: number;
  projectOptions: FinanceSelectOption[];
  contactOptions: FinanceSelectOption[];
  initialFinanceTab?: "overview" | "documents" | "collection" | "expenses";
};

export default async function FinanceHubContent({
  snapshot,
  organizationId,
  industryProfile,
  userFirstName,
  issuedDocuments,
  expenses,
  expenseMonthPostedTotal,
  projectOptions,
  contactOptions,
  initialFinanceTab,
}: Props) {
  const messages = await readRequestMessages();
  const t = createTranslator(messages);
  const { totals, contacts, projects, issuedMonthOverMonthPct, documentDrafts } = snapshot;
  const { billingPendingCount, billingPendingTotal, documentDraftsCount } = totals;
  const totalInvoiced = totals.pendingIssuedTotal + totals.paidIssuedTotal;
  const collectionRate = totalInvoiced > 0 ? Math.round((totals.paidIssuedTotal / totalInvoiced) * 100) : 0;
  const target = Math.max(60_000, Math.ceil((totalInvoiced * 1.3) / 1000) * 1000);
  const targetProgress = target > 0 ? Math.min(100, Math.round((totalInvoiced / target) * 100)) : 0;

  const topPendingClients = contacts
    .filter((c) => c.totalPending > 0)
    .sort((a, b) => b.totalPending - a.totalPending)
    .slice(0, 5);
  const topProjects = [...projects].sort((a, b) => b.pendingCollection - a.pendingCollection).slice(0, 4);

  const cashSpark = [3, 5, 4, 7, 6, 9, 8, 12, 10, 15].map((v) => v * Math.max(1, totalInvoiced / 1500));

  const insightParts: string[] = [];
  if (billingPendingCount > 0) {
    insightParts.push(
      t("workspaceFinance.aiInsight.billingOnly", {
        count: String(billingPendingCount),
        amount: formatCurrencyILS(billingPendingTotal),
      }),
    );
  } else if (totals.pendingIssuedCount > 0) {
    insightParts.push(
      t("workspaceFinance.aiInsight.pending", {
        count: String(totals.pendingIssuedCount),
        amount: formatCurrencyILS(totals.pendingIssuedTotal),
      }),
    );
  }
  if (documentDraftsCount > 0) {
    insightParts.push(t("workspaceFinance.aiInsight.draftsOnly", { count: String(documentDraftsCount) }));
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
    <div className="cd-canvas w-full min-w-0 space-y-10" dir="rtl">
      <PageHeader
        eyebrow={t("workspaceFinance.eyebrow")}
        title={t("workspaceFinance.heroTitle")}
        subtitle={t("workspaceFinance.heroSubtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/app/crm" className="cd-btn border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]">
              {industryProfile.clientsLabel}
            </Link>
            <Link href="#erp-wizard" className="cd-btn cd-btn-primary">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              <HeaderResponsiveLabel short={t("workspaceFinance.issueCtaShort")} long={t("workspaceFinance.issueCta")} />
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          label={t("workspaceFinance.heroKpiTotalInvoiced")}
          value={formatCurrencyILS(totalInvoiced)}
          icon={FileText}
          href="/app/erp"
        />
        <Stat
          label={t("workspaceFinance.heroKpiCollectionRate")}
          value={`${collectionRate}%`}
          icon={TrendingUp}
          href="/app/erp"
        />
        <Stat
          label={t("workspaceFinance.heroKpiPendingBalance")}
          value={formatCurrencyILS(billingPendingTotal)}
          icon={CreditCard}
          href="/app/erp?tab=documents"
        />
        <Stat
          label={t("workspaceFinance.heroKpiDraftsPipeline")}
          value={String(documentDraftsCount)}
          icon={ClipboardList}
          href="/app/scan"
        />
        <Stat label={t("workspaceFinance.heroKpiMonthlyTarget")} value={formatCurrencyILS(target)} icon={Landmark} href="/app/erp" />
        <Stat
          label={t("workspaceFinance.expenseMonthKpi")}
          value={formatCurrencyILS(expenseMonthPostedTotal)}
          icon={Landmark}
          href="/app/erp?tab=expenses#erp-scan-expense"
        />
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-3 py-3">
        <Link
          href="/app/settings/billing"
          className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white"
        >
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          {t("workspaceFinance.subscriptionCta")}
        </Link>
        <a
          href="/api/reports/finance-pdf"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          {t("workspaceFinance.reportPdf")}
        </a>
        <a
          href="/api/reports/finance-csv"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white"
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

      <FinanceMainTabs
        organizationId={organizationId}
        industryProfile={industryProfile}
        userFirstName={userFirstName}
        insightText={insightText}
        issuedRows={issuedDocuments}
        expenseRows={expenses}
        expenseMonthPostedTotal={expenseMonthPostedTotal}
        projectOptions={projectOptions}
        contactOptions={contactOptions}
        topPendingClients={topPendingClients}
        topProjects={topProjects}
        collectionRate={collectionRate}
        cashSpark={cashSpark}
        totalInvoiced={totalInvoiced}
        totalsPaid={totals.paidIssuedTotal}
        totalsPending={billingPendingTotal}
        paidCount={totals.paidIssuedCount}
        pendingCount={billingPendingCount}
        allPendingCount={totals.pendingIssuedCount}
        allPendingTotal={totals.pendingIssuedTotal}
        documentDraftsCount={documentDraftsCount}
        documentDrafts={documentDrafts}
        targetProgress={targetProgress}
        issuedMonthOverMonthPct={issuedMonthOverMonthPct}
        initialTab={initialFinanceTab}
      />

      <div className="flex items-center gap-2 rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2 text-[11px] text-[color:var(--ink-500)]">
        <Sparkles className="h-3.5 w-3.5 text-[color:var(--axis-ai)]" aria-hidden />
        {t("workspaceFinance.footerHint")}
      </div>
    </div>
  );
}
