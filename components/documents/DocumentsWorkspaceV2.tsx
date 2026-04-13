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

const scannedStatusMeta: Record<string, { label: string; className: string }> = {
  PROCESSED: { label: "עובד", className: "bg-emerald-100 text-emerald-700" },
  REVIEW: { label: "לבדיקה", className: "bg-amber-100 text-amber-700" },
  FAILED: { label: "נכשל", className: "bg-rose-100 text-rose-700" },
};

const issuedStatusMeta: Record<string, { label: string; className: string }> = {
  PENDING: { label: "ממתין לתשלום", className: "bg-amber-100 text-amber-700" },
  PAID: { label: "שולם", className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "בוטל", className: "bg-slate-200 text-slate-600" },
};

const issuedTypeLabels: Record<string, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס / קבלה",
  CREDIT_NOTE: "זיכוי",
};

function statusBadge(status: string, kind: "scanned" | "issued") {
  const map = kind === "scanned" ? scannedStatusMeta : issuedStatusMeta;
  return map[status] ?? { label: status, className: "bg-slate-100 text-slate-700" };
}

function serializeIssuedItems(items: IssuedItemRecord[]) {
  return items
    .map((item) => `${item.desc ?? ""} | ${item.qty ?? 1} | ${item.price ?? 0}`)
    .join("\n");
}

