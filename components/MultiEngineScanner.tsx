"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Boxes,
  Brain,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  DatabaseZap,
  Download,
  Eye,
  FileJson,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  Network,
  PanelTopOpen,
  Play,
  Printer,
  ReceiptText,
  RotateCcw,
  ScanSearch,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TableProperties,
  UploadCloud,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { saveScannedDocumentAction } from "@/app/actions/save-scanned-document";
import { dispatchScanComplete } from "@/components/app-shell/ScanResultCardPortal";
import { useI18n } from "@/components/I18nProvider";
import { getMergedIndustryConfig } from "@/lib/construction-trades";
import { DROPZONE_ACCEPT, MAX_SCAN_FILE_BYTES } from "@/lib/scan-mime";
import type { IndustryType } from "@/lib/professions/config";
import type { ScanExtractionV5, ScanModeV5 } from "@/lib/scan-schema-v5";
import type {
  EngineMetaResponse,
  EngineRunMode,
  ScanHubPreviewPayload,
  ScanLookupContact,
  ScanLookupProject,
  ScannerProps,
  TriTelemetry,
} from "./multi-engine-scanner/types";
import {
  DOC_AI_MODE_MATRIX,
  FALLBACK_OPENAI_MODEL_OPTIONS,
  IDLE_TELEMETRY,
  RUN_MODES,
  RUNNING_TELEMETRY,
  SCAN_MODES,
  STREAM_STAGE_LABELS,
} from "./multi-engine-scanner/constants";
import {
  engineProgress,
  fileSizeLabel,
  isImageFile,
  isPdfFile,
  phaseIcon,
  phaseLabel,
  progressTone,
  readV5FromAiData,
  truncateText,
} from "./multi-engine-scanner/utils";
import {
  Capability,
  CardShell,
  DashboardAction,
  EngineOptionRow,
  IconMetric,
  MetaLine,
  Metric,
  MiniPill,
  ProcessorBadge,
  ResultRows,
  SectionTitle,
  StatTile,
} from "./multi-engine-scanner/ui-blocks";
import { DockWizardScanLayout } from "./multi-engine-scanner/DockWizardScanLayout";

export type { ScanHubPreviewPayload } from "./multi-engine-scanner/types";

type ResultExportFormat = "json" | "html" | "txt" | "xls" | "erp-csv" | "boq-csv";
type ResultPrintScope = "full" | "summary" | "erp" | "boq";

type ResultExportContext = {
  sourceFileName: string;
  projectLabel: string;
  clientLabel: string;
  scanModeLabel: string;
  runModeLabel: string;
  generatedAt: string;
};

const EMPTY_VALUE = "-";

function textValue(value: unknown, fallback = EMPTY_VALUE): string {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value.length ? value.map((item) => textValue(item, "")).filter(Boolean).join(", ") : fallback;
  const text = String(value).trim();
  return text || fallback;
}

function numberValue(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("he-IL").format(value) : EMPTY_VALUE;
}

function currencyValue(value: unknown, currency = "ILS"): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return EMPTY_VALUE;
  try {
    return new Intl.NumberFormat("he-IL", { style: "currency", currency }).format(value);
  } catch {
    return numberValue(value);
  }
}

