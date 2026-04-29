"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FileText, Mail, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import { deleteExpenseAction } from "@/app/actions/expenses";
import { toastClientActionFeedback } from "@/lib/polish/action-response-toast";
import { useI18n } from "@/components/I18nProvider";
import FinanceExpenseForm from "@/components/finance/FinanceExpenseForm";
import FinanceHubAiAssist from "@/components/finance/FinanceHubAiAssist";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import type { FinanceExpenseRow, FinanceIssuedRow, FinanceSelectOption } from "@/lib/finance-workspace-types";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { isIssuedAwaitingCollectionType, isIssuedRemindable } from "@/lib/commercial-billing-helpers";
import type {
  CommercialClientSnapshot,
  CommercialDocumentDraftSnapshot,
  CommercialProjectSnapshot,
} from "@/lib/workspace/load-commercial-hub";
import {
  BentoGrid,
  ProgressBar,
  ProgressRing,
  Sparkline,
  Tile,
  TileHeader,
} from "@/components/ui/bento";
import { EmptyState } from "@/components/ui/empty-state";

const InvoiceIssuance = dynamic(() => import("@/components/InvoiceIssuance"), { ssr: false });

type Props = {
  organizationId: string;
  industryProfile: IndustryProfile;
  userFirstName: string;
  insightText: string;
  issuedRows: FinanceIssuedRow[];
  expenseRows: FinanceExpenseRow[];
  expenseMonthPostedTotal: number;
  projectOptions: FinanceSelectOption[];
  contactOptions: FinanceSelectOption[];
  topPendingClients: CommercialClientSnapshot[];
  topProjects: CommercialProjectSnapshot[];
  collectionRate: number;
  cashSpark: number[];
  totalInvoiced: number;
  totalsPaid: number;
  totalsPending: number;
  paidCount: number;
  /** חשבונית מס / מס-קבלה PENDING (גבייה) */
  pendingCount: number;
  allPendingCount?: number;
  allPendingTotal?: number;
  documentDraftsCount: number;
  documentDrafts: CommercialDocumentDraftSnapshot[];
  targetProgress: number;
  issuedMonthOverMonthPct: number;
  initialTab?: "overview" | "documents" | "collection" | "expenses";
};