function parseIssuedItems(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { items: null, error: "יש להזין לפחות שורת פריט אחת." };
  }

  const items = [];
  for (const line of lines) {
    const [descRaw, qtyRaw, priceRaw] = line.split("|").map((part) => part?.trim() ?? "");
    const qty = Number.parseFloat(qtyRaw || "1");
    const price = Number.parseFloat(priceRaw || "0");
    if (!descRaw) {
      return { items: null, error: "כל שורה חייבת להתחיל בתיאור פריט." };
    }
    if (!Number.isFinite(qty) || !Number.isFinite(price)) {
      return { items: null, error: "כמות ומחיר חייבים להיות מספרים חוקיים." };
    }
    items.push({ desc: descRaw, qty, price });
  }

  return { items, error: null };
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
  const badge = statusBadge(document.status, "scanned");

  return (
    <article className="v2-panel overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-[color:var(--v2-ink)]">{document.vendor}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[color:var(--v2-muted)]">{document.fileName}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${badge.className}`}>{badge.label}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">סכום מזוהה</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">
            {document.total > 0 ? formatCurrencyILS(document.total) : "לא זוהה סכום"}
          </p>
        </div>
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">שורות שזוהו</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{document.lineItemCount}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--v2-line)] bg-white/76 px-4 py-3">
        <p className="text-xs font-bold text-[color:var(--v2-muted)]">פענוח</p>
        <p className="mt-2 text-sm font-semibold text-[color:var(--v2-ink)]">
          {document.extractedType} · נסרק ב-{formatShortDate(document.createdAt)}
        </p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{document.summary}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => onOpen(document)} className="v2-button v2-button-primary">
          צפייה ועריכה
          <Eye className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => onDelete(document)} className="v2-button v2-button-secondary">
          מחיקה
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
  const badge = statusBadge(document.status, "issued");

  return (
    <article className="v2-panel overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-[color:var(--v2-ink)]">{document.clientName}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[color:var(--v2-muted)]">
            {issuedTypeLabels[document.type] ?? document.type} #{document.number}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${badge.className}`}>{badge.label}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">סכום כולל</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{formatCurrencyILS(document.total)}</p>
        </div>
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">תאריך</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{formatShortDate(document.date)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--v2-line)] bg-white/76 px-4 py-3">
        <p className="text-xs font-bold text-[color:var(--v2-muted)]">שורות במסמך</p>
        <p className="mt-2 text-sm font-semibold text-[color:var(--v2-ink)]">{document.items.length} פריטים</p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">
          {document.dueDate ? `מועד יעד: ${formatShortDate(document.dueDate)}` : "ללא מועד יעד מוגדר."}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => onOpen(document)} className="v2-button v2-button-primary">
          צפייה ועריכה
          <PencilLine className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => onDelete(document)} className="v2-button v2-button-secondary">
          מחיקה
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
      const matchesSearch =
        normalizedSearch.length === 0 ||
        document.clientName.toLowerCase().includes(normalizedSearch) ||
        document.number.toString().includes(normalizedSearch) ||
        (issuedTypeLabels[document.type] ?? document.type).toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || document.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [issuedState, normalizedSearch, statusFilter]);

  const scannedReviewCount = filteredScanned.filter(
    (document) =>
      document.status !== "PROCESSED" ||
      document.total <= 0 ||
      document.vendor === "ספק לא זוהה" ||
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
        setActionMessage({ type: "error", text: payload.error ?? "שמירת המסמך נכשלה." });
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
      setActionMessage({ type: "success", text: "המסמך המעובד עודכן." });
    });
  }

  async function saveIssuedDraft() {
    if (!issuedDraft) return;
    const parsed = parseIssuedItems(issuedDraft.itemsText);
    if (!parsed.items) {
      setActionMessage({ type: "error", text: parsed.error ?? "מבנה הפריטים אינו תקין." });
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
        setActionMessage({ type: "error", text: payload.error ?? "שמירת המסמך שהונפק נכשלה." });
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
      setActionMessage({ type: "success", text: "המסמך שהונפק עודכן." });
    });
  }

  async function deleteScannedDocument(document: ScannedDocumentRecord) {
    const confirmed = window.confirm(`למחוק את המסמך "${document.fileName}"?`);
    if (!confirmed) return;

    const response = await fetch(`/api/erp/documents/${document.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setActionMessage({ type: "error", text: payload.error ?? "מחיקת המסמך נכשלה." });
      return;
    }

    setScannedState((current) => current.filter((item) => item.id !== document.id));
    if (scannedDraft?.id === document.id) {
      setScannedDraft(null);
    }
    setActionMessage({ type: "success", text: "המסמך נמחק." });
  }

  async function deleteIssuedDocument(document: IssuedDocumentRecord) {
    const confirmed = window.confirm(`למחוק את המסמך ${issuedTypeLabels[document.type] ?? document.type} #${document.number}?`);
    if (!confirmed) return;

    const response = await fetch(`/api/erp/issued-documents/${document.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setActionMessage({ type: "error", text: payload.error ?? "מחיקת המסמך שהונפק נכשלה." });
      return;
    }

    setIssuedState((current) => current.filter((item) => item.id !== document.id));
    if (issuedDraft?.id === document.id) {
      setIssuedDraft(null);
    }
    setActionMessage({ type: "success", text: "המסמך שהונפק נמחק." });
  }

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">Documents Workspace</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              {industryProfile.documentsLabel} בניהול מלא, כולל צפייה, עריכה ומחיקה.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              המסך הזה מתאים את עצמו ל-{industryProfile.industryLabel}, מציג את סוגי המסמכים והאישורים
              הרלוונטיים למקצוע, ונותן שליטה מלאה גם על מסמכים שנסרקו וגם על מסמכים שהונפקו.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/app/documents/issue" className="v2-button v2-button-primary">
                הפקה לפי תבניות מקצועיות
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/documents/erp" className="v2-button v2-button-secondary">
                פתיחת ERP מלא
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/documents/erp#erp-multi-scanner" className="v2-button v2-button-secondary">
                סריקה חדשה
                <ScanSearch className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "מסמכים שנסרקו", value: scannedState.length.toString(), icon: FileSearch },
              { label: "מסמכים שהונפקו", value: issuedState.length.toString(), icon: FolderArchive },
              { label: "דורשים בדיקה", value: scannedReviewCount.toString(), icon: AlertTriangle },
              { label: "סכום מסמכים שהונפקו", value: formatCurrencyILS(issuedTotal), icon: Tags },
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
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">חיפוש</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3">
                  <Filter className="h-4 w-4 text-[color:var(--v2-muted)]" aria-hidden />
                  <input
                    value={search}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      startFilterTransition(() => setSearch(nextValue));
                    }}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--v2-muted)]"
                    placeholder="חיפוש לפי לקוח, ספק, קובץ, סוג מסמך או מספר מסמך"
                  />
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--v2-accent)]" aria-hidden /> : null}
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">סטטוס</span>
                <select
                  value={statusFilter}
                  onChange={(event) => startFilterTransition(() => setStatusFilter(event.target.value))}
                  className="rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                >
                  <option value="ALL">כל הסטטוסים</option>
                  <option value="PROCESSED">עובד</option>
                  <option value="REVIEW">לבדיקה</option>
                  <option value="FAILED">נכשל</option>
                  <option value="PENDING">ממתין לתשלום</option>
                  <option value="PAID">שולם</option>
                  <option value="CANCELLED">בוטל</option>
                </select>
              </label>

              <div className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">תצוגה</span>
                <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--v2-canvas)] p-1">
                  <button
                    type="button"
                    onClick={() => startTransition(() => setActiveTab("scanned"))}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      activeTab === "scanned" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                    נסרקו
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(() => setActiveTab("issued"))}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      activeTab === "issued" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                    }`}
                  >
                    <ListFilter className="h-4 w-4" aria-hidden />
                    הונפקו
                  </button>
                </div>
              </div>
            </div>
          </div>

          {activeTab === "scanned" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredScanned.length === 0 ? (
                <div className="v2-panel col-span-full p-8 text-center">
                  <p className="text-2xl font-black text-[color:var(--v2-ink)]">אין מסמכים שנסרקו שמתאימים לסינון הנוכחי.</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">
                    אפשר לשנות את החיפוש או לפתוח סריקה חדשה כדי להעלות מסמך נוסף.
                  </p>
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
                  <p className="text-2xl font-black text-[color:var(--v2-ink)]">אין מסמכים שהונפקו שמתאימים לסינון הנוכחי.</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">
                    אפשר לעבור למסך ההפקה וליצור מסמך חדש לפי המסלול והמקצוע שנבחרו.
                  </p>
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
            <p className="text-lg font-black text-[color:var(--v2-ink)]">מסמכים ואישורים לפי מקצוע</p>
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
            <p className="text-lg font-black text-[color:var(--v2-ink)]">ספקים שזוהו</p>
            <div className="mt-4 grid gap-3">
              {vendors.length === 0 ? (
                <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                  עדיין לא זוהו ספקים במסמכים שנסרקו.
                </div>
              ) : null}
              {vendors.map((vendor) => (
                <div key={vendor} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                  {vendor}
                </div>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <p className="text-lg font-black text-[color:var(--v2-ink)]">תמונת מצב</p>
            <div className="mt-4 grid gap-3">
              {[
                `מסמכים שנסרקו וממתינים לבדיקה: ${scannedReviewCount}`,
                `מסמכים שהונפקו וממתינים לתשלום: ${issuedPendingCount}`,
                `סך מסמכים שהונפקו בתצוגה: ${filteredIssued.length}`,
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {(scannedDraft || issuedDraft) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
          <div className="v2-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="v2-eyebrow">Document Control</p>
                <h2 className="mt-3 text-2xl font-black text-[color:var(--v2-ink)]">
                  {scannedDraft ? "צפייה ועריכה של מסמך שנסרק" : "צפייה ועריכה של מסמך שהונפק"}
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
                aria-label="סגור חלון"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {scannedDraft ? (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={scannedDraft.fileName}
                    onChange={(event) => setScannedDraft((current) => current ? { ...current, fileName: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder="שם קובץ"
                  />
                  <input
                    value={scannedDraft.vendor}
                    onChange={(event) => setScannedDraft((current) => current ? { ...current, vendor: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder="ספק / מקור"
                  />
                  <input
                    value={scannedDraft.extractedType}
                    onChange={(event) => setScannedDraft((current) => current ? { ...current, extractedType: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder="סוג מסמך מפוענח"
                  />
                  <select
                    value={scannedDraft.status}
                    onChange={(event) => setScannedDraft((current) => current ? { ...current, status: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  >
                    <option value="PROCESSED">עובד</option>
                    <option value="REVIEW">לבדיקה</option>
                    <option value="FAILED">נכשל</option>
                  </select>
                  <input
                    value={scannedDraft.type}
                    onChange={(event) => setScannedDraft((current) => current ? { ...current, type: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder="סוג מערכת"
                  />
                  <input
                    value={scannedDraft.total}
                    onChange={(event) => setScannedDraft((current) => current ? { ...current, total: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    dir="ltr"
                    placeholder="סכום"
                  />
                </div>

                <textarea
                  value={scannedDraft.summary}
                  onChange={(event) => setScannedDraft((current) => current ? { ...current, summary: event.target.value } : current)}
                  className="min-h-[140px] rounded-3xl border border-[color:var(--v2-line)] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--v2-ink)] outline-none"
                  placeholder="תקציר המסמך"
                />
              </div>
            ) : null}

            {issuedDraft ? (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={issuedDraft.clientName}
                    onChange={(event) => setIssuedDraft((current) => current ? { ...current, clientName: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                    placeholder="שם לקוח"
                  />
                  <select
                    value={issuedDraft.type}
                    onChange={(event) => setIssuedDraft((current) => current ? { ...current, type: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  >
                    {Object.entries(issuedTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={issuedDraft.date}
                    onChange={(event) => setIssuedDraft((current) => current ? { ...current, date: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  />
                  <input
                    type="date"
                    value={issuedDraft.dueDate}
                    onChange={(event) => setIssuedDraft((current) => current ? { ...current, dueDate: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  />
                  <select
                    value={issuedDraft.status}
                    onChange={(event) => setIssuedDraft((current) => current ? { ...current, status: event.target.value } : current)}
                    className="rounded-2xl border border-[color:var(--v2-line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                  >
                    <option value="PENDING">ממתין לתשלום</option>
                    <option value="PAID">שולם</option>
                    <option value="CANCELLED">בוטל</option>
                  </select>
                  <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm font-semibold text-[color:var(--v2-ink)]">
                    {issuedTypeLabels[issuedDraft.type] ?? issuedDraft.type} #{issuedDraft.number}
                    <p className="mt-2 text-xs font-bold text-[color:var(--v2-muted)]">
                      סכום נוכחי: {formatCurrencyILS(issuedDraft.total)}
                    </p>
                  </div>
                </div>

                <textarea
                  value={issuedDraft.itemsText}
                  onChange={(event) => setIssuedDraft((current) => current ? { ...current, itemsText: event.target.value } : current)}
                  className="min-h-[180px] rounded-3xl border border-[color:var(--v2-line)] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--v2-ink)] outline-none"
                  placeholder={"כל שורה בפורמט: תיאור | כמות | מחיר"}
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
                סגור
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
                שמור שינויים
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
