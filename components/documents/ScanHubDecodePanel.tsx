"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChevronDown, ChevronUp, FileSearch, Filter, LayoutGrid, Link2, ListFilter, Loader2, PencilLine, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/claude";
import type { TFunction } from "@/lib/i18n/translate";
import { DOC_UI_FALLBACK } from "@/lib/documents-ui-constants";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";

type ScannedDocumentRecord = {
  id: string;
  fileName: string;
  type: string;
  status: string;
  createdAt: string;
  vendor: string;
  total: number;
  summary: string;
  extractedType: string;
  lineItemCount: number;
};

type IssuedItemRecord = {
  desc?: string;
  qty?: number;
  price?: number;
};

type HubIssuedDocument = {
  id: string;
  type: string;
  number: number;
  date: string;
  dueDate: string | null;
  clientName: string;
  amount: number;
  vat: number;
  total: number;
  status: string;
  items: IssuedItemRecord[];
  contactId: string | null;
};

type ContactOption = { id: string; name: string };

type Props = {
  t: TFunction;
  industryProfile: IndustryProfile;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  isPending: boolean;
  startFilterTransition: (fn: () => void) => void;
  activeTab: "scanned" | "issued";
  setActiveTab: (v: "scanned" | "issued") => void;
  startTransition: (fn: () => void) => void;
  filteredScanned: ScannedDocumentRecord[];
  filteredIssued: HubIssuedDocument[];
  contacts: ContactOption[];
  actionMessage: { type: "success" | "error"; text: string } | null;
  vendors: string[];
  libraryInsightsOpen: boolean;
  setLibraryInsightsOpen: Dispatch<SetStateAction<boolean>>;
  scannedReviewCount: number;
  issuedPendingCount: number;
  translateFallback: (value: string, canonical: string, key: string, t: TFunction) => string;
  issuedTypeLabel: (t: TFunction, type: string) => string;
  statusLabel: (t: TFunction, kind: "scanned" | "issued", status: string) => string;
  badgeClass: (status: string, kind: "scanned" | "issued") => string;
  peekScannedDocument: (document: ScannedDocumentRecord) => void;
  peekIssuedDocument: (document: HubIssuedDocument) => void;
  openScanned: (document: ScannedDocumentRecord) => void;
  openIssued: (document: HubIssuedDocument) => void;
  deleteScannedDocument: (document: ScannedDocumentRecord) => void | Promise<void>;
  deleteIssuedDocument: (document: HubIssuedDocument) => void | Promise<void>;
  setLinkingDoc: (document: ScannedDocumentRecord | null) => void;
};

