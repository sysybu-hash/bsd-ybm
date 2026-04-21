"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  FolderKanban,
  Loader2,
  Save,
  Settings2,
  Sparkles,
  UploadCloud,
  UsersRound,
  XCircle,
  Zap,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { DROPZONE_ACCEPT, SCAN_ACCEPT_SUMMARY } from "@/lib/scan-mime";
import { pickBestEngineIndex, scoreExtractedDocument } from "@/lib/score-scan-result";
import { useI18n } from "@/components/I18nProvider";
import { saveScannedDocumentAction } from "@/app/actions/save-scanned-document";
import { type IndustryType } from "@/lib/professions/config";
import { getMergedIndustryConfig } from "@/lib/construction-trades";
import {
  BentoGrid,
  ProgressBar,
  ProgressRing,
  Tile,
  TileHeader,
} from "@/components/ui/bento";

type ProviderRow = {
  id: string;
  label: string;
  description: string;
  configured: boolean;
  supportsDocumentScan: boolean;
  allowedByPlan?: boolean;
};

type EngineRunStatus = "idle" | "queued" | "uploading" | "processing" | "scoring" | "done" | "error";

export type PerEngineScan = {
  providerId: string;
  label: string;
  ok: boolean;
  aiData?: Record<string, unknown>;
  error?: string;
  notice?: string;
  score: number;
  status: EngineRunStatus;
  elapsedMs?: number;
};

export type FileCompareResult = {
  fileName: string;
  previewUrl: string | null;
  isPdf: boolean;
  isImage: boolean;
  mimeType: string;
  engines: PerEngineScan[];
  recommendedIndex: number;
  analysisType: string;
};

type ScannerProps = {
  industry?: IndustryType;
  compactHeader?: boolean;
};

type OcrLanguage = "auto" | "he" | "en";
type BatchPriority = "files" | "engines";
type SaveTarget = "ERP" | "CRM";

const SCANNER_PREFS_KEY = "bsd-erp:scanner:selected-engines";
const SCANNER_MODELS_KEY = "bsd-erp:scanner:selected-models";
const SCANNER_SETTINGS_KEY = "bsd-erp:scanner:settings";

const MODEL_OPTIONS: Record<string, Array<{ id: string; label: string }>> = {
  gemini: [
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ],
  openai: [
    { id: "gpt-5-vision-ultra", label: "GPT-5 Vision Ultra" },
    { id: "gpt-5o", label: "GPT-5o" },
  ],
  anthropic: [
    { id: "claude-4-opus-2026", label: "Claude 4 Opus" },
    { id: "claude-4-sonnet-2026", label: "Claude 4 Sonnet" },
  ],
  docai: [
    { id: "docai-default", label: "DocAI OCR" },
  ],
};

function canRunEngine(provider: ProviderRow) {
  return provider.configured && provider.allowedByPlan !== false;
}

function statusLabel(status: EngineRunStatus) {
  switch (status) {
    case "queued":
      return "בתור";
    case "uploading":
      return "מעלה";
    case "processing":
      return "מפענח";
    case "scoring":
      return "מדרג";
    case "done":
      return "הושלם";
    case "error":
      return "שגיאה";
    default:
      return "מוכן";
  }
}

