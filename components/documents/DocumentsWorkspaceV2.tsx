"use client";

import { startTransition, useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  FileSearch,
  Filter,
  FolderArchive,
  LayoutGrid,
  ListFilter,
  Loader2,
  PencilLine,
  ScanSearch,
  Sparkles,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { DOC_UI_FALLBACK } from "@/lib/documents-ui-constants";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import type { TFunction } from "@/lib/i18n/translate";

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

type IssuedDocumentRecord = {
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

type Props = Readonly<{
  industryProfile: IndustryProfile;
  scannedDocuments: ScannedDocumentRecord[];
  issuedDocuments: IssuedDocumentRecord[];
}>;

type ScannedDraft = {
  id: string;
  fileName: string;
  type: string;
  status: string;
  vendor: string;
  total: string;
  summary: string;
  extractedType: string;
  createdAt: string;
  lineItemCount: number;
};

type IssuedDraft = {
  id: string;
  type: string;
  status: string;
  clientName: string;
  date: string;
  dueDate: string;
  itemsText: string;
  total: number;
  number: number;
};

const SCANNED_STATUS_CLASS: Record<string, string> = {
  PROCESSED: "bg-emerald-100 text-emerald-700",
  REVIEW: "bg-amber-100 text-amber-700",
  FAILED: "bg-rose-100 text-rose-700",
};

const ISSUED_STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-200 text-slate-600",
};

function badgeClass(status: string, kind: "scanned" | "issued") {
  const map = kind === "scanned" ? SCANNED_STATUS_CLASS : ISSUED_STATUS_CLASS;
  return map[status] ?? "bg-slate-100 text-slate-700";
}

function statusLabel(t: TFunction, kind: "scanned" | "issued", status: string) {
  const prefix = kind === "scanned" ? "workspaceDocuments.scannedStatus." : "workspaceDocuments.issuedStatus.";
  return t(prefix + status);
}

function issuedTypeLabel(t: TFunction, type: string) {
  return t(`workspaceDocuments.issuedType.${type}`);
}

function translateFallback(value: string, canonical: string, key: string, t: TFunction) {
  return value === canonical ? t(key) : value;
}

function serializeIssuedItems(items: IssuedItemRecord[]) {
  return items
    .map((item) => `${item.desc ?? ""} | ${item.qty ?? 1} | ${item.price ?? 0}`)
    .join("\n");
}

function parseIssuedItems(text: string, t: TFunction) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { items: null as IssuedItemRecord[] | null, error: t("workspaceDocuments.parseErrors.minLines") };
  }

  const items: IssuedItemRecord[] = [];
  for (const line of lines) {
    const [descRaw, qtyRaw, priceRaw] = line.split("|").map((part) => part?.trim() ?? "");
    const qty = Number.parseFloat(qtyRaw || "1");
    const price = Number.parseFloat(priceRaw || "0");
    if (!descRaw) {
      return { items: null, error: t("workspaceDocuments.parseErrors.descRequired") };
    }
    if (!Number.isFinite(qty) || !Number.isFinite(price)) {
      return { items: null, error: t("workspaceDocuments.parseErrors.qtyPrice") };
    }
    items.push({ desc: descRaw, qty, price });
  }

  return { items, error: null as string | null };
}