export default function ScanHubDecodePanel(props: Props) {
  const {
    t,
    industryProfile,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isPending,
    startFilterTransition,
    activeTab,
    setActiveTab,
    startTransition,
    filteredScanned,
    filteredIssued,
    contacts,
    actionMessage,
    vendors,
    libraryInsightsOpen,
    setLibraryInsightsOpen,
    scannedReviewCount,
    issuedPendingCount,
    translateFallback,
    issuedTypeLabel,
    statusLabel,
    badgeClass,
    peekScannedDocument,
    peekIssuedDocument,
    openScanned,
    openIssued,
    deleteScannedDocument,
    deleteIssuedDocument,
    setLinkingDoc,
  } = props;

  return (
    <div className="space-y-4">
      <Surface className="flex flex-wrap items-center gap-3 !p-4">
        <div className="relative flex min-w-[200px] flex-1 items-center">
          <Filter className="absolute start-3 h-4 w-4 text-[color:var(--ink-400)]" aria-hidden />
          <input
            id="documents-search-modal"
            value={search}
            onChange={(event) => {
              const nextValue = event.target.value;
              startFilterTransition(() => setSearch(nextValue));
            }}
            className="w-full rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] py-2.5 pe-4 ps-10 text-sm font-medium outline-none transition focus:border-[color:var(--axis-finance)] focus:ring-2 focus:ring-[color:var(--axis-finance-soft)]"
            placeholder={t("workspaceDocuments.searchPlaceholder")}
          />
          {isPending ? (
            <div className="absolute end-3">
              <Loader2 className="h-4 w-4 animate-spin text-[color:var(--axis-finance)]" aria-hidden />
            </div>
          ) : null}
        </div>

        <select
          id="documents-status-filter-modal"
          value={statusFilter}
          onChange={(event) => startFilterTransition(() => setStatusFilter(event.target.value))}
          className="rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-800)] outline-none transition hover:border-[color:var(--ink-400)] focus:border-[color:var(--axis-finance)]"
        >
          <option value="ALL">{t("workspaceDocuments.statusAll")}</option>
          <option value="PROCESSED">{statusLabel(t, "scanned", "PROCESSED")}</option>
          <option value="REVIEW">{statusLabel(t, "scanned", "REVIEW")}</option>
          <option value="FAILED">{statusLabel(t, "scanned", "FAILED")}</option>
          <option value="PENDING">{statusLabel(t, "issued", "PENDING")}</option>
          <option value="PAID">{statusLabel(t, "issued", "PAID")}</option>
          <option value="CANCELLED">{statusLabel(t, "issued", "CANCELLED")}</option>
        </select>

        <div className="flex items-center gap-1 rounded-xl bg-[color:var(--canvas-sunken)] p-1">
          <button
            type="button"
            onClick={() => startTransition(() => setActiveTab("scanned"))}
            title={t("workspaceDocuments.tabScanned")}
            aria-label={t("workspaceDocuments.tabScanned")}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition ${
              activeTab === "scanned"
                ? "bg-white text-[color:var(--ink-900)] shadow-sm"
                : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-800)]"
            }`}
          >
            <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => setActiveTab("issued"))}
            title={t("workspaceDocuments.tabIssued")}
            aria-label={t("workspaceDocuments.tabIssued")}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition ${
              activeTab === "issued"
                ? "bg-white text-[color:var(--ink-900)] shadow-sm"
                : "text-[color:var(--ink-500)] hover:text-[color:var(--ink-800)]"
            }`}
          >
            <ListFilter className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </Surface>

      {actionMessage ? (
        <div
          className={`rounded-[var(--cd-radius)] border px-4 py-3 text-sm font-semibold ${
            actionMessage.type === "success"
              ? "border-[color:var(--cd-line)] bg-[color:var(--cd-positive-soft)] text-[color:var(--cd-positive)]"
              : "border-[color:var(--cd-line)] bg-[color:var(--cd-negative-soft)] text-[color:var(--cd-negative)]"
          }`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      <div className="space-y-3">
        {activeTab === "scanned" ? (
          <>
            {filteredScanned.length === 0 ? (
              <EmptyState
                variant="bare"
                icon={FileSearch}
                title={t("workspaceDocuments.emptyScannedTitle")}
                description={t("workspaceDocuments.emptyScannedBody")}
                className="py-6"
              />
            ) : null}
            <ul className="space-y-2">
              {filteredScanned.map((document) => {
                const vendorDisplay = translateFallback(
                  document.vendor,
                  DOC_UI_FALLBACK.unknownVendor,
                  "workspaceDocuments.fallbacks.unknownVendor",
                  t,
                );
                return (
                  <li
                    key={document.id}
                    className="flex items-stretch gap-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)]"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 px-3 py-2.5 text-start transition hover:bg-[color:var(--canvas-sunken)]"
                      onClick={() => peekScannedDocument(document)}
                      aria-label={t("workspaceAiHub.rowPeekAria")}
                    >
                      <span className="block truncate text-sm font-black text-[color:var(--ink-900)]">{vendorDisplay}</span>
                      <span className="mt-0.5 block truncate text-xs text-[color:var(--ink-500)]">{document.fileName}</span>
                      <span className="mt-1 block text-[11px] font-semibold text-[color:var(--ink-400)]">
                        {document.total > 0 ? formatCurrencyILS(document.total) : t("workspaceDocuments.noAmountDetected")} ·{" "}
                        {t("workspaceDocuments.itemCount", { count: String(document.lineItemCount) })}
                      </span>
                    </button>
                    <span
                      className={`self-center shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${badgeClass(document.status, "scanned")}`}
                    >
                      {statusLabel(t, "scanned", document.status)}
                    </span>
                    <div className="flex shrink-0 flex-col justify-center gap-1 border-s border-[color:var(--line)] py-1 pe-1 ps-1">
                      {contacts.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setLinkingDoc(document)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ink-500)] hover:bg-indigo-50 hover:text-indigo-700"
                          aria-label={t("workspaceDocuments.linkClientAria")}
                        >
                          <Link2 className="h-4 w-4" aria-hidden />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openScanned(document)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ink-500)] hover:bg-[color:var(--canvas-sunken)]"
                        aria-label={t("workspaceAiHub.rowEditAria")}
                      >
                        <PencilLine className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteScannedDocument(document)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                        aria-label={t("workspaceDocuments.buttonDelete")}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            {filteredIssued.length === 0 ? (
              <EmptyState
                variant="bare"
                icon={ListFilter}
                title={t("workspaceDocuments.emptyIssuedTitle")}
                description={t("workspaceDocuments.emptyIssuedBody")}
                className="py-6"
              />
            ) : null}
            <ul className="space-y-2">
              {filteredIssued.map((document) => (
                <li
                  key={document.id}
                  className="flex items-stretch gap-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)]"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-3 py-2.5 text-start transition hover:bg-[color:var(--canvas-sunken)]"
                    onClick={() => peekIssuedDocument(document)}
                    aria-label={t("workspaceAiHub.rowPeekAria")}
                  >
                    <span className="block truncate text-sm font-black text-[color:var(--ink-900)]">{document.clientName}</span>
                    <span className="mt-0.5 block truncate text-xs text-[color:var(--ink-500)]">
                      {issuedTypeLabel(t, document.type)} #{document.number}
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold text-[color:var(--ink-400)]">
                      {formatCurrencyILS(document.total)} · {formatShortDate(document.date)}
                    </span>
                  </button>
                  <span
                    className={`self-center shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${badgeClass(document.status, "issued")}`}
                  >
                    {statusLabel(t, "issued", document.status)}
                  </span>
                  <div className="flex shrink-0 flex-col justify-center gap-1 border-s border-[color:var(--line)] py-1 pe-1 ps-1">
                    <button
                      type="button"
                      onClick={() => openIssued(document)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ink-500)] hover:bg-[color:var(--canvas-sunken)]"
                      aria-label={t("workspaceAiHub.rowEditAria")}
                    >
                      <PencilLine className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteIssuedDocument(document)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                      aria-label={t("workspaceDocuments.buttonDelete")}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)]">
        <button
          type="button"
          onClick={() => setLibraryInsightsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start"
          aria-expanded={libraryInsightsOpen}
        >
          <span className="text-sm font-black text-[color:var(--cd-ink)]">{t("workspaceAiHub.insightsTitle")}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-[color:var(--cd-ink-mute)]">
            {libraryInsightsOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
          </span>
        </button>
        {libraryInsightsOpen ? (
          <div className="max-h-[40vh] space-y-3 overflow-y-auto border-t border-[color:var(--cd-line)] p-4">
            <Surface className="bg-[color:var(--cd-bg-tint)] !p-4">
              <p className="text-xs font-black text-[color:var(--cd-ink)]">{t("workspaceDocuments.sidebarTemplatesTitle")}</p>
              <div className="mt-3 grid gap-2">
                {industryProfile.templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[var(--cd-radius)] border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)] px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-[color:var(--cd-ink)]">{template.label}</p>
                      <span className="shrink-0 rounded-full bg-[color:var(--cd-bg-sunken)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--cd-ink-mute)]">
                        {template.kind}
                      </span>
                    </div>
                    <p className="cd-mute mt-1 text-xs leading-relaxed">{template.description}</p>
                  </div>
                ))}
              </div>
            </Surface>
            <Surface className="!p-4">
              <p className="text-xs font-black text-[color:var(--cd-ink)]">{t("workspaceDocuments.sidebarVendorsTitle")}</p>
              <div className="mt-3 grid gap-2">
                {vendors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50/90 px-3 py-4 text-center text-xs leading-relaxed text-slate-500">
                    {t("workspaceDocuments.sidebarVendorsEmpty")}
                  </div>
                ) : null}
                {vendors.map((vendor) => (
                  <div
                    key={vendor}
                    className="rounded-[var(--cd-radius)] bg-[color:var(--cd-bg-sunken)] px-3 py-2 text-xs font-medium text-[color:var(--cd-ink)]"
                  >
                    {translateFallback(vendor, DOC_UI_FALLBACK.unknownVendor, "workspaceDocuments.fallbacks.unknownVendor", t)}
                  </div>
                ))}
              </div>
            </Surface>
            <Surface className="!p-4">
              <p className="text-xs font-black text-[color:var(--cd-ink)]">{t("workspaceDocuments.sidebarSnapshotTitle")}</p>
              <div className="mt-3 grid gap-2">
                {[
                  t("workspaceDocuments.snapshotLine1", { count: String(scannedReviewCount) }),
                  t("workspaceDocuments.snapshotLine2", { count: String(issuedPendingCount) }),
                  t("workspaceDocuments.snapshotLine3", { count: String(filteredIssued.length) }),
                ].map((item) => (
                  <div key={item} className="rounded-[var(--cd-radius)] bg-[color:var(--cd-bg-sunken)] px-3 py-2">
                    <p className="text-xs leading-relaxed text-[color:var(--cd-ink)]">{item}</p>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        ) : null}
      </div>
    </div>
  );
}