function statusAxis(status: EngineRunStatus): "warning" | "ai" | "success" {
  if (status === "done") return "success";
  if (status === "error") return "warning";
  return "ai";
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function MultiEngineScanner({
  industry: industryOverride,
  compactHeader = false,
}: ScannerProps) {
  const { t, messages } = useI18n();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const userIndustry = (industryOverride || session?.user?.organizationIndustry || "CONSTRUCTION") as IndustryType;
  const trade = session?.user?.organizationConstructionTrade ?? null;
  const config = getMergedIndustryConfig(userIndustry, trade, messages);
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const ActiveIcon = iconMap[config.iconName] ?? LucideIcons.Bot;

  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  const [activeAnalysisId, setActiveAnalysisId] = useState<string>(config.scanner.analysisTypes[0]?.id || "INVOICE");
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>("auto");
  const [persistToErp, setPersistToErp] = useState(false);
  const [autoCreateClient, setAutoCreateClient] = useState(false);
  const [batchPriority, setBatchPriority] = useState<BatchPriority>("files");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [overallEta, setOverallEta] = useState<string>("—");
  const [compareResults, setCompareResults] = useState<FileCompareResult[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const scanEngineRows = useMemo(() => providers.filter((provider) => provider.supportsDocumentScan), [providers]);
  const eligibleProviders = useMemo(() => scanEngineRows.filter(canRunEngine), [scanEngineRows]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/providers");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.providers)) {
          setProviders(data.providers as ProviderRow[]);
        }
      } catch {
        if (!cancelled) setProviders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scanEngineRows.length) return;
    const storedIds = safeJsonParse<string[]>(window.localStorage.getItem(SCANNER_PREFS_KEY), []);
    const storedModels = safeJsonParse<Record<string, string>>(window.localStorage.getItem(SCANNER_MODELS_KEY), {});
    const storedSettings = safeJsonParse<{
      analysisType?: string;
      ocrLanguage?: OcrLanguage;
      persistToErp?: boolean;
      autoCreateClient?: boolean;
      batchPriority?: BatchPriority;
    }>(window.localStorage.getItem(SCANNER_SETTINGS_KEY), {});

    const restoredIds = storedIds.filter((id) => scanEngineRows.some((provider) => provider.id === id && canRunEngine(provider)));
    setSelectedIds(restoredIds.length > 0 ? restoredIds : eligibleProviders.slice(0, 2).map((provider) => provider.id));
    setSelectedModels(storedModels);
    if (storedSettings.analysisType) setActiveAnalysisId(storedSettings.analysisType);
    if (storedSettings.ocrLanguage) setOcrLanguage(storedSettings.ocrLanguage);
    if (typeof storedSettings.persistToErp === "boolean") setPersistToErp(storedSettings.persistToErp);
    if (typeof storedSettings.autoCreateClient === "boolean") setAutoCreateClient(storedSettings.autoCreateClient);
    if (storedSettings.batchPriority) setBatchPriority(storedSettings.batchPriority);
  }, [scanEngineRows, eligibleProviders]);

  useEffect(() => {
    if (selectedIds.length > 0) {
      window.localStorage.setItem(SCANNER_PREFS_KEY, JSON.stringify(selectedIds));
    }
  }, [selectedIds]);

  useEffect(() => {
    window.localStorage.setItem(SCANNER_MODELS_KEY, JSON.stringify(selectedModels));
  }, [selectedModels]);

  useEffect(() => {
    window.localStorage.setItem(
      SCANNER_SETTINGS_KEY,
      JSON.stringify({
        analysisType: activeAnalysisId,
        ocrLanguage,
        persistToErp,
        autoCreateClient,
        batchPriority,
      }),
    );
  }, [activeAnalysisId, ocrLanguage, persistToErp, autoCreateClient, batchPriority]);

  useEffect(() => {
    const urls = files.map((file) => {
      if (file.type.startsWith("image/") || file.type === "application/pdf") return URL.createObjectURL(file);
      return null;
    });
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  const toggleProvider = (providerId: string) => {
    const provider = scanEngineRows.find((row) => row.id === providerId);
    if (!provider || !canRunEngine(provider)) return;
    setSelectedIds((prev) => (prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: DROPZONE_ACCEPT,
  });

  const selectedAnalysis = config.scanner.analysisTypes.find((mode) => mode.id === activeAnalysisId);
  const totalOps = files.length * Math.max(1, selectedIds.length);

  const executeMultiScan = async () => {
    if (files.length === 0 || authStatus !== "authenticated") return null;
    const runIds = selectedIds.filter((id) => eligibleProviders.some((provider) => provider.id === id));
    if (runIds.length === 0) {
      setGlobalError("יש לבחור לפחות מנוע זמין אחד.");
      return null;
    }

    setGlobalError(null);
    setProcessing(true);
    setProgress(0);
    setOverallEta("—");

    const startedAt = Date.now();
    const out: FileCompareResult[] = files.map((file, index) => ({
      fileName: file.name,
      previewUrl: previewUrls[index],
      isPdf: file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
      isImage: file.type.startsWith("image/"),
      mimeType: file.type || "application/octet-stream",
      engines: runIds.map((providerId) => ({
        providerId,
        label: scanEngineRows.find((provider) => provider.id === providerId)?.label ?? providerId,
        ok: false,
        score: 0,
        status: "queued",
      })),
      recommendedIndex: -1,
      analysisType: activeAnalysisId,
    }));
    setCompareResults(out);

    const ops =
      batchPriority === "engines"
        ? runIds.flatMap((providerId) => files.map((file, fileIndex) => ({ file, fileIndex, providerId })))
        : files.flatMap((file, fileIndex) => runIds.map((providerId) => ({ file, fileIndex, providerId })));

    let doneOps = 0;
    const nextResults = [...out];

    for (const operation of ops) {
      const providerIndex = runIds.indexOf(operation.providerId);
      const engineLabel = scanEngineRows.find((provider) => provider.id === operation.providerId)?.label ?? operation.providerId;
      nextResults[operation.fileIndex].engines[providerIndex] = {
        ...nextResults[operation.fileIndex].engines[providerIndex],
        status: "uploading",
        label: engineLabel,
      };
      setCompareResults([...nextResults]);

      const oneStartedAt = Date.now();
      const formData = new FormData();
      formData.append("file", operation.file);
      formData.append("provider", operation.providerId);
      formData.append("persist", persistToErp ? "true" : "false");
      formData.append("industry", userIndustry);
      formData.append("analysisType", activeAnalysisId);
      formData.append("language", ocrLanguage);
      formData.append("model", selectedModels[operation.providerId] || MODEL_OPTIONS[operation.providerId]?.[0]?.id || "");
      formData.append("autoCreateClient", autoCreateClient ? "true" : "false");

      nextResults[operation.fileIndex].engines[providerIndex] = {
        ...nextResults[operation.fileIndex].engines[providerIndex],
        status: "processing",
      };
      setCompareResults([...nextResults]);

      try {
        const res = await fetch("/api/ai", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          nextResults[operation.fileIndex].engines[providerIndex] = {
            ...nextResults[operation.fileIndex].engines[providerIndex],
            ok: false,
            error: data.error || "שגיאה בעיבוד",
            score: 0,
            status: "error",
            elapsedMs: Date.now() - oneStartedAt,
          };
        } else {
          const ai = (data.aiData || data) as Record<string, unknown>;
          nextResults[operation.fileIndex].engines[providerIndex] = {
            ...nextResults[operation.fileIndex].engines[providerIndex],
            ok: true,
            aiData: ai,
            notice: typeof data.notice === "string" ? data.notice : undefined,
            score: scoreExtractedDocument(ai),
            status: "done",
            elapsedMs: Date.now() - oneStartedAt,
          };
        }
      } catch {
        nextResults[operation.fileIndex].engines[providerIndex] = {
          ...nextResults[operation.fileIndex].engines[providerIndex],
          ok: false,
          error: "שגיאת רשת",
          score: 0,
          status: "error",
          elapsedMs: Date.now() - oneStartedAt,
        };
      }

      nextResults[operation.fileIndex].recommendedIndex = pickBestEngineIndex(nextResults[operation.fileIndex].engines);
      doneOps += 1;
      const pct = Math.round((doneOps / ops.length) * 100);
      setProgress(pct);
      const elapsed = Date.now() - startedAt;
      const avg = elapsed / Math.max(1, doneOps);
      const remainingMs = Math.max(0, Math.round(avg * (ops.length - doneOps)));
      setOverallEta(
        remainingMs < 60_000
          ? `${Math.max(1, Math.round(remainingMs / 1000))} שנ׳`
          : `${Math.max(1, Math.round(remainingMs / 60_000))} דק׳`,
      );
      setCompareResults([...nextResults]);
    }

    setProcessing(false);
    setOverallEta("הושלם");
    return nextResults;
  };

  const handleSave = async (row: FileCompareResult, targetModule: SaveTarget) => {
    const best = row.engines[row.recommendedIndex];
    if (!best?.ok || !best.aiData) return;
    setSavingId(`${row.fileName}-${targetModule}`);
    try {
      const saved = await saveScannedDocumentAction(row.fileName, best.aiData, targetModule);
      if (!saved.success) {
        setGlobalError(saved.error || "השמירה נכשלה.");
        return;
      }
      if (targetModule === "ERP") {
        router.push("/app/documents/erp");
      } else {
        router.push("/app/clients");
      }
    } finally {
      setSavingId(null);
    }
  };

  const providerCards = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {scanEngineRows.map((provider) => {
        const on = selectedIds.includes(provider.id);
        const allowed = canRunEngine(provider);
        const modelOptions = MODEL_OPTIONS[provider.id] ?? [{ id: "default", label: "Default" }];
        const selectedModel = selectedModels[provider.id] || modelOptions[0].id;
        return (
          <div
            key={provider.id}
            className={`tile ${on && allowed ? "border-[color:var(--axis-ai)] shadow-[var(--tile-shadow-raised)]" : ""} ${!allowed ? "opacity-55" : ""}`}
          >
            <div className="tile-body">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="tile-eyebrow">{provider.label}</p>
                  <p className="mt-1 text-[13px] font-semibold text-[color:var(--ink-600)]">{provider.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleProvider(provider.id)}
                  disabled={!allowed}
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-bold transition ${
                    on && allowed
                      ? "bg-[color:var(--axis-ai)] text-white"
                      : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-600)]"
                  }`}
                >
                  {on ? "פעיל" : allowed ? "בחר" : "נעול"}
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold">
                <span className={`timeline-dot ${allowed ? "timeline-dot--success" : "timeline-dot--warning"}`} aria-hidden />
                <span className="text-[color:var(--ink-500)]">{allowed ? "זמין לסריקה" : "לא זמין לפי מפתחות/תוכנית"}</span>
              </div>
              <label className="mt-3 block text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-500)]">
                מודל
                <select
                  className="mt-1 w-full rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                  value={selectedModel}
                  onChange={(event) =>
                    setSelectedModels((current) => ({ ...current, [provider.id]: event.target.value }))
                  }
                  disabled={!allowed}
                >
                  {modelOptions.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );

  const filesList = (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`tile tile-interactive ${isDragActive ? "border-[color:var(--axis-ai)] shadow-[var(--tile-shadow-raised)]" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="tile-body-lg flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai)]">
            <UploadCloud className="h-8 w-8" aria-hidden />
          </div>
          <h3 className="mt-4 text-xl font-black tracking-tight text-[color:var(--ink-900)]">
            {config.scanner.dropzoneTitle}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[color:var(--ink-500)]">
            {config.scanner.dropzoneSub} · {SCAN_ACCEPT_SUMMARY}
          </p>
        </div>
      </div>

      {files.length > 0 ? (
        <div className="grid gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--line)] bg-white px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileSearch className="h-4 w-4 shrink-0 text-[color:var(--axis-ai)]" aria-hidden />
                <span className="truncate text-sm font-semibold text-[color:var(--ink-900)]">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)] hover:text-[color:var(--state-danger)]"
                aria-label={`הסר ${file.name}`}
              >
                <XCircle className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={compactHeader ? "space-y-4" : "space-y-6"} dir="rtl">
      {/* Header */}
      <div className={compactHeader ? "px-1" : "text-center"}>
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--axis-ai-border)] bg-[color:var(--axis-ai-soft)] px-4 py-1.5 text-[color:var(--axis-ai-ink)]">
          <Settings2 className="h-4 w-4" aria-hidden />
          <span className="text-[10px] font-black uppercase tracking-[0.12em]">סקטור: {config.label}</span>
        </div>
        <div className={compactHeader ? "mt-3" : "mt-4"}>
          <div className={`flex ${compactHeader ? "items-start gap-3" : "flex-col items-center"}`}>
            <span
              className={`flex shrink-0 items-center justify-center rounded-[24px] bg-[color:var(--axis-ai-soft)] text-[color:var(--axis-ai)] ${
                compactHeader ? "h-12 w-12" : "h-16 w-16"
              }`}
            >
              <ActiveIcon className={compactHeader ? "h-6 w-6" : "h-8 w-8"} aria-hidden />
            </span>
            <div className={compactHeader ? "" : "mt-3"}>
              <h1 className={`${compactHeader ? "text-xl" : "text-3xl sm:text-4xl"} font-black tracking-tight text-[color:var(--ink-900)]`}>
                {config.scanner.title}
              </h1>
              <p className={`mt-1 max-w-3xl ${compactHeader ? "text-sm" : "text-base"} leading-7 text-[color:var(--ink-500)]`}>
                {config.scanner.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {globalError ? (
        <div className="rounded-lg border border-[color:var(--state-danger-soft)] bg-[color:var(--state-danger-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--state-danger)]">
          {globalError}
        </div>
      ) : null}

      <BentoGrid>
        {/* Settings tile */}
        <Tile tone="neutral" span={8} rows={2}>
          <TileHeader eyebrow="Scanner Settings" />
          <div className="mt-4 space-y-5">
            <div>
              <p className="tile-eyebrow">סוג פענוח</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {config.scanner.analysisTypes.map((mode) => {
                  const active = activeAnalysisId === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveAnalysisId(mode.id)}
                      className={`rounded-xl border px-4 py-3 text-start transition ${
                        active
                          ? "border-[color:var(--axis-ai)] bg-[color:var(--axis-ai-soft)] shadow-[var(--shadow-xs)]"
                          : "border-[color:var(--line)] bg-white hover:border-[color:var(--axis-ai-border)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-[color:var(--axis-ai)] text-white" : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]"}`}>
                          <Zap className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-black text-[color:var(--ink-900)]">{mode.label}</span>
                          <span className="mt-1 block text-[12px] leading-5 text-[color:var(--ink-500)]">{mode.description}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="tile-eyebrow">מנועי סריקה</p>
              <div className="mt-2">{providerCards}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="tile-eyebrow">שפת OCR</span>
                <select
                  className="mt-1 w-full rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                  value={ocrLanguage}
                  onChange={(event) => setOcrLanguage(event.target.value as OcrLanguage)}
                >
                  <option value="auto">אוטומטי</option>
                  <option value="he">עברית</option>
                  <option value="en">אנגלית</option>
                </select>
              </label>

              <label className="block">
                <span className="tile-eyebrow">עדיפות Batch</span>
                <select
                  className="mt-1 w-full rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--ink-900)] outline-none"
                  value={batchPriority}
                  onChange={(event) => setBatchPriority(event.target.value as BatchPriority)}
                >
                  <option value="files">קודם קבצים</option>
                  <option value="engines">קודם מנועים</option>
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={persistToErp}
                  onChange={(event) => setPersistToErp(event.target.checked)}
                  className="h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-black text-[color:var(--ink-900)]">שמירה אוטומטית ל-ERP</span>
                  <span className="mt-0.5 block text-[11px] text-[color:var(--ink-500)]">שומר מסמך אחרי הפענוח</span>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={autoCreateClient}
                  onChange={(event) => setAutoCreateClient(event.target.checked)}
                  className="h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-black text-[color:var(--ink-900)]">צור לקוח אוטומטית</span>
                  <span className="mt-0.5 block text-[11px] text-[color:var(--ink-500)]">כאשר לא נמצא לקוח קיים</span>
                </span>
              </label>
            </div>
          </div>
        </Tile>

        {/* Live processing tile */}
        <Tile tone="ai" span={4} rows={2}>
          <TileHeader eyebrow="Live Processing" liveDot />
          <div className="mt-4 flex items-center justify-center">
            <ProgressRing value={progress} axis="ai" size={148} strokeWidth={12}>
              <span className="text-3xl font-black text-white tabular-nums">{progress}%</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-violet-200/80">
                התקדמות כוללת
              </span>
            </ProgressRing>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-[12px] font-semibold text-white/85">
              <span>פעולות</span>
              <span className="tabular-nums">{processing ? `${Math.round((progress / 100) * totalOps)}/${Math.max(totalOps, 1)}` : totalOps}</span>
            </div>
            <ProgressBar value={progress} axis="ai" glow />
            <div className="grid gap-2">
              {selectedIds.map((providerId) => {
                const provider = scanEngineRows.find((row) => row.id === providerId);
                const statuses = compareResults.flatMap((row) => row.engines.filter((engine) => engine.providerId === providerId));
                const doneCount = statuses.filter((engine) => engine.status === "done").length;
                const errorCount = statuses.filter((engine) => engine.status === "error").length;
                const status: EngineRunStatus =
                  errorCount > 0 ? "error" : doneCount === files.length && files.length > 0 ? "done" : processing ? "processing" : "idle";
                const providerPct = files.length > 0 ? Math.round(((doneCount + errorCount) / files.length) * 100) : 0;
                return (
                  <div key={providerId} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="font-black text-white">{provider?.label ?? providerId}</span>
                      <span className="font-semibold text-white/75">{statusLabel(status)}</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={providerPct} axis={statusAxis(status)} height={6} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-[12px] text-white/85">
              <div className="flex items-center justify-between">
                <span className="font-bold">ETA</span>
                <span className="font-black tabular-nums">{overallEta}</span>
              </div>
            </div>
          </div>
        </Tile>

        {/* Dropzone/files */}
        <Tile tone="neutral" span={12}>
          {filesList}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void executeMultiScan()}
              disabled={processing || files.length === 0 || selectedIds.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--axis-ai)] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Brain className="h-4 w-4" aria-hidden />}
              {processing ? "מפענח..." : "התחל סריקה"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setCompareResults([]);
                setProgress(0);
                setOverallEta("—");
                setGlobalError(null);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-4 py-2 text-sm font-bold text-[color:var(--ink-700)]"
            >
              <XCircle className="h-4 w-4" aria-hidden />
              נקה הכל
            </button>
          </div>
        </Tile>

        {/* Results */}
        {compareResults.map((row, rowIndex) => {
          const recommended = row.recommendedIndex >= 0 ? row.engines[row.recommendedIndex] : null;
          return (
            <Tile key={`${row.fileName}-${rowIndex}`} tone="neutral" span={12}>
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="tile-eyebrow">{selectedAnalysis?.label ?? row.analysisType}</p>
                      <h3 className="mt-1 text-lg font-black tracking-tight text-[color:var(--ink-900)]">{row.fileName}</h3>
                    </div>
                    {recommended?.ok ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--state-success-soft)] px-3 py-1 text-[11px] font-black text-[color:var(--state-success)]">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        מומלץ
                      </span>
                    ) : null}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)]">
                    {row.previewUrl ? (
                      row.isImage ? (
                        <Image src={row.previewUrl} alt={row.fileName} width={900} height={1200} className="h-auto w-full" unoptimized />
                      ) : row.isPdf ? (
                        <iframe src={row.previewUrl} className="h-[420px] w-full bg-white" title={row.fileName} />
                      ) : (
                        <div className="flex h-[220px] items-center justify-center text-sm font-semibold text-[color:var(--ink-500)]">
                          לא זמינה תצוגה מקדימה עבור {row.mimeType}
                        </div>
                      )
                    ) : (
                      <div className="flex h-[220px] items-center justify-center text-sm font-semibold text-[color:var(--ink-500)]">
                        אין תצוגה מקדימה
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      disabled={!recommended?.ok || savingId === `${row.fileName}-ERP`}
                      onClick={() => void handleSave(row, "ERP")}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--axis-finance)] px-3 py-2 text-[12px] font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === `${row.fileName}-ERP` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                      שמור ל-ERP
                    </button>
                    <button
                      type="button"
                      disabled={!recommended?.ok || savingId === `${row.fileName}-CRM`}
                      onClick={() => void handleSave(row, "CRM")}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--axis-clients-border)] bg-[color:var(--axis-clients-soft)] px-3 py-2 text-[12px] font-black text-[color:var(--axis-clients-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === `${row.fileName}-CRM` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UsersRound className="h-4 w-4" aria-hidden />}
                      פתח ב-CRM
                    </button>
                    <Link
                      href="/app/documents"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-black text-[color:var(--ink-700)]"
                    >
                      <FolderKanban className="h-4 w-4" aria-hidden />
                      פתח מסמכים
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="tile-eyebrow">השוואת מנועים</p>
                    <span className="text-[11px] font-bold text-[color:var(--ink-500)]">ציון, שדות, שגיאות, זמן</span>
                  </div>
                  <div className="grid gap-4">
                    {row.engines.map((engine, engineIndex) => {
                      const isBest = engineIndex === row.recommendedIndex && engine.ok;
                      const ai = engine.aiData ?? {};
                      return (
                        <div
                          key={`${row.fileName}-${engine.providerId}`}
                          className={`rounded-2xl border p-4 transition ${
                            isBest
                              ? "border-[color:var(--axis-ai)] bg-[color:var(--axis-ai-soft)]/50 shadow-[var(--shadow-xs)]"
                              : engine.status === "error"
                                ? "border-[color:var(--state-danger-soft)] bg-[color:var(--state-danger-soft)]/50"
                                : "border-[color:var(--line)] bg-white"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-[color:var(--ink-900)]">{engine.label}</p>
                                {isBest ? (
                                  <span className="rounded-full bg-[color:var(--axis-ai)] px-2 py-0.5 text-[10px] font-black text-white">
                                    מומלץ
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-[12px] text-[color:var(--ink-500)]">
                                {statusLabel(engine.status)}{engine.elapsedMs ? ` · ${Math.max(1, Math.round(engine.elapsedMs / 1000))} שנ׳` : ""}
                              </p>
                            </div>
                            <div className="text-start">
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-400)]">Score</p>
                              <p className="text-lg font-black tabular-nums text-[color:var(--ink-900)]">{engine.score}</p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <ProgressBar
                              value={
                                engine.status === "done"
                                  ? 100
                                  : engine.status === "scoring"
                                    ? 90
                                    : engine.status === "processing"
                                      ? 65
                                      : engine.status === "uploading"
                                        ? 30
                                        : engine.status === "queued"
                                          ? 10
                                          : 100
                              }
                              axis={engine.ok ? (isBest ? "ai" : "success") : "warning"}
                              height={6}
                            />
                          </div>

                          {engine.ok ? (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {config.scanner.resultColumns.map((column) => {
                                const value = (ai as Record<string, unknown>)[column.key];
                                return (
                                  <div key={column.key} className="rounded-xl border border-[color:var(--line-subtle)] bg-[color:var(--canvas-sunken)] px-3 py-2.5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--ink-400)]">{column.label}</p>
                                    <p className="mt-1 text-[12px] font-semibold leading-5 text-[color:var(--ink-900)] break-words">
                                      {value == null || value === "" ? "—" : String(value)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--state-danger-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--state-danger)]">
                              <AlertCircle className="h-4 w-4" aria-hidden />
                              {engine.error || "התרחשה שגיאה בעיבוד"}
                            </div>
                          )}

                          {engine.notice ? (
                            <p className="mt-3 text-[11px] font-semibold text-[color:var(--ink-500)]">{engine.notice}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Tile>
          );
        })}
      </BentoGrid>
    </div>
  );
}