function ScannedCard({
  document,
  onOpen,
  onDelete,
}: {
  document: ScannedDocumentRecord;
  onOpen: (document: ScannedDocumentRecord) => void;
  onDelete: (document: ScannedDocumentRecord) => void;
}) {
  const { t, dir } = useI18n();
  const badgeClassName = badgeClass(document.status, "scanned");
  const vendorDisplay = translateFallback(
    document.vendor,
    DOC_UI_FALLBACK.unknownVendor,
    "workspaceDocuments.fallbacks.unknownVendor",
    t,
  );
  const summaryDisplay = translateFallback(
    document.summary,
    DOC_UI_FALLBACK.noSummary,
    "workspaceDocuments.fallbacks.noSummary",
    t,
  );
  const typeDisplay = translateFallback(
    document.extractedType,
    DOC_UI_FALLBACK.unknownDocType,
    "workspaceDocuments.fallbacks.unknownDocType",
    t,
  );

  return (
    <article className="v2-panel overflow-hidden p-5" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-[color:var(--v2-ink)]">{vendorDisplay}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[color:var(--v2-muted)]">{document.fileName}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${badgeClassName}`}>
          {statusLabel(t, "scanned", document.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceDocuments.detectedAmount")}</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">
            {document.total > 0 ? formatCurrencyILS(document.total) : t("workspaceDocuments.noAmountDetected")}
          </p>
        </div>
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceDocuments.lineItemsDetected")}</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{document.lineItemCount}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--v2-line)] bg-white/76 px-4 py-3">
        <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceDocuments.labelDecipher")}</p>
        <p className="mt-2 text-sm font-semibold text-[color:var(--v2-ink)]">
          {t("workspaceDocuments.scannedMetaLine", {
            type: typeDisplay,
            date: formatShortDate(document.createdAt),
          })}
        </p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{summaryDisplay}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => onOpen(document)} className="v2-button v2-button-primary">
          {t("workspaceDocuments.buttonViewEdit")}
          <Eye className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => onDelete(document)} className="v2-button v2-button-secondary">
          {t("workspaceDocuments.buttonDelete")}
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}

function IssuedCard({
  document,
  onOpen,
  onDelete,
}: {
  document: IssuedDocumentRecord;
  onOpen: (document: IssuedDocumentRecord) => void;
  onDelete: (document: IssuedDocumentRecord) => void;
}) {
  const { t, dir } = useI18n();
  const badgeClassName = badgeClass(document.status, "issued");
  const typeLabel = issuedTypeLabel(t, document.type);

  return (
    <article className="v2-panel overflow-hidden p-5" dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-[color:var(--v2-ink)]">{document.clientName}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[color:var(--v2-muted)]">
            {typeLabel} #{document.number}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${badgeClassName}`}>
          {statusLabel(t, "issued", document.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceDocuments.totalAmount")}</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{formatCurrencyILS(document.total)}</p>
        </div>
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceDocuments.dateLabel")}</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{formatShortDate(document.date)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--v2-line)] bg-white/76 px-4 py-3">
        <p className="text-xs font-bold text-[color:var(--v2-muted)]">{t("workspaceDocuments.lineItemsInDoc")}</p>
        <p className="mt-2 text-sm font-semibold text-[color:var(--v2-ink)]">
          {t("workspaceDocuments.itemCount", { count: String(document.items.length) })}
        </p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">
          {document.dueDate
            ? t("workspaceDocuments.dueDateLine", { date: formatShortDate(document.dueDate) })
            : t("workspaceDocuments.noDueDate")}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => onOpen(document)} className="v2-button v2-button-primary">
          {t("workspaceDocuments.buttonViewEdit")}
          <PencilLine className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => onDelete(document)} className="v2-button v2-button-secondary">
          {t("workspaceDocuments.buttonDelete")}
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}