function issuedTypeLabel(
  t: (key: string, params?: Record<string, string>) => string,
  type: string,
): string {
  const key = `workspaceFinance.issuedType_${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

function mailtoReminderHref(email: string, clientName: string, amountLabel: string): string {
  const subject = encodeURIComponent(`תזכורת תשלום${clientName ? ` — ${clientName}` : ""}`);
  const body = encodeURIComponent(
    `שלום,

זוהי תזכורת בנוגע לתשלום (${amountLabel}).

בברכה`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function FinanceMainTabs(props: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [deletePending, setDeletePending] = useState(false);
  const [tab, setTab] = useState<"overview" | "documents" | "collection" | "expenses">(
    () => props.initialTab ?? "overview",
  );
  const [docQuery, setDocQuery] = useState("");
  const [editingExpense, setEditingExpense] = useState<FinanceExpenseRow | null>(null);

  useEffect(() => {
    if (props.initialTab) setTab(props.initialTab);
  }, [props.initialTab]);

  const filteredIssued = useMemo(() => {
    const q = docQuery.trim().toLowerCase();
    if (!q) return props.issuedRows;
    return props.issuedRows.filter(
      (r) =>
        r.clientName.toLowerCase().includes(q) ||
        (r.projectName && r.projectName.toLowerCase().includes(q)) ||
        String(r.number).includes(q) ||
        r.type.toLowerCase().includes(q),
    );
  }, [props.issuedRows, docQuery]);

  const goTab = (id: typeof tab) => {
    setTab(id);
    router.replace(`/app/erp?tab=${id}`, { scroll: false });
  };

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => goTab(id)}
      className={`rounded-xl px-4 py-2 text-sm font-black transition ${
        tab === id
          ? "bg-[color:var(--axis-finance)] text-white shadow-sm"
          : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-600)] hover:text-[color:var(--ink-900)]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[color:var(--line-subtle)] pb-3">
        {tabBtn("overview", t("workspaceFinance.tabOverview"))}
        {tabBtn("documents", t("workspaceFinance.tabDocuments"))}
        {tabBtn("collection", t("workspaceFinance.tabCollection"))}
        {tabBtn("expenses", t("workspaceFinance.tabExpenses"))}
      </div>

      {tab === "overview" ? (
        <BentoGrid>
          <Tile tone="ai" span={4} rows={2}>
            <TileHeader eyebrow={t("workspaceFinance.aiInsight.eyebrow")} liveDot />
            <p className="mt-3 text-[14px] leading-6 text-white/95 line-clamp-4">{props.insightText}</p>
            <div className="mt-5 flex items-center justify-center">
              <ProgressRing value={props.collectionRate} axis="ai" size={150} strokeWidth={12}>
                <span className="text-3xl font-black text-white tabular-nums">{props.collectionRate}%</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-violet-200/80">
                  {t("workspaceFinance.statCollectionRate")}
                </span>
              </ProgressRing>
            </div>
            <div className="mt-5 flex justify-center">
              <FinanceHubAiAssist
                orgId={props.organizationId}
                industryProfile={props.industryProfile}
                userFirstName={props.userFirstName}
                insightText={props.insightText}
                sectionLabel={t("workspaceFinance.eyebrow")}
                variant="hero"
              />
            </div>
          </Tile>

          <Tile tone="finance" span={8}>
            <TileHeader eyebrow={t("workspaceFinance.monthTitle")} />
            <div className="mt-5 flex items-end justify-between gap-4">
              <div className="flex-1">
                <Sparkline values={props.cashSpark} axis="finance" height={100} />
              </div>
              <div className="shrink-0 text-start">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">צמיחה חודשית</p>
                <p
                  className={`mt-1 text-2xl font-black tabular-nums ${props.issuedMonthOverMonthPct >= 0 ? "text-[color:var(--state-success)]" : "text-[color:var(--state-warning)]"}`}
                >
                  {props.issuedMonthOverMonthPct > 0 ? "+" : ""}
                  {props.issuedMonthOverMonthPct}%
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/30 pt-6">
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[color:var(--ink-600)]">
                <span>התקדמות ליעד</span>
                <span>{props.targetProgress}%</span>
              </div>
              <ProgressBar value={props.targetProgress} axis="finance" glow />
            </div>
          </Tile>

          <Tile tone="neutral" span={3}>
            <TileHeader eyebrow={t("workspaceFinance.boxPaid")} />
            <p className="tile-hero-value mt-3 text-[color:var(--state-success)]">{formatCurrencyILS(props.totalsPaid)}</p>
            <p className="mt-1 text-[11px] font-bold text-[color:var(--ink-500)]">
              {t("workspaceFinance.statPaidIssuedHint", { count: String(props.paidCount) })}
            </p>
          </Tile>
          <Tile tone="neutral" span={3}>
            <TileHeader eyebrow={t("workspaceFinance.boxBillingPending")} />
            <p className="tile-hero-value mt-3 text-[color:var(--state-warning)]">{formatCurrencyILS(props.totalsPending)}</p>
            <p className="mt-1 text-[11px] font-bold text-[color:var(--ink-500)]">
              {t("workspaceFinance.statBillingPendingHint", { count: String(props.pendingCount) })}
            </p>
          </Tile>
          <Tile tone="neutral" span={3}>
            <TileHeader eyebrow={t("workspaceFinance.boxDraftPipeline")} />
            <p className="tile-hero-value mt-3 text-[color:var(--ink-800)] tabular-nums">
              {props.documentDraftsCount}
            </p>
            <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">
              {t("workspaceFinance.statDraftDocumentsHint")}
            </p>
            {props.documentDraftsCount > 0 ? (
              <Link
                href="/app/scan"
                className="mt-3 inline-block text-xs font-bold text-[color:var(--axis-finance)] hover:underline"
              >
                {t("workspaceFinance.draftsCtaConvert")} →
              </Link>
            ) : null}
          </Tile>
          <Tile tone="neutral" span={3}>
            <TileHeader eyebrow={t("workspaceFinance.expenseMonthKpi")} />
            <p className="tile-hero-value mt-3 text-[color:var(--axis-finance-ink)]">
              {formatCurrencyILS(props.expenseMonthPostedTotal)}
            </p>
            <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">{t("workspaceFinance.expenseMonthKpiHint")}</p>
          </Tile>
        </BentoGrid>
      ) : null}

      {tab === "documents" ? (
        <div className="space-y-8">
          <div className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-4 md:p-6">
            <h2 className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceFinance.wizardTitle")}</h2>
            <p className="mt-1 text-sm text-[color:var(--ink-500)]">{t("workspaceFinance.wizardSubtitle")}</p>
            <div className="mt-6">
              <InvoiceIssuance orgId={props.organizationId} />
            </div>
          </div>
          {props.documentDrafts.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 md:p-5">
              <h2 className="text-lg font-black text-[color:var(--ink-900)]">
                {t("workspaceFinance.draftsSectionTitle")}{" "}
                <span className="text-sm font-bold text-amber-800">({props.documentDraftsCount})</span>
              </h2>
              <p className="mt-1 text-sm text-[color:var(--ink-600)]">{t("workspaceFinance.draftsSectionSubtitle")}</p>
              <ul className="mt-4 divide-y divide-amber-100">
                {props.documentDrafts.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[color:var(--ink-900)]">{d.fileName}</p>
                      <p className="text-xs text-[color:var(--ink-500)]">
                        {[d.projectLabel, d.clientLabel].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-[color:var(--ink-500)]">
                        {formatShortDate(d.createdAt)}
                      </span>
                      <Link
                        href="/app/scan"
                        className="rounded-lg bg-[color:var(--axis-finance)] px-3 py-1.5 text-xs font-black text-white hover:opacity-95"
                      >
                        {t("workspaceFinance.draftsCtaConvert")}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <FileText className="h-5 w-5 text-[color:var(--axis-finance)]" aria-hidden />
              <h2 className="text-lg font-black">{t("workspaceFinance.issuedTableTitle")}</h2>
              <input
                value={docQuery}
                onChange={(e) => setDocQuery(e.target.value)}
                placeholder={t("workspaceFinance.issuedSearchPlaceholder")}
                className="ms-auto min-w-[200px] flex-1 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-2 text-sm"
              />
            </div>
            {props.allPendingCount != null &&
            props.allPendingCount > props.pendingCount &&
            props.allPendingCount > 0 ? (
              <p className="mb-2 text-xs text-[color:var(--ink-500)]">
                מתוך {props.allPendingCount} מסמכים ב-PENDING הכוללים גם קבלות/זיכויים,{" "}
                {props.pendingCount} הם חשבונית מס/מס-קבלה שמיועדים לגבייה.
              </p>
            ) : null}
            <div className="overflow-x-auto rounded-xl border border-[color:var(--line)]">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-[color:var(--canvas-sunken)] text-start text-[11px] font-black uppercase text-[color:var(--ink-500)]">
                  <tr>
                    <th className="p-3">סוג</th>
                    <th className="p-3">מס׳</th>
                    <th className="p-3">לקוח</th>
                    <th className="p-3">{t("workspaceFinance.issuedColProject")}</th>
                    <th className="p-3">תאריך</th>
                    <th className="p-3">סטטוס</th>
                    <th className="p-3 text-end">סה״כ</th>
                    <th className="p-3">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssued.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4">
                        <EmptyState
                          variant="bare"
                          icon={docQuery.trim() ? Search : FileText}
                          title={
                            docQuery.trim()
                              ? t("workspaceFinance.issuedEmptySearchTitle")
                              : t("workspaceFinance.issuedEmptyTitle")
                          }
                          description={
                            docQuery.trim()
                              ? t("workspaceFinance.issuedEmptySearchSubtitle")
                              : t("workspaceFinance.issuedEmptySubtitle")
                          }
                          action={
                            docQuery.trim() ? (
                              <button
                                type="button"
                                onClick={() => setDocQuery("")}
                                className="rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-xs font-black text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
                              >
                                {t("workspaceFinance.clearSearch")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => goTab("documents")}
                                className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--axis-finance)] px-3 py-2 text-xs font-black text-white hover:opacity-95"
                              >
                                <Plus className="h-3.5 w-3.5" aria-hidden />
                                {t("workspaceFinance.issueCta")}
                              </button>
                            )
                          }
                          className="py-6"
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredIssued.map((r) => {
                    const canRemind = isIssuedRemindable(
                      r.type,
                      r.status,
                      Boolean(r.contactEmail && r.contactEmail.trim()),
                    );
                    return (
                    <tr key={r.id} className="border-t border-[color:var(--line-subtle)]">
                      <td className="p-3 font-bold">{issuedTypeLabel(t, r.type)}</td>
                      <td className="p-3 tabular-nums">{r.number}</td>
                      <td className="p-3">{r.clientName}</td>
                      <td className="p-3 text-xs">
                        {r.projectId && r.projectName ? (
                          <Link
                            href={`/app/crm/project/${encodeURIComponent(r.projectId)}`}
                            className="font-bold text-[color:var(--axis-finance)] hover:underline"
                          >
                            {r.projectName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 tabular-nums text-[color:var(--ink-500)]">{formatShortDate(r.date)}</td>
                      <td className="p-3">{r.status}</td>
                      <td className="p-3 text-end font-black tabular-nums">{formatCurrencyILS(r.total)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {r.contactId ? (
                            <Link
                              href={`/app/crm/client/${encodeURIComponent(r.contactId)}`}
                              className="text-xs font-bold text-[color:var(--axis-clients)] hover:underline"
                            >
                              לקוח
                            </Link>
                          ) : null}
                          {canRemind && r.contactEmail ? (
                            <a
                              href={mailtoReminderHref(
                                r.contactEmail,
                                r.clientName,
                                formatCurrencyILS(r.total),
                              )}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 hover:bg-slate-50"
                            >
                              <Mail className="h-3.5 w-3.5" aria-hidden />
                              {t("workspaceFinance.issuedRowReminder")}
                            </a>
                          ) : null}
                          {r.status === "PENDING" &&
                          isIssuedAwaitingCollectionType(r.type) &&
                          !r.contactEmail?.trim() ? (
                            <span
                              className="max-w-[120px] text-[10px] text-[color:var(--ink-500)]"
                              title={t("workspaceFinance.issuedRowReminderNoEmail")}
                            >
                              {t("workspaceFinance.issuedRowReminderNoEmail")}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "collection" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-5">
            <h2 className="text-lg font-black">{t("workspaceFinance.linkedClientsTitle")}</h2>
            {props.topPendingClients.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  variant="bare"
                  icon={Mail}
                  title={t("workspaceFinance.collectionClientsEmptyTitle")}
                  description={t("workspaceFinance.collectionClientsEmptySubtitle")}
                  className="py-8"
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-[color:var(--line-subtle)]">
                {props.topPendingClients.map((client) => (
                  <li key={client.id} className="py-3">
                    <Link href={`/app/crm/client/${encodeURIComponent(client.id)}`} className="flex justify-between gap-2 font-bold hover:text-[color:var(--axis-finance)]">
                      <span className="min-w-0 truncate">{client.name}</span>
                      <span className="shrink-0 tabular-nums">{formatCurrencyILS(client.totalPending)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-5">
            <h2 className="text-lg font-black">{t("workspaceFinance.projectsTitle")}</h2>
            {props.topProjects.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  variant="bare"
                  icon={Wallet}
                  title={t("workspaceFinance.collectionProjectsEmptyTitle")}
                  description={t("workspaceFinance.collectionProjectsEmptySubtitle")}
                  action={
                    <Link
                      href="/app/crm"
                      className="rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-xs font-black text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
                    >
                      {props.industryProfile.clientsLabel}
                    </Link>
                  }
                  className="py-8"
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-[color:var(--line-subtle)]">
                {props.topProjects.map((project) => (
                  <li key={project.id} className="py-3">
                    <Link
                      href={`/app/crm/project/${encodeURIComponent(project.id)}`}
                      className="flex justify-between gap-2 font-bold hover:text-[color:var(--axis-finance)]"
                    >
                      <span className="min-w-0 truncate">{project.name}</span>
                      <span className="shrink-0 tabular-nums">{formatCurrencyILS(project.pendingCollection)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {tab === "expenses" ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Wallet className="h-5 w-5 text-[color:var(--axis-finance)]" aria-hidden />
              <h2 className="text-lg font-black">{t("workspaceFinance.expenseFormTitle")}</h2>
            </div>
            <p className="mt-2 text-sm text-[color:var(--ink-500)]">{t("workspaceFinance.expenseScannerHint")}</p>
            <div className="mt-4">
              <FinanceExpenseForm projects={props.projectOptions} contacts={props.contactOptions} />
            </div>
            <p className="mt-4 text-xs text-[color:var(--ink-500)]">
              <a href="/app/erp?tab=expenses#erp-scan-expense" className="font-bold text-[color:var(--axis-ai)] hover:underline">
                {t("workspaceFinance.expenseScrollToScanner")}
              </a>
            </p>
          </div>
            <p className="text-xs text-[color:var(--ink-500)]">
              נטענו {props.expenseRows.length} הוצאות (מוגבל ל־80 אחרונות).
            </p>
            <div className="overflow-x-auto rounded-xl border border-[color:var(--line)]">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[color:var(--canvas-sunken)] text-start text-[11px] font-black uppercase text-[color:var(--ink-500)]">
                <tr>
                  <th className="p-3">תאריך</th>
                  <th className="p-3">ספק</th>
                  <th className="p-3">שיוך</th>
                  <th className="p-3">סטטוס</th>
                  <th className="p-3 text-end">סה״כ</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {props.expenseRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4">
                      <EmptyState
                        variant="bare"
                        icon={Wallet}
                        title={t("workspaceFinance.expensesEmptyTitle")}
                        description={t("workspaceFinance.expensesEmptySubtitle")}
                        action={
                          <a
                            href="/app/erp?tab=expenses#erp-scan-expense"
                            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--axis-finance)] px-3 py-2 text-xs font-black text-white hover:opacity-95"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            {t("workspaceFinance.expenseScrollToScanner")}
                          </a>
                        }
                        className="py-6"
                      />
                    </td>
                  </tr>
                ) : (
                  props.expenseRows.map((r) => (
                    <tr key={r.id} className="border-t border-[color:var(--line-subtle)]">
                    <td className="p-3 tabular-nums">{formatShortDate(r.expenseDate)}</td>
                    <td className="p-3">
                      <div className="font-bold">{r.vendorName}</div>
                      {r.invoiceNumber ? <div className="text-xs text-[color:var(--ink-500)]">{r.invoiceNumber}</div> : null}
                    </td>
                    <td className="p-3 text-xs">
                      {r.allocation === "OFFICE" && "משרד"}
                      {r.allocation === "PROJECT" && (r.projectName ?? r.projectId ?? "—")}
                      {r.allocation === "CLIENT" && (r.contactName ?? r.contactId ?? "—")}
                    </td>
                    <td className="p-3">{r.status}</td>
                    <td className="p-3 text-end font-black tabular-nums">{formatCurrencyILS(r.total)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)] disabled:opacity-50"
                          disabled={deletePending}
                          onClick={() => setEditingExpense(r)}
                          title="עריכה"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          disabled={deletePending}
                          onClick={() => {
                            if (!confirm("למחוק הוצאה זו?")) return;
                            void (async () => {
                              setDeletePending(true);
                              try {
                                const res = await toastClientActionFeedback(() => deleteExpenseAction(r.id), {
                                  successMessage: "ההוצאה נמחקה מהמערכת",
                                  loadingMessage: "מוחק הוצאה…",
                                  errorFallback: "מחיקת ההוצאה נכשלה",
                                });
                                if (res && typeof res === "object" && "ok" in res && (res as { ok: boolean }).ok) {
                                  router.refresh();
                                }
                              } finally {
                                setDeletePending(false);
                              }
                            })();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {editingExpense ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          onClick={() => setEditingExpense(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-black">עריכת הוצאה</h3>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-sm font-bold text-[color:var(--ink-500)] hover:bg-[color:var(--canvas-sunken)]"
                onClick={() => setEditingExpense(null)}
              >
                סגירה
              </button>
            </div>
            <FinanceExpenseForm
              key={editingExpense.id}
              projects={props.projectOptions}
              contacts={props.contactOptions}
              mode="edit"
              initialRow={editingExpense}
              onEditDone={() => {
                setEditingExpense(null);
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