function escapeHtml(value: unknown): string {
  return textValue(value, "").replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

function escapeCsv(value: unknown): string {
  const text = textValue(value, "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sanitizeFileBaseName(name: string): string {
  const cleaned = name
    .replace(/\.[^.]+$/, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return cleaned || "scan-result";
}

function rowsToCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function downloadTextFile(fileName: string, content: string, mimeType: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function buildResultContext(
  v5: ScanExtractionV5,
  sourceFileName: string,
  projectLabel: string,
  clientLabel: string,
  scanModeLabel: string,
  runModeLabel: string,
): ResultExportContext {
  return {
    sourceFileName: sourceFileName || v5.documentMetadata.sourceFileName || "scan-result",
    projectLabel: v5.documentMetadata.project || projectLabel || EMPTY_VALUE,
    clientLabel: v5.documentMetadata.client || clientLabel || EMPTY_VALUE,
    scanModeLabel,
    runModeLabel,
    generatedAt: new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
  };
}

function buildLineItemsCsv(v5: ScanExtractionV5): string {
  return rowsToCsv(
    ["תיאור", "מק״ט", "כמות", "מחיר יחידה", "סה״כ שורה", "מע״מ", "מטבע"],
    v5.lineItems.map((row) => [
      row.description,
      row.sku,
      row.quantity,
      row.unitPrice,
      row.lineTotal,
      row.vatAmount,
      row.currency,
    ]),
  );
}

function buildBoqCsv(v5: ScanExtractionV5): string {
  return rowsToCsv(
    ["מספר סעיף", "תיאור", "חומר", "מידות", "נקודות MEP", "כמות", "יחידה", "הערות"],
    v5.billOfQuantities.map((row) => [
      row.itemRef,
      row.description,
      row.material,
      row.dimensions,
      row.mepPoints?.join(", "),
      row.quantity,
      row.unit,
      row.notes,
    ]),
  );
}

function buildResultTextReport(v5: ScanExtractionV5, context: ResultExportContext): string {
  const lines = [
    "BSD-YBM - דוח פענוח סריקה",
    `נוצר: ${context.generatedAt}`,
    `קובץ מקור: ${context.sourceFileName}`,
    `פרויקט: ${context.projectLabel}`,
    `לקוח: ${context.clientLabel}`,
    `סוג סריקה: ${context.scanModeLabel}`,
    `מצב מנועים: ${context.runModeLabel}`,
    `סוג מסמך: ${textValue(v5.docType)}`,
    `תאריך מסמך: ${textValue(v5.date)}`,
    `סה״כ: ${currencyValue(v5.total)}`,
    "",
    "סיכום",
    textValue(v5.summary, "אין סיכום."),
    "",
    "שורות ERP",
    ...v5.lineItems.map(
      (row, index) =>
        `${index + 1}. ${row.description} | כמות: ${numberValue(row.quantity)} | יחידה: ${currencyValue(row.unitPrice, row.currency ?? "ILS")} | שורה: ${currencyValue(row.lineTotal, row.currency ?? "ILS")}`,
    ),
    "",
    "BOQ",
    ...v5.billOfQuantities.map(
      (row, index) =>
        `${index + 1}. ${row.itemRef ?? ""} ${row.description} | חומר: ${textValue(row.material)} | כמות: ${numberValue(row.quantity)} ${textValue(row.unit, "")} | הערות: ${textValue(row.notes)}`,
    ),
  ];
  return lines.join("\n");
}

function metricHtml(label: string, value: unknown): string {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function buildLineItemsTable(v5: ScanExtractionV5): string {
  if (!v5.lineItems.length) return `<p class="empty">לא נמצאו שורות ERP.</p>`;
  const rows = v5.lineItems
    .map(
      (row, index) => `<tr>
        <td>${index + 1}</td>
        <td class="wide">${escapeHtml(row.description)}</td>
        <td>${escapeHtml(row.sku)}</td>
        <td>${escapeHtml(numberValue(row.quantity))}</td>
        <td>${escapeHtml(currencyValue(row.unitPrice, row.currency ?? "ILS"))}</td>
        <td>${escapeHtml(currencyValue(row.lineTotal, row.currency ?? "ILS"))}</td>
        <td>${escapeHtml(currencyValue(row.vatAmount, row.currency ?? "ILS"))}</td>
        <td>${escapeHtml(row.currency ?? "ILS")}</td>
      </tr>`,
    )
    .join("");
  return `<table>
    <thead><tr><th>#</th><th>תיאור</th><th>מק״ט</th><th>כמות</th><th>מחיר יחידה</th><th>סה״כ</th><th>מע״מ</th><th>מטבע</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function buildBoqTable(v5: ScanExtractionV5): string {
  if (!v5.billOfQuantities.length) return `<p class="empty">לא נמצאו שורות BOQ.</p>`;
  const rows = v5.billOfQuantities
    .map(
      (row, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.itemRef)}</td>
        <td class="wide">${escapeHtml(row.description)}</td>
        <td>${escapeHtml(row.material)}</td>
        <td>${escapeHtml(row.dimensions)}</td>
        <td>${escapeHtml(row.mepPoints?.join(", "))}</td>
        <td>${escapeHtml(numberValue(row.quantity))}</td>
        <td>${escapeHtml(row.unit)}</td>
        <td class="wide">${escapeHtml(row.notes)}</td>
      </tr>`,
    )
    .join("");
  return `<table>
    <thead><tr><th>#</th><th>סעיף</th><th>תיאור</th><th>חומר</th><th>מידות</th><th>MEP</th><th>כמות</th><th>יחידה</th><th>הערות</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function reportStyles(): string {
  return `<style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      direction: rtl;
      background: #f6f3ec;
      color: #111827;
      font-family: Arial, "Noto Sans Hebrew", "Segoe UI", sans-serif;
      line-height: 1.55;
    }
    .report {
      width: min(1120px, calc(100vw - 32px));
      margin: 24px auto;
      background: #fff;
      border: 1px solid #e7dece;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 24px 70px rgba(31, 41, 55, 0.14);
    }
    header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: start;
      padding: 28px 32px;
      background: linear-gradient(135deg, #101827, #162033 48%, #24124a);
      color: #fff;
    }
    .eyebrow { color: #8dfcf4; font-size: 12px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 6px 0 8px; font-size: 30px; line-height: 1.15; }
    .subtitle { margin: 0; color: #d7e3f1; font-weight: 700; }
    .brand {
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 18px;
      padding: 12px 16px;
      text-align: left;
      color: #8dfcf4;
      font-weight: 900;
      white-space: nowrap;
    }
    .section { padding: 24px 32px; border-top: 1px solid #eee7da; }
    h2 { margin: 0 0 14px; color: #f90f45; font-size: 20px; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      padding: 20px 32px;
      background: #fbfaf7;
      border-top: 1px solid #eee7da;
    }
    .metric {
      min-height: 76px;
      border: 1px solid #eadfce;
      border-radius: 16px;
      padding: 12px;
      background: #fff;
    }
    .metric span { display: block; color: #64748b; font-size: 12px; font-weight: 900; }
    .metric strong { display: block; margin-top: 5px; font-size: 15px; overflow-wrap: anywhere; }
    .summary {
      border: 1px solid #eadfce;
      border-radius: 18px;
      background: #fffaf1;
      padding: 16px 18px;
      font-weight: 700;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border: 1px solid #e5dccf;
      border-radius: 16px;
      background: #fff;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid #ece6dc;
      text-align: right;
      vertical-align: top;
      font-size: 12px;
    }
    th {
      background: #efe6d6;
      color: #26344f;
      font-size: 11px;
      font-weight: 900;
      white-space: nowrap;
    }
    tbody tr:nth-child(even) td { background: #fbfaf7; }
    tbody tr:last-child td { border-bottom: 0; }
    .wide { min-width: 180px; }
    .empty {
      border: 1px dashed #d8ccb8;
      border-radius: 16px;
      padding: 16px;
      margin: 0;
      color: #64748b;
      font-weight: 800;
      background: #fbfaf7;
    }
    .alert {
      margin-top: 14px;
      border: 1px solid #f6c453;
      background: #fff8db;
      color: #7c4a03;
      border-radius: 16px;
      padding: 12px 14px;
      font-weight: 900;
    }
    .footer {
      padding: 16px 32px 24px;
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
    }
    @media print {
      body { background: #fff; }
      .report { width: 100%; margin: 0; border: 0; border-radius: 0; box-shadow: none; }
      header { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      thead { display: table-header-group; }
      tr, .metric, .summary { break-inside: avoid; page-break-inside: avoid; }
      .section { break-inside: auto; }
    }
    @media (max-width: 820px) {
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 16px; }
      header, .section, .footer { padding-inline: 18px; }
      h1 { font-size: 24px; }
    }
  </style>`;
}

function buildResultHtmlReport(v5: ScanExtractionV5, context: ResultExportContext, scope: ResultPrintScope = "full"): string {
  const showSummary = scope === "full" || scope === "summary";
  const showErp = scope === "full" || scope === "erp";
  const showBoq = scope === "full" || scope === "boq";
  const scopeTitle =
    scope === "summary" ? "תקציר פענוח" : scope === "erp" ? "שורות ERP" : scope === "boq" ? "כתב כמויות BOQ" : "דוח פענוח מלא";

  return `<!doctype html>
  <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${escapeHtml(scopeTitle)} - ${escapeHtml(context.sourceFileName)}</title>
      ${reportStyles()}
    </head>
    <body>
      <main class="report">
        <header>
          <div>
            <div class="eyebrow">BSD-YBM Scan Result</div>
            <h1>${escapeHtml(scopeTitle)}</h1>
            <p class="subtitle">${escapeHtml(context.sourceFileName)} · ${escapeHtml(context.generatedAt)}</p>
          </div>
          <div class="brand">BSD-YBM</div>
        </header>
        <section class="metrics">
          ${metricHtml("פרויקט", context.projectLabel)}
          ${metricHtml("לקוח", context.clientLabel)}
          ${metricHtml("סוג מסמך", v5.docType)}
          ${metricHtml("תאריך", v5.date)}
          ${metricHtml("סה״כ", currencyValue(v5.total))}
          ${metricHtml("סוג סריקה", context.scanModeLabel)}
          ${metricHtml("מצב מנועים", context.runModeLabel)}
          ${metricHtml("מנועים", v5.enginesUsed?.join(" / "))}
        </section>
        ${
          showSummary
            ? `<section class="section">
                <h2>סיכום מנהלים</h2>
                <div class="summary">${escapeHtml(v5.summary || "אין סיכום זמין.")}</div>
                ${v5.priceAlertPending ? `<div class="alert">שים לב: קיימות שורות חסרות מחיר או נתוני מחיר חלקיים.</div>` : ""}
              </section>`
            : ""
        }
        ${showErp ? `<section class="section"><h2>שורות ERP</h2>${buildLineItemsTable(v5)}</section>` : ""}
        ${showBoq ? `<section class="section"><h2>כתב כמויות BOQ</h2>${buildBoqTable(v5)}</section>` : ""}
        <section class="footer">
          דוח זה נוצר אוטומטית מלוח הסריקה של BSD-YBM. יש לאמת נתונים כספיים, כמויות ומחירים לפני שימוש מחייב.
        </section>
      </main>
    </body>
  </html>`;
}

function buildExcelHtmlReport(v5: ScanExtractionV5, context: ResultExportContext): string {
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8" />${reportStyles()}</head><body>
    <main class="report">
      <header><div><div class="eyebrow">BSD-YBM Excel Export</div><h1>ייצוא תוצאות סריקה</h1><p class="subtitle">${escapeHtml(context.sourceFileName)}</p></div><div class="brand">BSD-YBM</div></header>
      <section class="metrics">
        ${metricHtml("פרויקט", context.projectLabel)}
        ${metricHtml("לקוח", context.clientLabel)}
        ${metricHtml("נוצר", context.generatedAt)}
        ${metricHtml("סה״כ", currencyValue(v5.total))}
      </section>
      <section class="section"><h2>שורות ERP</h2>${buildLineItemsTable(v5)}</section>
      <section class="section"><h2>כתב כמויות BOQ</h2>${buildBoqTable(v5)}</section>
    </main>
  </body></html>`;
}

function printResultHtml(html: string, fallbackFileName: string): void {
  if (typeof window === "undefined") return;
  const printWindow = window.open("", "_blank", "width=1280,height=900");
  if (!printWindow) {
    downloadTextFile(fallbackFileName, html, "text/html");
    toast.message("הדפדפן חסם חלון הדפסה", { description: "הורדתי במקום זה דוח HTML מעוצב." });
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 450);
}

export default function MultiEngineScanner({
  industry: industryOverride,
  compactHeader = false,
  dockWizard = false,
  onScanHubPreviewUpdate,
  hubPreviewMode = false,
  onHubPreviewFocusRequest,
}: ScannerProps) {
  const { messages, t, dir, locale } = useI18n();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const userIndustry = (industryOverride || session?.user?.organizationIndustry || "CONSTRUCTION") as IndustryType;
  const trade = session?.user?.organizationConstructionTrade ?? null;
  const config = getMergedIndustryConfig(userIndustry, trade, messages);
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  /** במצב dockWizard סמל קבוע וברור — לא תלוי בשם אייקון מתוך תצורת מקצוע שעלול להיות חסר ב־Lucide */
  const ActiveIcon = dockWizard ? ScanSearch : (iconMap[config.iconName] ?? Bot);

  const [files, setFiles] = useState<File[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const [scanMode, setScanMode] = useState<ScanModeV5>("DRAWING_BOQ");
  const [engineRunMode, setEngineRunMode] = useState<EngineRunMode>("MULTI_PARALLEL");
  const [projects, setProjects] = useState<ScanLookupProject[]>([]);
  const [contacts, setContacts] = useState<ScanLookupContact[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [engineInstruction, setEngineInstruction] = useState("");
  const [debouncedLookup, setDebouncedLookup] = useState("");
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [openAiModel, setOpenAiModel] = useState("");
  const [engineMeta, setEngineMeta] = useState<EngineMetaResponse | null>(null);
  const [engineMetaLoading, setEngineMetaLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [telemetry, setTelemetry] = useState<TriTelemetry>(IDLE_TELEMETRY);
  const [aiData, setAiData] = useState<Record<string, unknown> | null>(null);
  const [streamPartialV5, setStreamPartialV5] = useState<ScanExtractionV5 | null>(null);
  const [streamStage, setStreamStage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState<"ERP" | "CRM" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [dockWizardStep, setDockWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const activeFile = files[activeFileIndex] ?? null;
  const activePreviewUrl = previewUrls[activeFileIndex] ?? null;
  const selectedScanMode = SCAN_MODES.find((mode) => mode.id === scanMode) ?? SCAN_MODES[0];
  const selectedRunMode = RUN_MODES.find((mode) => mode.id === engineRunMode) ?? RUN_MODES[0];

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedLookup(lookupSearch), 300);
    return () => window.clearTimeout(id);
  }, [lookupSearch]);

  useEffect(() => {
    if (!scanning) {
      setElapsedSeconds(0);
      return;
    }
    const id = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [scanning]);

  useEffect(() => {
    const urls = files.map((file) => (isImageFile(file) || isPdfFile(file) ? URL.createObjectURL(file) : null));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  useEffect(() => {
    setActiveFileIndex((index) => (files.length === 0 ? 0 : Math.min(index, files.length - 1)));
  }, [files.length]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setLookupsLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedLookup.trim()) params.set("q", debouncedLookup.trim());
        if (selectedProjectId) params.set("contactProjectId", selectedProjectId);
        const query = params.toString();
        const res = await fetch(query ? `/api/org/scan-lookups?${query}` : "/api/org/scan-lookups");
        const data = (await res.json()) as {
          projects?: ScanLookupProject[];
          contacts?: ScanLookupContact[];
        };
        if (!cancelled && res.ok) {
          setProjects(Array.isArray(data.projects) ? data.projects : []);
          setContacts(Array.isArray(data.contacts) ? data.contacts : []);
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
          setContacts([]);
        }
      } finally {
        if (!cancelled) setLookupsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus, debouncedLookup, selectedProjectId]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setEngineMeta(null);
      setEngineMetaLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setEngineMetaLoading(true);
      try {
        const res = await fetch("/api/scan/engine-meta");
        const data = (await res.json()) as EngineMetaResponse;
        if (!cancelled && res.ok && data.configured && data.gemini && data.openai) {
          setEngineMeta(data);
        }
      } catch {
        if (!cancelled) setEngineMeta(null);
      } finally {
        if (!cancelled) setEngineMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  useEffect(() => {
    if (!engineMeta) return;
    setOpenAiModel((previous) => {
      const options = engineMeta.openai.modelOptions;
      if (previous && options.some((option) => option.id === previous)) return previous;
      if (options.some((option) => option.id === engineMeta.openai.defaultModelId)) {
        return engineMeta.openai.defaultModelId;
      }
      return options[0]?.id ?? engineMeta.openai.defaultModelId;
    });
  }, [engineMeta]);

  useEffect(() => {
    if (!selectedContactId) return;
    if (!contacts.some((contact) => contact.id === selectedContactId)) setSelectedContactId("");
  }, [contacts, selectedContactId]);

  const openAiModelOptions = useMemo(
    () => (engineMeta?.openai.modelOptions?.length ? engineMeta.openai.modelOptions : FALLBACK_OPENAI_MODEL_OPTIONS),
    [engineMeta],
  );

  const resolvedOpenAiModel = useMemo(() => {
    if (openAiModel && openAiModelOptions.some((option) => option.id === openAiModel)) return openAiModel;
    return engineMeta?.openai.defaultModelId ?? openAiModelOptions[0]?.id ?? "";
  }, [engineMeta, openAiModel, openAiModelOptions]);

  const visibleProjects = useMemo(() => {
    const query = lookupSearch.trim().toLowerCase();
    let rows = projects;
    if (query) rows = rows.filter((project) => project.name.toLowerCase().includes(query));
    if (selectedProjectId && !rows.some((project) => project.id === selectedProjectId)) {
      const selected = projects.find((project) => project.id === selectedProjectId);
      if (selected) rows = [selected, ...rows];
    }
    return rows;
  }, [lookupSearch, projects, selectedProjectId]);

  const projectLabel = useMemo(
    () => projects.find((project) => project.id === selectedProjectId)?.name ?? "",
    [projects, selectedProjectId],
  );

  const clientLabel = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId)?.name ?? "",
    [contacts, selectedContactId],
  );

  const v5 = useMemo(() => readV5FromAiData(aiData) ?? streamPartialV5, [aiData, streamPartialV5]);

  const wizardStepLabels = useMemo(
    () => [
      t("workspaceDock.scannerWizard.steps.files"),
      t("workspaceDock.scannerWizard.steps.engines"),
      t("workspaceDock.scannerWizard.steps.crm"),
      t("workspaceDock.scannerWizard.steps.run"),
      t("workspaceDock.scannerWizard.steps.results"),
    ],
    [t],
  );

  useEffect(() => {
    if (!dockWizard) return;
    if (scanning) setDockWizardStep(4);
  }, [dockWizard, scanning]);

  useEffect(() => {
    if (!dockWizard) return;
    if (!scanning && v5 && dockWizardStep === 4) setDockWizardStep(5);
  }, [dockWizard, scanning, v5, dockWizardStep]);

  const triggerFilePreview = useCallback(() => {
    if (hubPreviewMode && onHubPreviewFocusRequest) {
      onHubPreviewFocusRequest();
      return;
    }
    setPreviewOpen(true);
  }, [hubPreviewMode, onHubPreviewFocusRequest]);

  useEffect(() => {
    if (!onScanHubPreviewUpdate) return;
    const extraction = v5 ?? aiData;
    let previewKind: ScanHubPreviewPayload["previewKind"] = "none";
    if (activeFile) {
      if (isImageFile(activeFile)) previewKind = "image";
      else if (isPdfFile(activeFile)) previewKind = "pdf";
    }
    onScanHubPreviewUpdate({
      fileName: activeFile?.name ?? null,
      previewUrl: activePreviewUrl,
      previewKind,
      extraction,
      streamStage,
      scanError,
      scanning,
    });
  }, [
    onScanHubPreviewUpdate,
    v5,
    aiData,
    activeFile,
    activePreviewUrl,
    streamStage,
    scanError,
    scanning,
  ]);

  const totalProgress = useMemo(() => {
    const phases = [telemetry.documentAI.phase, telemetry.gemini.phase, telemetry.gpt.phase];
    const values = phases.map((phase, index) => engineProgress(phase, scanning, elapsedSeconds, index * 6));
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [elapsedSeconds, scanning, telemetry]);

  const docAiProcessors = useMemo(() => engineMeta?.documentAI?.processors ?? [], [engineMeta]);
  const docAiRecommendedKinds = useMemo(() => DOC_AI_MODE_MATRIX[scanMode], [scanMode]);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    setFiles((previous) => [...previous, ...accepted]);
    setAiData(null);
    setStreamPartialV5(null);
    setStreamStage(null);
    setScanError(null);
    setTelemetry(IDLE_TELEMETRY);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      const first = rejections[0];
      const reason =
        first?.errors[0]?.code === "file-too-large" ? "הקובץ גדול מדי. המגבלה היא 25MB." : "סוג הקובץ אינו נתמך.";
      toast.error(reason);
    },
    multiple: true,
    accept: DROPZONE_ACCEPT,
    maxSize: MAX_SCAN_FILE_BYTES,
  });

  const clearWorkspace = () => {
    setFiles([]);
    setPreviewUrls([]);
    setAiData(null);
    setStreamPartialV5(null);
    setStreamStage(null);
    setScanError(null);
    setTelemetry(IDLE_TELEMETRY);
    setPreviewOpen(false);
    setResultsOpen(false);
    if (dockWizard) setDockWizardStep(1);
  };

  const resetResult = () => {
    setAiData(null);
    setStreamPartialV5(null);
    setStreamStage(null);
    setScanError(null);
    setTelemetry(IDLE_TELEMETRY);
    setResultsOpen(false);
    if (dockWizard) setDockWizardStep(4);
  };

  const runScan = async () => {
    if (!activeFile || authStatus !== "authenticated") {
      toast.error("יש להתחבר ולבחור קובץ לפני סריקה.");
      return;
    }
    setScanning(true);
    setElapsedSeconds(0);
    setAiData(null);
    setStreamPartialV5(null);
    setStreamStage(null);
    setScanError(null);
    setTelemetry(RUNNING_TELEMETRY);

    const formData = new FormData();
    formData.append("file", activeFile);
    formData.append("scanMode", scanMode);
    formData.append("engineRunMode", engineRunMode);
    formData.append("persist", "false");
    formData.append("openAiModel", resolvedOpenAiModel);
    if (engineInstruction.trim()) formData.append("userInstruction", engineInstruction.trim());
    if (projectLabel.trim()) formData.append("project", projectLabel.trim());
    if (clientLabel.trim()) formData.append("client", clientLabel.trim());

    try {
      const res = await fetch("/api/scan/tri-engine/stream", { method: "POST", body: formData });
      if (!res.ok) {
        const text = await res.text();
        let message = "הסריקה נכשלה";
        const firstLine = text.split("\n").find((line) => line.trim());
        if (firstLine) {
          try {
            const parsed = JSON.parse(firstLine) as { error?: string };
            if (parsed.error) message = parsed.error;
          } catch {
            message = text.slice(0, 500) || message;
          }
        }
        setScanError(message);
        setTelemetry(IDLE_TELEMETRY);
        toast.error(truncateText(message, 180));
        return;
      }

      if (!res.body) {
        setScanError("תשובת שרת ללא גוף");
        setTelemetry(IDLE_TELEMETRY);
        toast.error("תשובת שרת ללא גוף");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finishedOk = false;
      let streamError: string | null = null;

      const handleEvent = (event: Record<string, unknown>) => {
        if (event.type === "start") {
          const warnings = event.usageWarnings;
          if (Array.isArray(warnings) && warnings.length > 0) {
            toast.message("סריקה", { description: String(warnings[0]).slice(0, 160) });
          }
          return;
        }
        if (event.type === "telemetry" && event.telemetry && typeof event.telemetry === "object") {
          setTelemetry(event.telemetry as TriTelemetry);
        }
        if (event.type === "partial_v5" && event.v5 && typeof event.v5 === "object") {
          setStreamPartialV5(event.v5 as ScanExtractionV5);
          setStreamStage(typeof event.stage === "string" ? event.stage : null);
        }
        if (event.type === "done" && event.ok === true && event.aiData && typeof event.aiData === "object") {
          finishedOk = true;
          streamError = null;
          setScanError(null);
          setAiData(event.aiData as Record<string, unknown>);
          setStreamPartialV5(null);
          setStreamStage(null);
          if (event.telemetry && typeof event.telemetry === "object") {
            setTelemetry(event.telemetry as TriTelemetry);
          }
          toast.success("הפענוח הושלם");
        }
        if (event.type === "error" && typeof event.error === "string") {
          if (finishedOk) return;
          streamError = event.error;
          setStreamStage(null);
          setStreamPartialV5(null);
          setScanError(event.error);
          toast.error(truncateText(event.error, 180));
        }
      };

      const consumeLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        try {
          handleEvent(JSON.parse(trimmed) as Record<string, unknown>);
        } catch {
          // Ignore malformed stream chunks.
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (value) buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(consumeLine);
          if (done) break;
        }
        consumeLine(buffer);
        if (!finishedOk && !streamError) {
          setScanError("הזרם נסגר ללא תוצאה");
          toast.error("הזרם נסגר ללא תוצאה");
        }
      } finally {
        reader.releaseLock();
      }
    } catch {
      setScanError("שגיאת רשת");
      setTelemetry(IDLE_TELEMETRY);
      toast.error("שגיאת רשת");
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async (target: "ERP" | "CRM") => {
    if (!activeFile || !aiData) return;
    setSavingTarget(target);
    try {
      const saved = await saveScannedDocumentAction(
        activeFile.name,
        aiData,
        target,
        target === "CRM" && selectedContactId ? selectedContactId : undefined,
      );
      if (!saved.success) {
        toast.error(saved.error || "השמירה נכשלה");
        return;
      }
      toast.success(target === "ERP" ? "נשמר ל-ERP" : "נשמר ל-CRM");
      if (saved.documentId) {
        dispatchScanComplete({ documentId: saved.documentId, target });
      }
      router.push(target === "ERP" ? "/app/documents/erp" : "/app/clients");
    } finally {
      setSavingTarget(null);
    }
  };

  const resultExportContext = useMemo(
    () =>
      v5
        ? buildResultContext(
            v5,
            activeFile?.name ?? v5.documentMetadata.sourceFileName ?? "scan-result",
            projectLabel,
            clientLabel,
            selectedScanMode.label,
            selectedRunMode.label,
          )
        : null,
    [activeFile?.name, clientLabel, projectLabel, selectedRunMode.label, selectedScanMode.label, v5],
  );

  const resultFileBaseName = useMemo(
    () => sanitizeFileBaseName(resultExportContext?.sourceFileName ?? activeFile?.name ?? "scan-result"),
    [activeFile?.name, resultExportContext?.sourceFileName],
  );

  const handleExportResult = (format: ResultExportFormat) => {
    if (!v5 || !resultExportContext) {
      toast.error("אין תוצאות פענוח לייצוא.");
      return;
    }

    const exportName = `${resultFileBaseName}-bsd-ybm`;
    if (format === "json") {
      downloadTextFile(
        `${exportName}.json`,
        JSON.stringify({ ...v5, exportMetadata: resultExportContext }, null, 2),
        "application/json",
      );
    } else if (format === "html") {
      downloadTextFile(`${exportName}.html`, buildResultHtmlReport(v5, resultExportContext), "text/html");
    } else if (format === "txt") {
      downloadTextFile(`${exportName}.txt`, buildResultTextReport(v5, resultExportContext), "text/plain");
    } else if (format === "xls") {
      downloadTextFile(`${exportName}.xls`, buildExcelHtmlReport(v5, resultExportContext), "application/vnd.ms-excel");
    } else if (format === "erp-csv") {
      downloadTextFile(`${exportName}-erp.csv`, `\uFEFF${buildLineItemsCsv(v5)}`, "text/csv");
    } else {
      downloadTextFile(`${exportName}-boq.csv`, `\uFEFF${buildBoqCsv(v5)}`, "text/csv");
    }

    toast.success("הקובץ נוצר ונשמר להורדות.");
  };

  const handlePrintResult = (scope: ResultPrintScope) => {
    if (!v5 || !resultExportContext) {
      toast.error("אין תוצאות פענוח להדפסה.");
      return;
    }
    const scopeName = scope === "summary" ? "summary" : scope === "erp" ? "erp" : scope === "boq" ? "boq" : "full";
    printResultHtml(
      buildResultHtmlReport(v5, resultExportContext, scope),
      `${resultFileBaseName}-bsd-ybm-${scopeName}.html`,
    );
  };

  const docAiProcessorSummary = useMemo(() => {
    const processors = engineMeta?.documentAI?.processors ?? [];
    if (!processors.length) return "OCR + Form + Invoice + Expense";
    const configured = processors.filter((processor) => processor.configured);
    const labels = (configured.length ? configured : processors).map((processor) => processor.label);
    return labels.join(" / ");
  }, [engineMeta]);

  const engineRows = [
    {
      key: "documentAI" as const,
      label: "Document AI",
      detail: "OCR, entities, forms, invoices, expenses",
      configured: engineMeta?.configured.documentAI ?? false,
      telemetry: telemetry.documentAI,
      icon: DatabaseZap,
      offset: 0,
    },
    {
      key: "gemini" as const,
      label: `Gemini ${engineMeta?.gemini.primaryLabel ?? ""}`.trim(),
      detail: "תכניות, PDF, תמונות וחזון רב-עמודי",
      configured: engineMeta?.configured.gemini ?? false,
      telemetry: telemetry.gemini,
      icon: Sparkles,
      offset: 7,
    },
    {
      key: "gpt" as const,
      label: openAiModelOptions.find((option) => option.id === resolvedOpenAiModel)?.label ?? "OpenAI",
      detail: "נרמול, מיזוג, דיוק והשלמת שדות",
      configured: engineMeta?.configured.openai ?? false,
      telemetry: telemetry.gpt,
      icon: Brain,
      offset: 13,
    },
  ];

  const shellClass =
    compactHeader && hubPreviewMode
      ? "h-[clamp(520px,min(78vh,860px),min(94vh,940px))] w-full overflow-hidden rounded-[24px] border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] shadow-[var(--cd-shadow)]"
      : compactHeader
        ? "h-full min-h-0 overflow-hidden rounded-[24px] border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] shadow-[var(--cd-shadow)]"
        : "h-[calc(100vh-150px)] min-h-[620px] overflow-hidden rounded-[24px] border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-900)] shadow-[var(--cd-shadow)]";

  return (
    <div
      id="erp-multi-scanner"
      data-scanner-board="true"
      dir={dockWizard ? dir : "rtl"}
      lang={dockWizard ? locale : "he"}
      className={shellClass}
    >
      <div className="flex h-full min-h-0 flex-col">
        {!dockWizard ? (
        <header className="shrink-0 border-b border-[color:var(--line)] bg-[color:var(--canvas-raised)]/95 px-3 py-3 backdrop-blur xl:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--ink-900)] text-white shadow-sm">
                <ActiveIcon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-[color:var(--ink-900)] xl:text-lg">לוח סריקה חכם</h1>
                  <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-2.5 py-1 text-[11px] font-black text-[color:var(--ink-700)]">
                    CRM + ERP + Multi-Engine
                  </span>
                </div>
                <p className="mt-0.5 max-w-4xl truncate text-[11px] font-medium text-[color:var(--ink-500)] xl:text-xs">
                  מותאם ל-{config.label}: עבודה מלאה ב-100% זום, מסלולי מנועים, בחירת מודל, בחירת מעבדי Document AI,
                  שיוך לפרויקט וללקוח, ושמירה ישירה ל-ERP או CRM.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {!dockWizard ? (
                <button
                  type="button"
                  onClick={triggerFilePreview}
                  disabled={!activeFile || !activePreviewUrl}
                  className="inline-flex h-8.5 items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 text-[11px] font-black text-[color:var(--ink-800)] transition hover:bg-[color:var(--canvas-sunken)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  תצוגה מקדימה
                </button>
              ) : null}
              <button
                type="button"
                onClick={resetResult}
                className="inline-flex h-8.5 items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 text-[11px] font-black text-[color:var(--ink-800)] transition hover:bg-[color:var(--canvas-sunken)]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                איפוס תוצאה
              </button>
              <button
                type="button"
                onClick={clearWorkspace}
                className="inline-flex h-8.5 items-center gap-2 rounded-xl bg-[color:var(--ink-900)] px-4 text-[11px] font-black text-white transition hover:bg-[color:var(--ink-800)]"
              >
                ניקוי לוח
              </button>
              {!dockWizard ? (
                <button
                  type="button"
                  onClick={runScan}
                  disabled={scanning || !activeFile || authStatus !== "authenticated"}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[color:var(--axis-clients)] px-4 text-[11px] font-black text-white shadow-md transition hover:bg-[color:var(--axis-clients-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                  {scanning ? "מריץ פענוח..." : activeFile ? "הפעל סריקה" : "בחר קובץ לסריקה"}
                </button>
              ) : null}
            </div>
          </div>
        </header>
        ) : null}

        {dockWizard ? (
          <DockWizardScanLayout
            hubPreviewMode={hubPreviewMode}
            dockWizardStep={dockWizardStep}
            setDockWizardStep={setDockWizardStep}
            wizardStepLabels={wizardStepLabels}
            t={t}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            files={files}
            activeFileIndex={activeFileIndex}
            setActiveFileIndex={setActiveFileIndex}
            activeFile={activeFile}
            activePreviewUrl={activePreviewUrl}
            triggerFilePreview={triggerFilePreview}
            scanMode={scanMode}
            setScanMode={setScanMode}
            engineRunMode={engineRunMode}
            setEngineRunMode={setEngineRunMode}
            scanning={scanning}
            authStatus={authStatus}
            lookupSearch={lookupSearch}
            setLookupSearch={setLookupSearch}
            engineInstruction={engineInstruction}
            setEngineInstruction={setEngineInstruction}
            lookupsLoading={lookupsLoading}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            selectedContactId={selectedContactId}
            setSelectedContactId={setSelectedContactId}
            visibleProjects={visibleProjects}
            contacts={contacts}
            engineMeta={engineMeta}
            engineMetaLoading={engineMetaLoading}
            resolvedOpenAiModel={resolvedOpenAiModel}
            openAiModelOptions={openAiModelOptions}
            setOpenAiModel={setOpenAiModel}
            docAiProcessors={docAiProcessors}
            docAiRecommendedKinds={docAiRecommendedKinds}
            engineRows={engineRows}
            selectedScanMode={selectedScanMode}
            selectedRunMode={selectedRunMode}
            streamStage={streamStage}
            scanError={scanError}
            v5={v5}
            totalProgress={totalProgress}
            elapsedSeconds={elapsedSeconds}
            runScan={runScan}
            setResultsOpen={setResultsOpen}
            handleSave={handleSave}
            resetResult={resetResult}
            clearWorkspace={clearWorkspace}
            aiData={aiData}
            savingTarget={savingTarget}
            docAiProcessorSummary={docAiProcessorSummary}
          />
        ) : (
        <main
          className={`grid min-h-0 flex-1 grid-cols-1 gap-3 p-2.5 xl:grid-cols-3 ${hubPreviewMode ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"}`}
        >
          <aside className="min-h-0 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[var(--cd-shadow-sm)]">
            <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
              <SectionTitle eyebrow="מנועים" title="תכנון הסריקה" icon={Network} />

              <div className="mt-2.5 space-y-2.5">
                <CardShell>
                  <div className="mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" aria-hidden />
                    <h2 className="text-sm font-black text-[color:var(--ink-900)]">מצב סריקה</h2>
                  </div>
                  <div className="space-y-2">
                    {SCAN_MODES.map((mode) => {
                      const Icon = mode.icon;
                      const selected = scanMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setScanMode(mode.id)}
                          disabled={scanning}
                          className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-start transition ${
                            selected
                              ? "border-[color:var(--ink-900)] bg-[color:var(--ink-900)] text-white"
                              : "border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
                          }`}
                        >
                          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-white" : "text-blue-600"}`} aria-hidden />
                          <span className="min-w-0">
                            <span className="block text-sm font-black">{mode.label}</span>
                            <span className={`mt-1 block text-[11px] leading-4 ${selected ? "text-[color:var(--ink-400)]" : "text-[color:var(--ink-500)]"}`}>
                              {mode.description}
                            </span>
                            <span className={`mt-1 block text-[11px] font-bold ${selected ? "text-[color:var(--ink-300)]" : "text-[color:var(--ink-600)]"}`}>
                              פלט: {mode.output}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardShell>

                <CardShell>
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[color:var(--ink-500)]" aria-hidden />
                    <h2 className="text-sm font-black text-[color:var(--ink-900)]">אסטרטגיית מנועים</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {RUN_MODES.map((mode) => {
                      const selected = engineRunMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setEngineRunMode(mode.id)}
                          disabled={scanning}
                          title={mode.description}
                          className={`rounded-2xl border px-3 py-2 text-start transition ${
                            selected
                              ? "border-blue-500 bg-blue-50 text-blue-900"
                              : "border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
                          }`}
                        >
                          <span className="block text-xs font-black">{mode.label}</span>
                          <span className="mt-1 block text-[10px] font-semibold text-[color:var(--ink-500)]">{mode.short}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 rounded-2xl bg-[color:var(--canvas-sunken)] p-3 text-[11px] font-semibold leading-5 text-[color:var(--ink-600)]">
                    {selectedRunMode.description}
                  </p>
                </CardShell>

                <CardShell>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-black text-[color:var(--ink-900)]">יכולות מנוע לפי מצב</h2>
                    {engineMetaLoading ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--ink-400)]" aria-hidden /> : null}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--ink-400)]">Document AI</p>
                      <div className="flex flex-wrap gap-2">
                        {docAiProcessors.length > 0 ? (
                          docAiProcessors.map((processor) => (
                            <ProcessorBadge
                              key={processor.kind}
                              label={processor.label}
                              sublabel={processor.kind}
                              active={docAiRecommendedKinds.includes(processor.kind)}
                              configured={processor.configured}
                            />
                          ))
                        ) : (
                          <ProcessorBadge label="OCR + Forms + Invoice + Expense" sublabel="Processors" active configured={false} />
                        )}
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-5 text-[color:var(--ink-600)]">
                        סדר עדיפות במצב הנוכחי: {docAiRecommendedKinds.join(" -> ")}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <EngineOptionRow
                        title="Gemini"
                        description={`מודל ראשי: ${engineMeta?.gemini.primaryLabel ?? "Gemini primary"}`}
                        tone="emerald"
                      />
                      <EngineOptionRow title="OpenAI" description="בחר מודל להרצת GPT ולמיזוג תוצאות" tone="violet">
                        <select
                          value={resolvedOpenAiModel}
                          onChange={(event) => setOpenAiModel(event.target.value)}
                          disabled={scanning}
                          className="h-10 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-3 text-sm font-bold text-[color:var(--ink-900)] outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          {openAiModelOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </EngineOptionRow>
                    </div>
                  </div>
                </CardShell>

                <CardShell className="min-h-[190px]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-black text-[color:var(--ink-900)]">התקדמות מנועים</h2>
                    <span className="rounded-full bg-[color:var(--canvas-sunken)] px-2.5 py-1 text-[11px] font-black text-[color:var(--ink-600)]">
                      {totalProgress}% כולל
                    </span>
                  </div>
                  <div className="space-y-2">
                    {engineRows.map((engine) => {
                      const Icon = engine.icon;
                      const StatusIcon = phaseIcon(engine.telemetry.phase);
                      const progress = engineProgress(engine.telemetry.phase, scanning, elapsedSeconds, engine.offset);
                      const activeInMode = selectedRunMode.engines.includes(engine.key);
                      return (
                        <div
                          key={engine.key}
                          className={`rounded-2xl border p-3 ${
                            activeInMode ? "border-[color:var(--line)] bg-[color:var(--canvas-raised)]" : "border-[color:var(--line)] bg-[color:var(--canvas-sunken)] opacity-70"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2">
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ink-500)]" aria-hidden />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-[color:var(--ink-900)]">{engine.label}</p>
                                <p className="text-[11px] font-semibold text-[color:var(--ink-500)]">{engine.detail}</p>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                                engine.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {engine.configured ? "מוגדר" : "חסר"}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--canvas-sunken)]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressTone(engine.telemetry.phase)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-black">
                            <span className="inline-flex items-center gap-1 text-[color:var(--ink-600)]">
                              <StatusIcon
                                className={`h-3.5 w-3.5 ${engine.telemetry.phase === "running" ? "animate-spin" : ""}`}
                                aria-hidden
                              />
                              {phaseLabel(engine.telemetry.phase)}
                            </span>
                            <span className="text-[color:var(--ink-400)]">{engine.telemetry.ms ? `${engine.telemetry.ms}ms` : `${progress}%`}</span>
                          </div>
                          {engine.telemetry.detail ? (
                            <p className="mt-2 rounded-xl bg-[color:var(--canvas-sunken)] p-2 text-[11px] font-semibold leading-4 text-[color:var(--ink-500)]">
                              {truncateText(engine.telemetry.detail, 160)}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </CardShell>
              </div>
            </div>
          </aside>

          <section className="min-h-0 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[var(--cd-shadow-sm)]">
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-[color:var(--line)] bg-[color:var(--canvas-sunken)]/35 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <PanelTopOpen className="h-4 w-4 text-blue-600" aria-hidden />
                    <p className="text-sm font-black text-[color:var(--ink-900)] xl:text-base">דשבורד סריקה</p>
                    {streamStage ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {scanning ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                        {STREAM_STAGE_LABELS[streamStage] ?? streamStage}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MiniPill label="מצב" value={selectedScanMode.label} />
                    <MiniPill label="מנוע" value={selectedRunMode.short} />
                    <MiniPill label="קובץ" value={activeFile?.name ?? "אין"} />
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {scanError ? (
                  <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800">
                    <div className="mb-2 flex items-center gap-2 font-black">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      שגיאת סריקה
                    </div>
                    {truncateText(scanError, 1800)}
                  </div>
                ) : null}

                <div className="grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="ספק" value={v5?.vendor || "-"} hint="זיהוי" />
                    <StatTile label="סוג" value={v5?.docType || "-"} hint="מסמך" />
                    <StatTile label="ERP" value={String(v5?.lineItems.length ?? 0)} hint="שורות" />
                    <StatTile label="כמויות" value={String(v5?.billOfQuantities.length ?? 0)} hint="פריטים" />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <DashboardAction
                      icon={Eye}
                      label="תצוגה"
                      hint={activeFile ? activeFile.name : "בחר קובץ"}
                      onClick={triggerFilePreview}
                      disabled={!activeFile || !activePreviewUrl}
                    />
                    <DashboardAction
                      icon={TableProperties}
                      label="תוצאות"
                      hint={v5 ? `${v5.lineItems.length + v5.billOfQuantities.length} שורות` : "ממתין"}
                      onClick={() => setResultsOpen(true)}
                      disabled={!v5}
                    />
                    <DashboardAction
                      icon={scanning ? Loader2 : Play}
                      label={scanning ? "סורק" : "סריקה"}
                      hint={`${selectedRunMode.short} | ${selectedScanMode.label}`}
                      onClick={runScan}
                      disabled={scanning || !activeFile || authStatus !== "authenticated"}
                      primary
                      spinning={scanning}
                    />
                  </div>

                  <CardShell className="min-h-[280px]">
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                      <div className={`flex h-20 w-20 items-center justify-center rounded-[2rem] ${v5 ? "bg-emerald-50 text-emerald-700" : scanning ? "bg-blue-50 text-blue-700" : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]"}`}>
                        {v5 ? (
                          <CheckCircle2 className="h-10 w-10" aria-hidden />
                        ) : scanning ? (
                          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
                        ) : (
                          <UploadCloud className="h-10 w-10" aria-hidden />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[color:var(--ink-900)]">
                          {v5 ? "פוענח" : scanning ? "בעבודה" : "בחר קובץ"}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-[color:var(--ink-500)]">
                          {v5 ? "פתח את התוצאות לבדיקה." : activeFile ? "מוכן לסריקה." : "גרור קובץ בצד."}
                        </p>
                      </div>
                      <div className="grid w-full max-w-xl grid-cols-3 gap-2">
                        <IconMetric icon={Settings2} label="מצב" value={selectedScanMode.label} />
                        <IconMetric icon={Network} label="מנוע" value={selectedRunMode.short} />
                        <IconMetric icon={Gauge} label="התקדמות" value={`${totalProgress}%`} />
                      </div>
                    </div>
                  </CardShell>

                  <div className="grid gap-3 md:grid-cols-3">
                    {engineRows.map((engine) => {
                      const Icon = engine.icon;
                      const StatusIcon = phaseIcon(engine.telemetry.phase);
                      return (
                        <button
                          key={engine.key}
                          type="button"
                          title={engine.detail}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-3 text-start shadow-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Icon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                            <span className="truncate text-xs font-black text-[color:var(--ink-900)]">{engine.label}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-[11px] font-black text-[color:var(--ink-500)]">
                            <StatusIcon className={`h-3.5 w-3.5 ${engine.telemetry.phase === "running" ? "animate-spin" : ""}`} aria-hidden />
                            {phaseLabel(engine.telemetry.phase)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="min-h-0 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[var(--cd-shadow-sm)]">
            <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
              <SectionTitle eyebrow="קלט" title="קבצים, שיוך ופעולות" icon={UploadCloud} />

              <div className="mt-2.5 space-y-2.5">
                <CardShell>
                  <div
                    {...getRootProps()}
                    className={`group cursor-pointer rounded-2xl border border-dashed p-4 text-center transition ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)] hover:border-blue-400 hover:bg-blue-50/60"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--canvas-raised)] shadow-sm ring-1 ring-[color:var(--line)]">
                      <UploadCloud className="h-5 w-5 text-blue-600" aria-hidden />
                    </div>
                    <p className="text-sm font-black text-[color:var(--ink-900)]">גררו קבצים או לחצו להעלאה</p>
                    <p className="mt-1 text-[11px] text-[color:var(--ink-500)]">PDF, תמונות ומסמכים נתמכים.</p>
                  </div>

                  <div className="mt-3 space-y-2">
                    {files.length === 0 ? (
                      <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-3 text-center text-xs text-[color:var(--ink-500)]">
                        עדיין לא נבחר קובץ.
                      </div>
                    ) : (
                      files.map((file, index) => (
                        <button
                          key={`${file.name}-${index}`}
                          type="button"
                          onClick={() => setActiveFileIndex(index)}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition ${
                            index === activeFileIndex
                              ? "border-blue-300 bg-blue-50 text-blue-950"
                              : "border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
                          }`}
                        >
                          <FileSearch className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black">{file.name}</span>
                            <span className="text-[11px] text-[color:var(--ink-500)]">{fileSizeLabel(file.size)}</span>
                          </span>
                          {index === activeFileIndex ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">פעיל</span>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={triggerFilePreview}
                      disabled={!activeFile || !activePreviewUrl}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] text-sm font-black text-[color:var(--ink-700)] transition hover:bg-[color:var(--canvas-sunken)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                      תצוגה
                    </button>
                    <div className="flex h-10 items-center justify-center rounded-xl bg-[color:var(--canvas-sunken)] px-3 text-[11px] font-black text-[color:var(--ink-600)]">
                      {activeFile ? fileSizeLabel(activeFile.size) : "אין קובץ"}
                    </div>
                  </div>
                </CardShell>

                <CardShell>
                  <div className="mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[color:var(--ink-500)]" aria-hidden />
                    <h2 className="text-sm font-black text-[color:var(--ink-900)]">שיוך CRM / ERP</h2>
                    {lookupsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[color:var(--ink-400)]" aria-hidden /> : null}
                  </div>

                  <label className="block text-xs font-black text-[color:var(--ink-500)]">
                    חיפוש לקוח או פרויקט
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-3">
                      <Search className="h-4 w-4 text-[color:var(--ink-400)]" aria-hidden />
                      <input
                        value={lookupSearch}
                        onChange={(event) => setLookupSearch(event.target.value)}
                        placeholder="שם לקוח, פרויקט או אתר..."
                        className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-[color:var(--ink-900)] outline-none placeholder:text-[color:var(--ink-400)]"
                      />
                    </div>
                  </label>

                  <label className="mt-3 block text-xs font-black text-[color:var(--ink-500)]">
                    פרויקט
                    <select
                      value={selectedProjectId}
                      onChange={(event) => setSelectedProjectId(event.target.value)}
                      disabled={scanning}
                      className="mt-1 h-10 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-3 text-sm font-bold text-[color:var(--ink-900)] outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">ללא פרויקט</option>
                      {visibleProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                          {!project.isActive ? " (ארכיון)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-3 block text-xs font-black text-[color:var(--ink-500)]">
                    לקוח CRM
                    <select
                      value={selectedContactId}
                      onChange={(event) => setSelectedContactId(event.target.value)}
                      disabled={scanning}
                      className="mt-1 h-10 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-3 text-sm font-bold text-[color:var(--ink-900)] outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">ללא לקוח</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </CardShell>

                <CardShell>
                  <div className="mb-3 flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-600" aria-hidden />
                    <h2 className="text-sm font-black text-[color:var(--ink-900)]">פעולות ושמירה</h2>
                  </div>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={runScan}
                      disabled={scanning || !activeFile || authStatus !== "authenticated"}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {scanning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                      {scanning ? "מריץ סריקה..." : "הפעל סריקה"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave("ERP")}
                      disabled={!aiData || !activeFile || savingTarget !== null}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {savingTarget === "ERP" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CircleDollarSign className="h-4 w-4" aria-hidden />}
                      שמור ל-ERP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave("CRM")}
                      disabled={!aiData || !activeFile || savingTarget !== null}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {savingTarget === "CRM" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserRound className="h-4 w-4" aria-hidden />}
                      שמור ל-CRM
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    <Capability text={`מודל GPT פעיל: ${openAiModelOptions.find((option) => option.id === resolvedOpenAiModel)?.label ?? resolvedOpenAiModel}`} />
                    <Capability text={`Gemini ראשי: ${engineMeta?.gemini.primaryLabel ?? "Gemini primary"}`} />
                    <Capability text={`Document AI פעיל: ${docAiProcessorSummary}`} />
                  </div>
                </CardShell>
              </div>
            </div>
          </aside>
        </main>
        )}
      </div>

      {resultsOpen && v5 ? (
        <div className="dashboard-design-shell fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--ink-900)]/55 p-4 backdrop-blur-sm">
          <div className="workspace-window flex h-[min(92vh,980px)] w-[min(96vw,1500px)] flex-col overflow-hidden rounded-[28px] border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] shadow-[0_35px_90px_-30px_rgba(36,30,80,0.34)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--dash-line)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[color:var(--ink-900)]">תוצאות פענוח</p>
                <p className="mt-0.5 truncate text-xs text-[color:var(--ink-500)]">
                  {activeFile?.name ?? v5.documentMetadata.sourceFileName ?? "מסמך מפוענח"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResultsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-purple)]"
                aria-label="סגור תוצאות"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[color:var(--dash-canvas)] p-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
                <div className="space-y-4">
                  <CardShell>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Metric label="תאריך" value={v5.date || "-"} />
                      <Metric label="סהכ" value={String(v5.total ?? 0)} />
                      <Metric label="פרויקט" value={v5.documentMetadata.project || projectLabel || "-"} />
                      <Metric label="לקוח" value={v5.documentMetadata.client || clientLabel || "-"} />
                    </div>
                    <div className="mt-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-3">
                      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-[color:var(--ink-400)]">סיכום</p>
                      <p className="text-sm font-semibold leading-7 text-[color:var(--ink-800)]">
                        {v5.summary || "אין סיכום עדיין."}
                      </p>
                    </div>
                  </CardShell>

                  {v5.lineItems.length > 0 ? (
                    <ResultRows
                      title="שורות ERP"
                      rows={v5.lineItems.map((row) => ({
                        main: row.description,
                        meta: [row.sku, row.unitPrice == null ? null : `יחידה ${row.unitPrice}`].filter(Boolean).join(" | "),
                        amount: row.lineTotal == null ? (row.quantity == null ? "-" : String(row.quantity)) : String(row.lineTotal),
                      }))}
                    />
                  ) : null}

                  {v5.billOfQuantities.length > 0 ? (
                    <ResultRows
                      title="BOQ"
                      rows={v5.billOfQuantities.map((row) => ({
                        main: row.description,
                        meta: [row.itemRef, row.material, row.unit].filter(Boolean).join(" | "),
                        amount: row.quantity == null ? "-" : String(row.quantity),
                      }))}
                    />
                  ) : null}
                </div>

                <div className="space-y-4">
                  {v5.priceAlertPending ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-800">
                      חסרים מחירים או שיש שורות חלקיות. בדוק לפני שמירה ל-ERP.
                    </div>
                  ) : null}
                  <CardShell>
                    <div className="mb-3 flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-blue-600" aria-hidden />
                      <h3 className="text-sm font-black text-[color:var(--ink-900)]">נתוני מסמך</h3>
                    </div>
                    <div className="grid gap-2">
                      <MetaLine label="מקור" value={v5.documentMetadata.sourceFileName || activeFile?.name || "-"} />
                      <MetaLine label="גיליון / תחום" value={[v5.documentMetadata.sheetIndex, v5.documentMetadata.discipline].filter(Boolean).join(" | ") || "-"} />
                      <MetaLine label="שרטוטים" value={v5.documentMetadata.drawingRefs?.join(", ") || "-"} />
                      <MetaLine label="מנועים" value={v5.enginesUsed?.join(" / ") || selectedRunMode.engines.join(" / ")} />
                    </div>
                  </CardShell>
                  <CardShell>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-emerald-600" aria-hidden />
                        <h3 className="text-sm font-black text-[color:var(--ink-900)]">ייצוא ושמירה</h3>
                      </div>
                      <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
                        Files
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportResult("json")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        <FileJson className="h-4 w-4" aria-hidden />
                        JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportResult("xls")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        <FileSpreadsheet className="h-4 w-4" aria-hidden />
                        Excel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportResult("erp-csv")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        <TableProperties className="h-4 w-4" aria-hidden />
                        CSV ERP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportResult("boq-csv")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        <ReceiptText className="h-4 w-4" aria-hidden />
                        CSV BOQ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportResult("html")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        <FileSearch className="h-4 w-4" aria-hidden />
                        HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportResult("txt")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        <FileText className="h-4 w-4" aria-hidden />
                        TXT
                      </button>
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-6 text-[color:var(--ink-500)]">
                      קובצי HTML ו-Excel יוצאים עם עיצוב דוח מלא, כותרת, נתוני פרויקט וטבלאות נקיות להמשך עבודה.
                    </p>
                  </CardShell>
                  <CardShell>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Printer className="h-4 w-4 text-violet-600" aria-hidden />
                        <h3 className="text-sm font-black text-[color:var(--ink-900)]">הדפסה / PDF</h3>
                      </div>
                      <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
                        A4
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintResult("full")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[color:var(--ink-900)] text-xs font-black text-white transition hover:bg-[color:var(--dash-purple)]"
                      >
                        <Printer className="h-4 w-4" aria-hidden />
                        דוח מלא
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintResult("summary")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-violet-300 hover:text-violet-700"
                      >
                        <FileText className="h-4 w-4" aria-hidden />
                        תקציר
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintResult("erp")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-violet-300 hover:text-violet-700"
                      >
                        <CircleDollarSign className="h-4 w-4" aria-hidden />
                        ERP
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintResult("boq")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-xs font-black text-[color:var(--ink-800)] transition hover:border-violet-300 hover:text-violet-700"
                      >
                        <ReceiptText className="h-4 w-4" aria-hidden />
                        BOQ
                      </button>
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-6 text-[color:var(--ink-500)]">
                      חלון ההדפסה נפתח כדוח לבן ומעוצב. משם אפשר להדפיס למדפסת או לבחור שמירה כ-PDF.
                    </p>
                  </CardShell>
                  <CardShell>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => handleSave("ERP")}
                        disabled={!aiData || !activeFile || savingTarget !== null}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {savingTarget === "ERP" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CircleDollarSign className="h-4 w-4" aria-hidden />}
                        Save ERP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave("CRM")}
                        disabled={!aiData || !activeFile || savingTarget !== null}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {savingTarget === "CRM" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserRound className="h-4 w-4" aria-hidden />}
                        Save CRM
                      </button>
                    </div>
                  </CardShell>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen && activeFile && activePreviewUrl && !hubPreviewMode ? (
        <div className="dashboard-design-shell fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--ink-900)]/55 p-4 backdrop-blur-sm">
          <div className="workspace-window flex h-[min(92vh,980px)] w-[min(96vw,1500px)] flex-col overflow-hidden rounded-[28px] border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] shadow-[0_35px_90px_-30px_rgba(36,30,80,0.34)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--dash-line)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[color:var(--ink-900)]">{activeFile.name}</p>
                <p className="mt-0.5 text-xs text-[color:var(--ink-500)]">תצוגה מקדימה נפתחה בחלון נפרד כדי לשמור על לוח סריקה נקי.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-purple)]"
                aria-label="סגור תצוגה מקדימה"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden bg-[color:var(--dash-canvas)] p-4">
              {isImageFile(activeFile) ? (
                <div className="flex h-full items-center justify-center">
                  <Image
                    src={activePreviewUrl}
                    alt={activeFile.name}
                    width={1800}
                    height={1400}
                    unoptimized
                    className="max-h-full w-auto max-w-full rounded-[24px] border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] object-contain shadow-[var(--dash-shadow)]"
                  />
                </div>
              ) : isPdfFile(activeFile) ? (
                <iframe
                  title={activeFile.name}
                  src={activePreviewUrl}
                  className="h-full min-h-0 w-full rounded-[24px] border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] shadow-[var(--dash-shadow)]"
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-[24px] border border-[color:var(--dash-line)] bg-[color:var(--canvas-raised)] text-sm font-bold text-[color:var(--dash-muted)]">
                  אין תצוגה מקדימה לסוג הקובץ הזה.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