export default function DocumentsWorkspaceV2({
  industryProfile,
  scannedDocuments,
  issuedDocuments,
}: Props) {
  const { t, dir } = useI18n();
  const [scannedState, setScannedState] = useState(scannedDocuments);
  const [issuedState, setIssuedState] = useState(issuedDocuments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"scanned" | "issued">("scanned");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [scannedDraft, setScannedDraft] = useState<ScannedDraft | null>(null);
  const [issuedDraft, setIssuedDraft] = useState<IssuedDraft | null>(null);
  const [isPending, startFilterTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredScanned = useMemo(() => {
    return scannedState.filter((document) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        document.fileName.toLowerCase().includes(normalizedSearch) ||
        document.vendor.toLowerCase().includes(normalizedSearch) ||
        document.summary.toLowerCase().includes(normalizedSearch) ||
        document.extractedType.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || document.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [normalizedSearch, scannedState, statusFilter]);

  const filteredIssued = useMemo(() => {
    return issuedState.filter((document) => {
      const typeLabel = issuedTypeLabel(t, document.type).toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        document.clientName.toLowerCase().includes(normalizedSearch) ||
        document.number.toString().includes(normalizedSearch) ||
        typeLabel.includes(normalizedSearch) ||
        document.type.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || document.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [issuedState, normalizedSearch, statusFilter, t]);

  const scannedReviewCount = filteredScanned.filter(
    (document) =>
      document.status !== "PROCESSED" ||
      document.total <= 0 ||
      document.vendor === DOC_UI_FALLBACK.unknownVendor ||
      document.lineItemCount === 0,
  ).length;
  const issuedPendingCount = filteredIssued.filter((document) => document.status === "PENDING").length;
  const issuedTotal = filteredIssued.reduce((sum, document) => sum + document.total, 0);
  const vendors = Array.from(new Set(filteredScanned.map((document) => document.vendor))).slice(0, 5);

  function openScanned(document: ScannedDocumentRecord) {
    setActionMessage(null);
    setIssuedDraft(null);
    setScannedDraft({
      id: document.id,
      fileName: document.fileName,
      type: document.type,
      status: document.status,
      vendor: document.vendor,
      total: document.total > 0 ? String(document.total) : "",
      summary: document.summary,
      extractedType: document.extractedType,
      createdAt: document.createdAt,
      lineItemCount: document.lineItemCount,
    });
  }

  function openIssued(document: IssuedDocumentRecord) {
    setActionMessage(null);
    setScannedDraft(null);
    setIssuedDraft({
      id: document.id,
      type: document.type,
      status: document.status,
      clientName: document.clientName,
      date: document.date.slice(0, 10),
      dueDate: document.dueDate ? document.dueDate.slice(0, 10) : "",
      itemsText: serializeIssuedItems(document.items),
      total: document.total,
      number: document.number,
    });
  }

  async function saveScannedDraft() {
    if (!scannedDraft) return;
    setActionMessage(null);
    startSaveTransition(async () => {
      const response = await fetch(`/api/erp/documents/${scannedDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: scannedDraft.fileName,
          type: scannedDraft.type,
          status: scannedDraft.status,
          aiData: {
            vendor: scannedDraft.vendor,
            total: Number.parseFloat(scannedDraft.total || "0"),
            summary: scannedDraft.summary,
            docType: scannedDraft.extractedType,
          },
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setActionMessage({ type: "error", text: payload.error ?? t("workspaceDocuments.errors.saveScanned") });
        return;
      }

      setScannedState((current) =>
        current.map((item) =>
          item.id === scannedDraft.id
            ? {
                ...item,
                fileName: scannedDraft.fileName,
                type: scannedDraft.type,
                status: scannedDraft.status,
                vendor: scannedDraft.vendor,
                total: Number.parseFloat(scannedDraft.total || "0"),
                summary: scannedDraft.summary,
                extractedType: scannedDraft.extractedType,
              }
            : item,
        ),
      );
      setActionMessage({ type: "success", text: t("workspaceDocuments.success.savedScanned") });
    });
  }

  async function saveIssuedDraft() {
    if (!issuedDraft) return;
    const parsed = parseIssuedItems(issuedDraft.itemsText, t);
    if (!parsed.items) {
      setActionMessage({ type: "error", text: parsed.error ?? t("workspaceDocuments.errors.invalidItems") });
      return;
    }

    setActionMessage(null);
    startSaveTransition(async () => {
      const response = await fetch(`/api/erp/issued-documents/${issuedDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: issuedDraft.type,
          status: issuedDraft.status,
          clientName: issuedDraft.clientName,
          date: issuedDraft.date,
          dueDate: issuedDraft.dueDate || null,
          items: parsed.items,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setActionMessage({ type: "error", text: payload.error ?? t("workspaceDocuments.errors.saveIssued") });
        return;
      }

      const payload = (await response.json()) as { document: IssuedDocumentRecord };
      setIssuedState((current) =>
        current.map((item) =>
          item.id === issuedDraft.id
            ? {
                ...item,
                ...payload.document,
                date: new Date(payload.document.date).toISOString(),
                dueDate: payload.document.dueDate ? new Date(payload.document.dueDate).toISOString() : null,
              }
            : item,
        ),
      );
      setActionMessage({ type: "success", text: t("workspaceDocuments.success.savedIssued") });
    });
  }

  async function deleteScannedDocument(document: ScannedDocumentRecord) {
    const confirmed = window.confirm(t("workspaceDocuments.confirmDeleteScanned", { name: document.fileName }));
    if (!confirmed) return;

    const response = await fetch(`/api/erp/documents/${document.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setActionMessage({ type: "error", text: payload.error ?? t("workspaceDocuments.errors.deleteScanned") });
      return;
    }

    setScannedState((current) => current.filter((item) => item.id !== document.id));
    if (scannedDraft?.id === document.id) {
      setScannedDraft(null);
    }
    setActionMessage({ type: "success", text: t("workspaceDocuments.success.deletedScanned") });
  }

  async function deleteIssuedDocument(document: IssuedDocumentRecord) {
    const typeHuman = issuedTypeLabel(t, document.type);
    const confirmed = window.confirm(
      t("workspaceDocuments.confirmDeleteIssued", { type: typeHuman, number: String(document.number) }),
    );
    if (!confirmed) return;

    const response = await fetch(`/api/erp/issued-documents/${document.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setActionMessage({ type: "error", text: payload.error ?? t("workspaceDocuments.errors.deleteIssued") });
      return;
    }

    setIssuedState((current) => current.filter((item) => item.id !== document.id));
    if (issuedDraft?.id === document.id) {
      setIssuedDraft(null);
    }
    setActionMessage({ type: "success", text: t("workspaceDocuments.success.deletedIssued") });
  }

  const documentsLabel = industryProfile.documentsLabel;
  const industryLabel = industryProfile.industryLabel;

  return (
    <div className="grid gap-6" dir={dir}>
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">{t("workspaceDocuments.eyebrow")}</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              {t("workspaceDocuments.heroTitle", { documents: documentsLabel })}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              {t("workspaceDocuments.heroSubtitle", { industry: industryLabel })}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/app/documents/issue" className="v2-button v2-button-primary">
                {t("workspaceDocuments.ctaIssue")}
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/documents/erp" className="v2-button v2-button-secondary">
                {t("workspaceDocuments.ctaErp")}
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/documents/erp#erp-multi-scanner" className="v2-button v2-button-secondary">
                {t("workspaceDocuments.ctaScan")}
                <ScanSearch className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: t("workspaceDocuments.statScanned"), value: scannedState.length.toString(), icon: FileSearch },
              { label: t("workspaceDocuments.statIssued"), value: issuedState.length.toString(), icon: FolderArchive },
              { label: t("workspaceDocuments.statReview"), value: scannedReviewCount.toString(), icon: AlertTriangle },
              { label: t("workspaceDocuments.statIssuedTotal"), value: formatCurrencyILS(issuedTotal), icon: Tags },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="v2-panel p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {actionMessage ? (
        <div
          className={`rounded-[24px] border px-5 py-4 text-sm font-semibold ${
            actionMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="v2-panel p-5">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_auto]">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                  {t("workspaceDocuments.searchLabel")}
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3">
                  <Filter className="h-4 w-4 text-[color:var(--v2-muted)]" aria-hidden />
                  <input
                    value={search}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      startFilterTransition(() => setSearch(nextValue));
                    }}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--v2-muted)]"
                    placeholder={t("workspaceDocuments.searchPlaceholder")}
                  />
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--v2-accent)]" aria-hidden /> : null}
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                  {t("workspaceDocuments.statusLabel")}
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => startFilterTransition(() => setStatusFilter(event.target.value))}
                  className="rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                >
                  <option value="ALL">{t("workspaceDocuments.statusAll")}</option>
                  <option value="PROCESSED">{statusLabel(t, "scanned", "PROCESSED")}</option>
                  <option value="REVIEW">{statusLabel(t, "scanned", "REVIEW")}</option>
                  <option value="FAILED">{statusLabel(t, "scanned", "FAILED")}</option>
                  <option value="PENDING">{statusLabel(t, "issued", "PENDING")}</option>
                  <option value="PAID">{statusLabel(t, "issued", "PAID")}</option>
                  <option value="CANCELLED">{statusLabel(t, "issued", "CANCELLED")}</option>
                </select>
              </label>

              <div className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">
                  {t("workspaceDocuments.viewLabel")}
                </span>
                <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--v2-canvas)] p-1">
                  <button
                    type="button"
                    onClick={() => startTransition(() => setActiveTab("scanned"))}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      activeTab === "scanned" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                    {t("workspaceDocuments.tabScanned")}
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(() => setActiveTab("issued"))}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      activeTab === "issued" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                    }`}
                  >
                    <ListFilter className="h-4 w-4" aria-hidden />
                    {t("workspaceDocuments.tabIssued")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {activeTab === "scanned" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredScanned.length === 0 ? (
                <div className="v2-panel col-span-full p-8 text-center">
                  <p className="text-2xl font-black text-[color:var(--v2-ink)]">{t("workspaceDocuments.emptyScannedTitle")}</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{t("workspaceDocuments.emptyScannedBody")}</p>
                </div>
              ) : null}
              {filteredScanned.map((document) => (
                <ScannedCard
                  key={document.id}
                  document={document}
                  onOpen={openScanned}
                  onDelete={deleteScannedDocument}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredIssued.length === 0 ? (
                <div className="v2-panel col-span-full p-8 text-center">
                  <p className="text-2xl font-black text-[color:var(--v2-ink)]">{t("workspaceDocuments.emptyIssuedTitle")}</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{t("workspaceDocuments.emptyIssuedBody")}</p>
                </div>
              ) : null}
              {filteredIssued.map((document) => (
                <IssuedCard
                  key={document.id}
                  document={document}
                  onOpen={openIssued}
                  onDelete={deleteIssuedDocument}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="grid gap-4">
          <div className="v2-panel v2-panel-highlight p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceDocuments.sidebarTemplatesTitle")}</p>
            <div className="mt-4 grid gap-3">
              {industryProfile.templates.map((template) => (
                <div key={template.id} className="rounded-2xl bg-white/78 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[color:var(--v2-ink)]">{template.label}</p>
                    <span className="rounded-full bg-[color:var(--v2-canvas)] px-3 py-1 text-[11px] font-black text-[color:var(--v2-muted)]">
                      {template.kind}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{template.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceDocuments.sidebarVendorsTitle")}</p>
            <div className="mt-4 grid gap-3">
              {vendors.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                  {t("workspaceDocuments.sidebarVendorsEmpty")}
                </div>
              ) : null}
              {vendors.map((vendor) => (
                <div
                  key={vendor}
                  className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]"
                >
                  {translateFallback(vendor, DOC_UI_FALLBACK.unknownVendor, "workspaceDocuments.fallbacks.unknownVendor", t)}
                </div>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">{t("workspaceDocuments.sidebarSnapshotTitle")}</p>
            <div className="mt-4 grid gap-3">
              {[
                t("workspaceDocuments.snapshotLine1", { count: String(scannedReviewCount) }),
                t("workspaceDocuments.snapshotLine2", { count: String(issuedPendingCount) }),
                t("workspaceDocuments.snapshotLine3", { count: String(filteredIssued.length) }),
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {scannedDraft || issuedDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
          <div className="v2-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-7" dir={dir}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="v2-eyebrow">{t("workspaceDocuments.modalEyebrow")}</p>
                <h2 className="mt-3 text-2xl font-black text-[color:var(--v2-ink)]">
                  {scannedDraft ? t("workspaceDocuments.modalTitleScanned") : t("workspaceDocuments.modalTitleIssued")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setScannedDraft(null);
                  setIssuedDraft(null);
                  setActionMessage(null);
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--v2-line)] bg-white/90 text-[color:var(--v2-ink)]"
                aria-label={t("workspaceDocuments.closeAria")}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {scannedDraft ? (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={scannedDraft.fileName}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, fileName: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderFileName")}
                  />
                  <input
                    value={scannedDraft.vendor}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, vendor: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderVendor")}
                  />
                  <input
                    value={scannedDraft.extractedType}
                    onChange={(event) =>
                      setScannedDraft((current) => (current ? { ...current, extractedType: event.target.value } : current))
                    }
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderExtractedType")}
                  />
                  <select
                    value={scannedDraft.status}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, status: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  >
                    <option value="PROCESSED">{statusLabel(t, "scanned", "PROCESSED")}</option>
                    <option value="REVIEW">{statusLabel(t, "scanned", "REVIEW")}</option>
                    <option value="FAILED">{statusLabel(t, "scanned", "FAILED")}</option>
                  </select>
                  <input
                    value={scannedDraft.type}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, type: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderSystemType")}
                  />
                  <input
                    value={scannedDraft.total}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, total: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    dir="ltr"
                    placeholder={t("workspaceDocuments.placeholderAmount")}
                  />
                </div>

                <textarea
                  value={scannedDraft.summary}
                  onChange={(event) => setScannedDraft((current) => (current ? { ...current, summary: event.target.value } : current))}
                  className="min-h-[140px] rounded-3xl border border-[color:var(--v2-line)] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--v2-ink)] outline-none"
                  placeholder={t("workspaceDocuments.placeholderSummary")}
                />
              </div>
            ) : null}

            {issuedDraft ? (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={issuedDraft.clientName}
                    onChange={(event) => setIssuedDraft((current) => (current ? { ...current, clientName: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderClientName")}
                  />
                  <select
                    value={issuedDraft.type}
                    onChange={(event) => setIssuedDraft((current) => (current ? { ...current, type: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  >
                    {(["INVOICE", "RECEIPT", "INVOICE_RECEIPT", "CREDIT_NOTE"] as const).map((value) => (
                      <option key={value} value={value}>
                        {issuedTypeLabel(t, value)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={issuedDraft.date}
                    onChange={(event) => setIssuedDraft((current) => (current ? { ...current, date: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  />
                  <input
                    type="date"
                    value={issuedDraft.dueDate}
                    onChange={(event) => setIssuedDraft((current) => (current ? { ...current, dueDate: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  />
                  <select
                    value={issuedDraft.status}
                    onChange={(event) => setIssuedDraft((current) => (current ? { ...current, status: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  >
                    <option value="PENDING">{statusLabel(t, "issued", "PENDING")}</option>
                    <option value="PAID">{statusLabel(t, "issued", "PAID")}</option>
                    <option value="CANCELLED">{statusLabel(t, "issued", "CANCELLED")}</option>
                  </select>
                  <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                    {issuedTypeLabel(t, issuedDraft.type)} #{issuedDraft.number}
                    <p className="mt-2 text-xs font-bold text-[color:var(--v2-muted)]">
                      {t("workspaceDocuments.currentTotal")} {formatCurrencyILS(issuedDraft.total)}
                    </p>
                  </div>
                </div>

                <textarea
                  value={issuedDraft.itemsText}
                  onChange={(event) => setIssuedDraft((current) => (current ? { ...current, itemsText: event.target.value } : current))}
                  className="min-h-[180px] rounded-3xl border border-[color:var(--v2-line)] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--v2-ink)] outline-none"
                  placeholder={t("workspaceDocuments.itemsFormatPlaceholder")}
                />
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setScannedDraft(null);
                  setIssuedDraft(null);
                }}
                className="v2-button v2-button-secondary"
              >
                {t("workspaceDocuments.close")}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (scannedDraft) {
                    void saveScannedDraft();
                  } else if (issuedDraft) {
                    void saveIssuedDraft();
                  }
                }}
                className="v2-button v2-button-primary disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PencilLine className="h-4 w-4" aria-hidden />}
                {t("workspaceDocuments.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
