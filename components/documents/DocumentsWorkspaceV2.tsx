"use client";

import { startTransition, useCallback, useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  Link2,
  Loader2,
  PencilLine,
  Rows3,
  ScanLine,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import PortalToBody, { WORKSPACE_OVERLAY_Z_CLASS } from "@/components/portal/PortalToBody";
import DocumentGeneratorsStrip from "@/components/documents/DocumentGeneratorsStrip";
import AiDocDraftPanel from "@/components/documents/AiDocDraftPanel";
import AiHubScrollToHash from "@/components/documents/AiHubScrollToHash";
import AiHubUnifiedPreview from "@/components/documents/AiHubUnifiedPreview";
import ScanHubDecodePanel from "@/components/documents/ScanHubDecodePanel";
import { AiHubPreviewProvider, useAiHubPreview, type AiHubTab } from "@/components/documents/AiHubPreviewContext";
import ErpMultiEngineScannerLazy from "@/components/erp/ErpMultiEngineScannerLazy";
import ErpProjectNotebook from "@/components/erp/ErpProjectNotebook";
import type { ScanHubPreviewPayload } from "@/components/MultiEngineScanner";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/claude";
import { EmptyState } from "@/components/ui/empty-state";
import { DOC_UI_FALLBACK } from "@/lib/documents-ui-constants";
import type { IndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import type { TFunction } from "@/lib/i18n/translate";
import { useWorkspaceContext } from "@/components/workspace/WorkspaceContext";

type ContactOption = { id: string; name: string };

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
  linkedContactId?: string | null;
  linkedContactName?: string | null;
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
  contacts?: ContactOption[];
  geminiConfigured: boolean;
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

function DocumentsWorkspaceV2Inner({
  industryProfile,
  scannedDocuments,
  issuedDocuments,
  contacts = [],
  geminiConfigured,
}: Props) {
  const { t, dir } = useI18n();
  const {
    hubTab,
    setHubTab,
    setScanPreview,
    setNotebookLastReply,
    setNotebookSourceNames,
    libraryPeek,
    setLibraryPeek,
    setPreviewPanelTab,
  } = useAiHubPreview();
  const { setActiveClient } = useWorkspaceContext();
  const [libraryInsightsOpen, setLibraryInsightsOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [decodeModalOpen, setDecodeModalOpen] = useState(false);
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
  const [linkingDoc, setLinkingDoc] = useState<ScannedDocumentRecord | null>(null);
  const [contactSearch, setContactSearch] = useState("");

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
  const vendors = Array.from(new Set(filteredScanned.map((document) => document.vendor))).slice(0, 5);

  const onScanHubPreviewUpdate = useCallback(
    (snapshot: ScanHubPreviewPayload) => {
      setScanPreview(snapshot);
    },
    [setScanPreview],
  );

  const onHubPreviewFocusRequest = useCallback(() => {
    setPreviewPanelTab("scan");
    setPreviewModalOpen(true);
  }, [setPreviewPanelTab]);

  function setScannedLibraryPeek(document: ScannedDocumentRecord) {
    setLibraryPeek({
      kind: "scanned",
      id: document.id,
      fileName: document.fileName,
      vendor: document.vendor,
      summary: document.summary,
      total: document.total,
      lineItemCount: document.lineItemCount,
      extractedType: document.extractedType,
      status: document.status,
      createdAt: document.createdAt,
    });
    setPreviewPanelTab("library");
  }

  function peekScannedDocument(document: ScannedDocumentRecord) {
    setScannedLibraryPeek(document);
    setPreviewModalOpen(true);
  }

  function setIssuedLibraryPeek(document: IssuedDocumentRecord) {
    setLibraryPeek({
      kind: "issued",
      id: document.id,
      clientName: document.clientName,
      type: document.type,
      number: document.number,
      total: document.total,
      status: document.status,
      date: document.date,
    });
    setPreviewPanelTab("library");
  }

  function peekIssuedDocument(document: IssuedDocumentRecord) {
    setIssuedLibraryPeek(document);
    setPreviewModalOpen(true);
  }

  function openScanned(document: ScannedDocumentRecord) {
    setActionMessage(null);
    setIssuedDraft(null);
    setScannedLibraryPeek(document);
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
    setIssuedLibraryPeek(document);
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

  function appendIssuedFromGenerator(payload: IssuedDocumentRecord) {
    setIssuedState((current) => [payload, ...current]);
    setActionMessage({ type: "success", text: t("workspaceDocuments.generatorsSuccessDraft") });
  }

  function expandLibrarySelection() {
    if (!libraryPeek) return;
    setPreviewModalOpen(false);
    if (libraryPeek.kind === "scanned") {
      const doc = scannedState.find((d) => d.id === libraryPeek.id);
      if (doc) openScanned(doc);
    } else {
      const doc = issuedState.find((d) => d.id === libraryPeek.id);
      if (doc) openIssued(doc);
    }
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
    if (libraryPeek?.kind === "scanned" && libraryPeek.id === document.id) {
      setLibraryPeek(null);
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
    if (libraryPeek?.kind === "issued" && libraryPeek.id === document.id) {
      setLibraryPeek(null);
    }
    setActionMessage({ type: "success", text: t("workspaceDocuments.success.deletedIssued") });
  }

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return q ? contacts.filter((c) => c.name.toLowerCase().includes(q)) : contacts;
  }, [contacts, contactSearch]);

  async function linkDocumentToClient(contact: ContactOption) {
    if (!linkingDoc) return;
    const response = await fetch(`/api/erp/documents/${linkingDoc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aiData: { contactId: contact.id, contactName: contact.name },
      }),
    });
    if (response.ok) {
      setScannedState((current) =>
        current.map((item) =>
          item.id === linkingDoc.id
            ? { ...item, linkedContactId: contact.id, linkedContactName: contact.name }
            : item,
        ),
      );
      setActiveClient(contact.id, contact.name);
      setActionMessage({ type: "success", text: t("workspaceDocuments.linkToClientSuccess", { name: contact.name }) });
    } else {
      setActionMessage({ type: "error", text: t("workspaceDocuments.linkToClientError") });
    }
    setLinkingDoc(null);
    setContactSearch("");
  }

  const hubTabs: { id: AiHubTab; icon: LucideIcon; label: string }[] = [
    { id: "scan", icon: ScanLine, label: t("workspaceAiHub.tabScan") },
    { id: "notebook", icon: BookOpen, label: t("workspaceAiHub.tabNotebook") },
    { id: "generate", icon: Sparkles, label: t("workspaceAiHub.tabGenerate") },
  ];
  const decodeDocTotalCount = scannedState.length + issuedState.length;

  return (
    <div className="cd-canvas flex w-full min-w-0 flex-col space-y-4" dir={dir}>
      <AiHubScrollToHash />

      <PageHeader
        title={t("workspaceAiHub.heroTitle")}
        actions={
          <>
            <Link
              href="/app/erp"
              className="cd-btn cd-btn-primary"
              title={t("workspaceDocuments.ctaIssue")}
              aria-label={t("workspaceDocuments.ctaIssue")}
            >
              <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            </Link>
            <Link
              href="/app/erp"
              className="cd-btn cd-btn-secondary"
              title={t("workspaceDocuments.ctaErp")}
              aria-label={t("workspaceDocuments.ctaErp")}
            >
              <ArrowLeft className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
            </Link>
          </>
        }
      />

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="tablist"
            aria-label={t("workspaceAiHub.hubMainTabsAria")}
            className="flex flex-wrap gap-1 rounded-2xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-sunken)] p-1"
          >
            {hubTabs.map((tab) => {
              const selected = hubTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  title={tab.label}
                  aria-label={tab.label}
                  aria-selected={selected}
                  onClick={() => startTransition(() => setHubTab(tab.id))}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition ${
                    selected
                      ? "bg-[color:var(--cd-bg-raised)] text-[color:var(--cd-ink)] shadow-sm"
                      : "text-[color:var(--cd-ink-mute)] hover:text-[color:var(--cd-ink)]"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDecodeModalOpen(true)}
              title={t("workspaceAiHub.decodeModalTitle")}
              aria-label={t("workspaceAiHub.toolbarDecodeAria")}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)] text-[color:var(--cd-ink)] shadow-sm hover:bg-[color:var(--cd-bg-sunken)]"
            >
              <Rows3 className="h-5 w-5" strokeWidth={2} aria-hidden />
              {decodeDocTotalCount > 0 ? (
                <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--axis-clients)] px-1 text-[10px] font-black text-white tabular-nums">
                  {decodeDocTotalCount > 99 ? "99+" : decodeDocTotalCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              title={t("workspaceAiHub.previewModalTitle")}
              aria-label={t("workspaceAiHub.toolbarPreviewAria")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)] text-[color:var(--cd-ink)] shadow-sm hover:bg-[color:var(--cd-bg-sunken)]"
            >
              <Eye className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

          {hubTab === "scan" ? (
            <section className="scroll-mt-24 space-y-2" aria-labelledby="ai-hub-scan-heading">
              <SectionHeader id="ai-hub-scan-heading" title={t("workspaceAiHub.sectionScanTitle")} />
              <div className="w-full min-w-0 rounded-2xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)]">
                <ErpMultiEngineScannerLazy
                  industry={industryProfile.id}
                  compactHeader
                  hubPreviewMode
                  onScanHubPreviewUpdate={onScanHubPreviewUpdate}
                  onHubPreviewFocusRequest={onHubPreviewFocusRequest}
                />
              </div>
            </section>
          ) : null}

          {hubTab === "notebook" ? (
            <section id="ai-hub-notebook" className="scroll-mt-24 space-y-2" aria-labelledby="ai-hub-notebook-heading">
              <SectionHeader id="ai-hub-notebook-heading" title={t("workspaceAiHub.sectionNotebookTitle")} />
              <ErpProjectNotebook
                geminiConfigured={geminiConfigured}
                embedInHub
                embedCompact
                onAssistantReply={setNotebookLastReply}
                onSourcesChange={setNotebookSourceNames}
              />
            </section>
          ) : null}


          {hubTab === "generate" ? (
            <section className="space-y-4" aria-labelledby="ai-hub-generators-heading">
              <DocumentGeneratorsStrip
                industryProfile={industryProfile}
                onDraftIssued={appendIssuedFromGenerator}
                variant="aiHub"
              />
              <AiDocDraftPanel />
            </section>
          ) : null}
      </div>

      {previewModalOpen ? (
        <PortalToBody>
          <div className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-center justify-center bg-slate-950/40 px-3 py-6`}>
            <button
              type="button"
              className="absolute inset-0"
              aria-label={t("workspaceAiHub.mobilePreviewClose")}
              onClick={() => setPreviewModalOpen(false)}
            />
            <div
              className="relative z-10 flex h-[min(88vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)] shadow-2xl"
              dir={dir}
            >
              <AiHubUnifiedPreview
                variant="mobile"
                className="min-h-0 flex-1 border-0 shadow-none"
                onClose={() => setPreviewModalOpen(false)}
                onExpandLibrary={expandLibrarySelection}
              />
            </div>
          </div>
        </PortalToBody>
      ) : null}

      {decodeModalOpen ? (
        <PortalToBody>
          <div className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-center justify-center bg-slate-950/40 px-3 py-6`}>
            <button
              type="button"
              className="absolute inset-0"
              aria-label={t("workspaceDocuments.closeAria")}
              onClick={() => setDecodeModalOpen(false)}
            />
            <div
              className="relative z-10 flex max-h-[min(88vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] shadow-2xl"
              dir={dir}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--line)] px-4 py-3">
                <p className="text-sm font-black text-[color:var(--ink-900)]">{t("workspaceAiHub.decodeModalTitle")}</p>
                <button
                  type="button"
                  onClick={() => setDecodeModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--line)] bg-white"
                  aria-label={t("workspaceDocuments.closeAria")}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <ScanHubDecodePanel
                  t={t}
                  industryProfile={industryProfile}
                  search={search}
                  setSearch={setSearch}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  isPending={isPending}
                  startFilterTransition={startFilterTransition}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  startTransition={startTransition}
                  filteredScanned={filteredScanned}
                  filteredIssued={filteredIssued}
                  contacts={contacts}
                  actionMessage={actionMessage}
                  vendors={vendors}
                  libraryInsightsOpen={libraryInsightsOpen}
                  setLibraryInsightsOpen={setLibraryInsightsOpen}
                  scannedReviewCount={scannedReviewCount}
                  issuedPendingCount={issuedPendingCount}
                  translateFallback={translateFallback}
                  issuedTypeLabel={issuedTypeLabel}
                  statusLabel={statusLabel}
                  badgeClass={badgeClass}
                  peekScannedDocument={(document) => {
                    peekScannedDocument(document);
                    setDecodeModalOpen(false);
                  }}
                  peekIssuedDocument={(document) => {
                    peekIssuedDocument(document);
                    setDecodeModalOpen(false);
                  }}
                  openScanned={(document) => {
                    openScanned(document);
                    setDecodeModalOpen(false);
                  }}
                  openIssued={(document) => {
                    openIssued(document);
                    setDecodeModalOpen(false);
                  }}
                  deleteScannedDocument={deleteScannedDocument}
                  deleteIssuedDocument={deleteIssuedDocument}
                  setLinkingDoc={setLinkingDoc}
                />
              </div>
            </div>
          </div>
        </PortalToBody>
      ) : null}

      {scannedDraft || issuedDraft ? (
        <PortalToBody>
        <div className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-center justify-center bg-slate-950/35 px-4 py-6`}>
          <div className="tile max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-7" dir={dir}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bento-eyebrow">{t("workspaceDocuments.modalEyebrow")}</p>
                <h2 className="mt-3 text-2xl font-black text-[color:var(--ink-900)]">
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-white/90 text-[color:var(--ink-900)]"
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
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderFileName")}
                  />
                  <input
                    value={scannedDraft.vendor}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, vendor: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderVendor")}
                  />
                  <input
                    value={scannedDraft.extractedType}
                    onChange={(event) =>
                      setScannedDraft((current) => (current ? { ...current, extractedType: event.target.value } : current))
                    }
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderExtractedType")}
                  />
                  <select
                    value={scannedDraft.status}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, status: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                  >
                    <option value="PROCESSED">{statusLabel(t, "scanned", "PROCESSED")}</option>
                    <option value="REVIEW">{statusLabel(t, "scanned", "REVIEW")}</option>
                    <option value="FAILED">{statusLabel(t, "scanned", "FAILED")}</option>
                  </select>
                  <input
                    value={scannedDraft.type}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, type: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderSystemType")}
                  />
                  <input
                    value={scannedDraft.total}
                    onChange={(event) => setScannedDraft((current) => (current ? { ...current, total: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                    dir="ltr"
                    placeholder={t("workspaceDocuments.placeholderAmount")}
                  />
                </div>

                <textarea
                  value={scannedDraft.summary}
                  onChange={(event) => setScannedDraft((current) => (current ? { ...current, summary: event.target.value } : current))}
                  className="min-h-[140px] rounded-3xl border border-[color:var(--line)] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--ink-900)] outline-none"
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
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                    placeholder={t("workspaceDocuments.placeholderClientName")}
                  />
                  <select
                    value={issuedDraft.type}
                    onChange={(event) => setIssuedDraft((current) => (current ? { ...current, type: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
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
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                  />
                  <input
                    type="date"
                    value={issuedDraft.dueDate}
                    onChange={(event) => setIssuedDraft((current) => (current ? { ...current, dueDate: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                  />
                  <select
                    value={issuedDraft.status}
                    onChange={(event) => setIssuedDraft((current) => (current ? { ...current, status: event.target.value } : current))}
                    className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                  >
                    <option value="PENDING">{statusLabel(t, "issued", "PENDING")}</option>
                    <option value="PAID">{statusLabel(t, "issued", "PAID")}</option>
                    <option value="CANCELLED">{statusLabel(t, "issued", "CANCELLED")}</option>
                  </select>
                  <div className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4 text-sm font-semibold text-[color:var(--ink-900)]">
                    {issuedTypeLabel(t, issuedDraft.type)} #{issuedDraft.number}
                    <p className="mt-2 text-xs font-bold text-[color:var(--ink-500)]">
                      {t("workspaceDocuments.currentTotal")} {formatCurrencyILS(issuedDraft.total)}
                    </p>
                  </div>
                </div>

                <textarea
                  value={issuedDraft.itemsText}
                  onChange={(event) => setIssuedDraft((current) => (current ? { ...current, itemsText: event.target.value } : current))}
                  className="min-h-[180px] rounded-3xl border border-[color:var(--line)] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--ink-900)] outline-none"
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
                className="bento-btn bento-btn--secondary"
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
                className="bento-btn bento-btn--primary"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PencilLine className="h-4 w-4" aria-hidden />}
                {t("workspaceDocuments.saveChanges")}
              </button>
            </div>
          </div>
        </div>
        </PortalToBody>
      ) : null}

      {linkingDoc ? (
        <PortalToBody>
          <div className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-end justify-center bg-slate-950/35 px-4 pb-6 pt-20 sm:items-center`}>
            <div className="tile w-full max-w-sm p-5" dir={dir}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-500)]">שיוך מסמך ללקוח</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[color:var(--ink-900)]">{linkingDoc.vendor}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setLinkingDoc(null); setContactSearch(""); }}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[color:var(--line)] bg-white/90"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-400)]" aria-hidden />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="חפש לקוח…"
                  className="w-full rounded-xl border border-[color:var(--line)] bg-white py-2 pe-3 ps-9 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                />
              </div>

              <ul className="mt-2 max-h-52 divide-y divide-[color:var(--line)] overflow-y-auto rounded-xl border border-[color:var(--line)]">
                {filteredContacts.length === 0 ? (
                  <li className="px-4 py-4 text-center text-sm leading-relaxed text-[color:var(--ink-500)]">
                    לא מצאנו לקוחות לפי החיפוש. נסו מילה אחרת או סגרו והוסיפו לקוח ב-CRM תחילה.
                  </li>
                ) : (
                  filteredContacts.slice(0, 40).map((contact) => (
                    <li key={contact.id}>
                      <button
                        type="button"
                        onClick={() => linkDocumentToClient(contact)}
                        className="w-full px-4 py-3 text-start text-sm font-semibold text-[color:var(--ink-900)] hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        {contact.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </PortalToBody>
      ) : null}
    </div>
  );
}

export default function DocumentsWorkspaceV2(props: Props) {
  return (
    <AiHubPreviewProvider>
      <DocumentsWorkspaceV2Inner {...props} />
    </AiHubPreviewProvider>
  );
}
