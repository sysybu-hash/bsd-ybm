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
  ChevronLeft,
  CircleDollarSign,
  ClipboardCheck,
  DatabaseZap,
  Eye,
  FileSearch,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  Network,
  Play,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { saveScannedDocumentAction } from "@/app/actions/save-scanned-document";
import { useI18n } from "@/components/I18nProvider";
import { getMergedIndustryConfig } from "@/lib/construction-trades";
import { DROPZONE_ACCEPT, MAX_SCAN_FILE_BYTES } from "@/lib/scan-mime";
import type { IndustryType } from "@/lib/professions/config";
import type { ScanExtractionV5, ScanModeV5 } from "@/lib/scan-schema-v5";

type ScannerProps = {
  industry?: IndustryType;
  compactHeader?: boolean;
};

type EnginePhase = "idle" | "running" | "ok" | "error" | "skipped";

type TriTelemetry = {
  documentAI: { phase: EnginePhase; ms?: number; detail?: string };
  gemini: { phase: EnginePhase; ms?: number; detail?: string };
  gpt: { phase: EnginePhase; ms?: number; detail?: string };
};

type EngineMetaResponse = {
  configured: { documentAI: boolean; gemini: boolean; openai: boolean };
  documentAI?: {
    processors?: Array<{ kind: string; label: string; env: string; consoleType: string; configured: boolean }>;
  };
  gemini: { flagshipModelId: string; primaryModelId: string; primaryLabel: string };
  openai: { defaultModelId: string; modelOptions: { id: string; label: string }[] };
};

type ScanLookupProject = { id: string; name: string; isActive: boolean };
type ScanLookupContact = { id: string; name: string; projectId: string | null };

type EngineRunMode =
  | "AUTO"
  | "MULTI_SEQUENTIAL"
  | "MULTI_PARALLEL"
  | "SINGLE_DOCUMENT_AI"
  | "SINGLE_GEMINI"
  | "SINGLE_OPENAI";

const IDLE_TELEMETRY: TriTelemetry = {
  documentAI: { phase: "idle" },
  gemini: { phase: "idle" },
  gpt: { phase: "idle" },
};

const RUNNING_TELEMETRY: TriTelemetry = {
  documentAI: { phase: "running" },
  gemini: { phase: "running" },
  gpt: { phase: "running" },
};

const FALLBACK_OPENAI_MODEL_OPTIONS = [
  { id: "gpt-5.4-turbo-2026-03", label: "GPT-5.4 Turbo" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4o", label: "GPT-4o" },
];

const SCAN_MODES: {
  id: ScanModeV5;
  label: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  output: string;
}[] = [
  {
    id: "INVOICE_FINANCIAL",
    label: "חשבונית / כספים",
    accent: "emerald",
    icon: ReceiptText,
    description: "פענוח חשבוניות, ספקים, שורות מחיר, מע\"מ וסיכום ERP.",
    output: "שורות ERP, ספק, תאריך, סכום ומחירי שורה.",
  },
  {
    id: "DRAWING_BOQ",
    label: "תכנית / כתב כמויות",
    accent: "sky",
    icon: BarChart3,
    description: "קריאת תכניות, מקרא, מידות, יחידות וכתב כמויות.",
    output: "BOQ מלא, כמויות, יחידות ושורות ERP ללא מחיר כשצריך.",
  },
  {
    id: "GENERAL_DOCUMENT",
    label: "מסמך כללי",
    accent: "violet",
    icon: FileText,
    description: "סיכום מהיר, ישויות, מטא-דאטה וסיווג מסמך.",
    output: "סיכום, סוג מסמך, שדות עיקריים ומטא-דאטה.",
  },
];

const RUN_MODES: {
  id: EngineRunMode;
  label: string;
  short: string;
  description: string;
  engines: ("documentAI" | "gemini" | "gpt")[];
}[] = [
  {
    id: "AUTO",
    label: "חכם לפי סוג מסמך",
    short: "Auto",
    description: "המערכת בוחרת מסלול מיטבי לפי מסמך כספי, תכנית או מסמך כללי.",
    engines: ["documentAI", "gemini", "gpt"],
  },
  {
    id: "MULTI_PARALLEL",
    label: "כמה מנועים במקביל",
    short: "Parallel",
    description: "Gemini ו-GPT רצים יחד, ו-Document AI נכנס כשיש התאמה למסמך.",
    engines: ["documentAI", "gemini", "gpt"],
  },
  {
    id: "MULTI_SEQUENTIAL",
    label: "רב-מנועי מדורג",
    short: "Tri-Engine",
    description: "מסלול יציב ומבוקר: מנוע ייעודי, מנוע חזותי ואז מיזוג.",
    engines: ["documentAI", "gemini", "gpt"],
  },
  {
    id: "SINGLE_DOCUMENT_AI",
    label: "Document AI בלבד",
    short: "DocAI",
    description: "למסמכים מובנים: OCR, entities, טפסים, חשבוניות והוצאות.",
    engines: ["documentAI"],
  },
  {
    id: "SINGLE_GEMINI",
    label: "Gemini בלבד",
    short: "Gemini",
    description: "מנוע חזותי מהיר לתכניות, PDF ותמונות.",
    engines: ["gemini"],
  },
  {
    id: "SINGLE_OPENAI",
    label: "GPT בלבד",
    short: "GPT",
    description: "דיוק, מיזוג, נרמול ושדות משלימים לפי המודל שנבחר.",
    engines: ["gpt"],
  },
];

const STREAM_STAGE_LABELS: Record<string, string> = {
  document_ai: "Document AI",
  openai: "OpenAI",
  openai_single: "OpenAI בלבד",
  openai_parallel: "OpenAI במקביל",
  gemini: "Gemini",
  gemini_single: "Gemini בלבד",
  gemini_parallel: "Gemini במקביל",
  gemini_flash: "Gemini Flash",
  gemini_fallback: "Gemini fallback",
  merged_gemini_openai: "מיזוג Gemini + GPT",
  merged_parallel: "מיזוג מנועים מקבילים",
};

const DOC_AI_MODE_MATRIX: Record<ScanModeV5, string[]> = {
  INVOICE_FINANCIAL: ["INVOICE", "EXPENSE", "FORM", "OCR"],
  DRAWING_BOQ: ["FORM", "OCR"],
  GENERAL_DOCUMENT: ["FORM", "OCR", "INVOICE", "EXPENSE"],
};

function truncateText(value: string, max: number) {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function readV5FromAiData(ai: Record<string, unknown> | null): ScanExtractionV5 | null {
  if (!ai) return null;
  const raw = ai._v5;
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if (candidate.schemaVersion !== 5) return null;
  return raw as ScanExtractionV5;
}

function phaseLabel(phase: EnginePhase) {
  if (phase === "running") return "רץ";
  if (phase === "ok") return "הושלם";
  if (phase === "error") return "נכשל";
  if (phase === "skipped") return "דולג";
  return "מוכן";
}

function engineProgress(phase: EnginePhase, scanning: boolean, elapsed: number, offset: number) {
  if (phase === "ok" || phase === "error" || phase === "skipped") return 100;
  if (phase === "running") return Math.min(94, 18 + elapsed * 7 + offset);
  return scanning ? 8 : 0;
}

function progressTone(phase: EnginePhase) {
  if (phase === "ok") return "bg-emerald-500";
  if (phase === "error") return "bg-rose-500";
  if (phase === "skipped") return "bg-slate-300";
  if (phase === "running") return "bg-blue-600";
  return "bg-slate-200";
}

function phaseIcon(phase: EnginePhase) {
  if (phase === "running") return Loader2;
  if (phase === "ok") return CheckCircle2;
  if (phase === "error") return XCircle;
  if (phase === "skipped") return ChevronLeft;
  return Gauge;
}

function fileSizeLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function MultiEngineScanner({
  industry: industryOverride,
  compactHeader = false,
}: ScannerProps) {
  const { messages } = useI18n();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const userIndustry = (industryOverride || session?.user?.organizationIndustry || "CONSTRUCTION") as IndustryType;
  const trade = session?.user?.organizationConstructionTrade ?? null;
  const config = getMergedIndustryConfig(userIndustry, trade, messages);
  const iconMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const ActiveIcon = iconMap[config.iconName] ?? Bot;

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
  };

  const resetResult = () => {
    setAiData(null);
    setStreamPartialV5(null);
    setStreamStage(null);
    setScanError(null);
    setTelemetry(IDLE_TELEMETRY);
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
      router.push(target === "ERP" ? "/app/documents/erp" : "/app/clients");
    } finally {
      setSavingTarget(null);
    }
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

  const shellClass = compactHeader
    ? "h-full min-h-0 overflow-hidden rounded-[24px] border border-white/20 bg-slate-50 text-slate-950 shadow-[0_32px_120px_rgba(2,6,23,0.32)]"
    : "h-[calc(100vh-150px)] min-h-[620px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 text-slate-950 shadow-sm";

  return (
    <div id="erp-multi-scanner" data-scanner-board="true" dir="rtl" lang="he" className={shellClass}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur xl:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-700 text-white shadow-sm">
                <ActiveIcon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-slate-950 xl:text-lg">לוח סריקה חכם</h1>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                    CRM + ERP + Multi-Engine
                  </span>
                </div>
                <p className="mt-0.5 max-w-4xl truncate text-[11px] font-medium text-slate-500 xl:text-xs">
                  מותאם ל-{config.label}: עבודה מלאה ב-100% זום, מסלולי מנועים, בחירת מודל, בחירת מעבדי Document AI,
                  שיוך לפרויקט וללקוח, ושמירה ישירה ל-ERP או CRM.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                disabled={!activeFile || !activePreviewUrl}
                className="inline-flex h-8.5 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Eye className="h-4 w-4" aria-hidden />
                תצוגה מקדימה
              </button>
              <button
                type="button"
                onClick={resetResult}
                className="inline-flex h-8.5 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                איפוס תוצאה
              </button>
              <button
                type="button"
                onClick={clearWorkspace}
                className="inline-flex h-8.5 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[11px] font-black text-white transition hover:bg-slate-800"
              >
                ניקוי לוח
              </button>
              <button
                type="button"
                onClick={runScan}
                disabled={scanning || !activeFile || authStatus !== "authenticated"}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-[11px] font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                {scanning ? "מריץ פענוח..." : activeFile ? "הפעל סריקה" : "בחר קובץ לסריקה"}
              </button>
            </div>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2.5 xl:grid-cols-[260px_minmax(0,1fr)_280px] 2xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
              <SectionTitle eyebrow="מנועים" title="תכנון הסריקה" icon={Network} />

              <div className="mt-2.5 space-y-2.5">
                <CardShell>
                  <div className="mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" aria-hidden />
                    <h2 className="text-sm font-black text-slate-950">מצב סריקה</h2>
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
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-white" : "text-blue-600"}`} aria-hidden />
                          <span className="min-w-0">
                            <span className="block text-sm font-black">{mode.label}</span>
                            <span className={`mt-1 block text-[11px] leading-4 ${selected ? "text-slate-300" : "text-slate-500"}`}>
                              {mode.description}
                            </span>
                            <span className={`mt-1 block text-[11px] font-bold ${selected ? "text-slate-200" : "text-slate-600"}`}>
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
                    <ShieldCheck className="h-4 w-4 text-slate-500" aria-hidden />
                    <h2 className="text-sm font-black text-slate-950">אסטרטגיית מנועים</h2>
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
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="block text-xs font-black">{mode.label}</span>
                          <span className="mt-1 block text-[10px] font-semibold text-slate-500">{mode.short}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-[11px] font-semibold leading-5 text-slate-600">
                    {selectedRunMode.description}
                  </p>
                </CardShell>

                <CardShell>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-black text-slate-950">יכולות מנוע לפי מצב</h2>
                    {engineMetaLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden /> : null}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Document AI</p>
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
                      <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-600">
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
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
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
                    <h2 className="text-sm font-black text-slate-950">התקדמות מנועים</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
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
                            activeInMode ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2">
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-slate-900">{engine.label}</p>
                                <p className="text-[11px] font-semibold text-slate-500">{engine.detail}</p>
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
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressTone(engine.telemetry.phase)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-black">
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <StatusIcon
                                className={`h-3.5 w-3.5 ${engine.telemetry.phase === "running" ? "animate-spin" : ""}`}
                                aria-hidden
                              />
                              {phaseLabel(engine.telemetry.phase)}
                            </span>
                            <span className="text-slate-400">{engine.telemetry.ms ? `${engine.telemetry.ms}ms` : `${progress}%`}</span>
                          </div>
                          {engine.telemetry.detail ? (
                            <p className="mt-2 rounded-xl bg-slate-50 p-2 text-[11px] font-semibold leading-4 text-slate-500">
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

          <section className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-slate-200 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-950 xl:text-base">מרכז פענוח ותוצרים</p>
                      {streamStage ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                          {scanning ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                          {STREAM_STAGE_LABELS[streamStage] ?? streamStage}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 xl:text-xs">
                      אין יותר תצוגה מקדימה קבועה בלוח. כל השטח המרכזי מוקדש לתוצאה, QA, טבלאות ומיפוי.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MiniPill label="מצב" value={selectedScanMode.label} />
                    <MiniPill label="מסלול" value={selectedRunMode.short} />
                    <MiniPill label="קובץ" value={activeFile?.name ?? "לא נבחר"} />
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
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="ספק / מקור" value={v5?.vendor || "-"} hint="Vendor / source" />
                    <StatTile label="סוג מסמך" value={v5?.docType || "-"} hint="Doc type" />
                    <StatTile label="שורות ERP" value={String(v5?.lineItems.length ?? 0)} hint="Line items" />
                    <StatTile label="פריטי BOQ" value={String(v5?.billOfQuantities.length ?? 0)} hint="Quantities" />
                  </div>

                  {!v5 && !scanError ? (
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <CardShell className="min-h-[280px]">
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                            <UploadCloud className="h-8 w-8" aria-hidden />
                          </div>
                          <h3 className="text-xl font-black text-slate-950">בחרו קובץ והפעילו סריקה</h3>
                          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                            אחרי ההרצה נראה כאן סיכום, שורות ERP, כתב כמויות, מטא-דאטה, סטטוס מנועים והמלצות פעולה.
                          </p>
                        </div>
                      </CardShell>

                      <CardShell>
                        <div className="mb-3 flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-blue-600" aria-hidden />
                          <h3 className="text-sm font-black text-slate-950">מה יופיע כאן</h3>
                        </div>
                        <div className="space-y-2">
                          <Capability text="תוצאה חיה מתוך ה-stream עוד לפני סיום מלא." />
                          <Capability text="שורות ERP, BOQ, מטא-דאטה ותקציר מסמך." />
                          <Capability text="מיזוג בין Document AI, Gemini ו-OpenAI." />
                          <Capability text="שמירה ישירה ל-ERP או ל-CRM אחרי QA." />
                        </div>
                      </CardShell>
                    </div>
                  ) : null}

                  {v5 ? (
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
                      <div className="space-y-3">
                        <CardShell>
                          <div className="mb-3 flex items-center gap-2">
                            <Layers3 className="h-4 w-4 text-blue-600" aria-hidden />
                            <h3 className="text-sm font-black text-slate-950">תקציר והבנת מסמך</h3>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Metric label="תאריך" value={v5.date || "-"} />
                            <Metric label="סה״כ" value={String(v5.total ?? 0)} />
                            <Metric label="פרויקט" value={v5.documentMetadata.project || projectLabel || "-"} />
                            <Metric label="לקוח" value={v5.documentMetadata.client || clientLabel || "-"} />
                          </div>
                          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Summary</p>
                            <p className="text-sm font-semibold leading-7 text-slate-800">
                              {v5.summary || "אין סיכום עדיין."}
                            </p>
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <MetaLine label="מקור קובץ" value={v5.documentMetadata.sourceFileName || activeFile?.name || "-"} />
                            <MetaLine label="Sheet / discipline" value={[v5.documentMetadata.sheetIndex, v5.documentMetadata.discipline].filter(Boolean).join(" | ") || "-"} />
                            <MetaLine label="Drawing refs" value={v5.documentMetadata.drawingRefs?.join(", ") || "-"} />
                            <MetaLine label="Engines used" value={v5.enginesUsed?.join(" / ") || selectedRunMode.engines.join(" / ")} />
                          </div>
                        </CardShell>

                        {v5.priceAlertPending ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-800">
                            חסרים מחירים או שיש שורות חלקיות. לפני שמירה ל-ERP מומלץ לעבור על שורות הסכום.
                          </div>
                        ) : null}

                        <CardShell>
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4 text-violet-600" aria-hidden />
                              <h3 className="text-sm font-black text-slate-950">יכולת מנועים זמינה בלוח</h3>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                              {docAiProcessorSummary}
                            </span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            <Capability text="Document AI: OCR, Invoice, Expense, Form processors." />
                            <Capability text="Gemini: ראיית מסמכים, PDF, תכניות, תמונות ורב-עמודי." />
                            <Capability text="OpenAI: מיזוג, נרמול, QA ושדות משלימים." />
                            <Capability text="Stream NDJSON עם partial V5 ו-telemetry לכל מנוע." />
                          </div>
                        </CardShell>
                      </div>

                      <div className="space-y-3">
                        {v5.lineItems.length > 0 ? (
                          <ResultRows
                            title="שורות ERP"
                            rows={v5.lineItems.map((row) => ({
                              main: row.description,
                              meta: [row.sku, row.unitPrice == null ? null : `יח׳ ${row.unitPrice}`].filter(Boolean).join(" | "),
                              amount:
                                row.lineTotal == null ? (row.quantity == null ? "-" : String(row.quantity)) : String(row.lineTotal),
                            }))}
                          />
                        ) : null}

                        {v5.billOfQuantities.length > 0 ? (
                          <ResultRows
                            title="כתב כמויות"
                            rows={v5.billOfQuantities.map((row) => ({
                              main: row.description,
                              meta: [row.itemRef, row.material, row.unit].filter(Boolean).join(" | "),
                              amount: row.quantity == null ? "-" : String(row.quantity),
                            }))}
                          />
                        ) : null}

                        <CardShell>
                          <div className="mb-3 flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-slate-500" aria-hidden />
                            <h3 className="text-sm font-black text-slate-950">מיפוי API ופעולות</h3>
                          </div>
                          <div className="space-y-2 text-[11px] font-semibold leading-5 text-slate-600">
                            <Capability text={`Document AI processors: ${docAiProcessorSummary}.`} />
                            <Capability text="GET /api/scan/engine-meta: מצב מנועים, מעבדים ומודלי GPT/Gemini." />
                            <Capability text="POST /api/scan/tri-engine/stream: NDJSON חי עם telemetry ו-partial V5." />
                            <Capability text="POST /api/scan/tri-engine: סריקה רגילה ושמירה אופציונלית." />
                            <Capability text="GET /api/org/scan-lookups: חיפוש פרויקט ולקוח CRM." />
                            <Capability text="saveScannedDocumentAction: אישור ושמירה ל-ERP או CRM." />
                          </div>
                        </CardShell>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <aside className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
              <SectionTitle eyebrow="קלט" title="קבצים, שיוך ופעולות" icon={UploadCloud} />

              <div className="mt-2.5 space-y-2.5">
                <CardShell>
                  <div
                    {...getRootProps()}
                    className={`group cursor-pointer rounded-2xl border border-dashed p-4 text-center transition ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/60"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                      <UploadCloud className="h-5 w-5 text-blue-600" aria-hidden />
                    </div>
                    <p className="text-sm font-black text-slate-900">גררו קבצים או לחצו להעלאה</p>
                    <p className="mt-1 text-[11px] text-slate-500">PDF, תמונות ומסמכים נתמכים.</p>
                  </div>

                  <div className="mt-3 space-y-2">
                    {files.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
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
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <FileSearch className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black">{file.name}</span>
                            <span className="text-[11px] text-slate-500">{fileSizeLabel(file.size)}</span>
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
                      onClick={() => setPreviewOpen(true)}
                      disabled={!activeFile || !activePreviewUrl}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                      תצוגה
                    </button>
                    <div className="flex h-10 items-center justify-center rounded-xl bg-slate-100 px-3 text-[11px] font-black text-slate-600">
                      {activeFile ? fileSizeLabel(activeFile.size) : "אין קובץ"}
                    </div>
                  </div>
                </CardShell>

                <CardShell>
                  <div className="mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-500" aria-hidden />
                    <h2 className="text-sm font-black text-slate-950">שיוך CRM / ERP</h2>
                    {lookupsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-hidden /> : null}
                  </div>

                  <label className="block text-xs font-black text-slate-500">
                    חיפוש לקוח או פרויקט
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                      <Search className="h-4 w-4 text-slate-400" aria-hidden />
                      <input
                        value={lookupSearch}
                        onChange={(event) => setLookupSearch(event.target.value)}
                        placeholder="שם לקוח, פרויקט או אתר..."
                        className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>

                  <label className="mt-3 block text-xs font-black text-slate-500">
                    פרויקט
                    <select
                      value={selectedProjectId}
                      onChange={(event) => setSelectedProjectId(event.target.value)}
                      disabled={scanning}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
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

                  <label className="mt-3 block text-xs font-black text-slate-500">
                    לקוח CRM
                    <select
                      value={selectedContactId}
                      onChange={(event) => setSelectedContactId(event.target.value)}
                      disabled={scanning}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
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
                    <h2 className="text-sm font-black text-slate-950">פעולות ושמירה</h2>
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
      </div>

      {previewOpen && activeFile && activePreviewUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="flex h-[min(92vh,980px)] w-[min(96vw,1500px)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{activeFile.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">תצוגה מקדימה נפתחה בחלון נפרד כדי לשמור על לוח סריקה נקי.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                aria-label="סגור תצוגה מקדימה"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden bg-slate-100 p-4">
              {isImageFile(activeFile) ? (
                <div className="flex h-full items-center justify-center">
                  <Image
                    src={activePreviewUrl}
                    alt={activeFile.name}
                    width={1800}
                    height={1400}
                    unoptimized
                    className="max-h-full w-auto max-w-full rounded-2xl border border-slate-200 bg-white object-contain shadow-sm"
                  />
                </div>
              ) : isPdfFile(activeFile) ? (
                <iframe
                  title={activeFile.name}
                  src={activePreviewUrl}
                  className="h-full min-h-0 w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-500">
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

function SectionTitle({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
        <h2 className="text-sm font-black text-slate-950 xl:text-base">{title}</h2>
      </div>
      <Icon className="h-5 w-5 text-blue-600" aria-hidden />
    </div>
  );
}

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm ${className}`.trim()}>{children}</section>;
}

function ProcessorBadge({
  label,
  sublabel,
  active,
  configured,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  configured: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 text-xs ${
        active ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-black">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {configured ? "ON" : "OFF"}
        </span>
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{sublabel}</p>
    </div>
  );
}

function EngineOptionRow({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description: string;
  tone: "emerald" | "violet";
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/60 text-emerald-900" : "border-violet-200 bg-violet-50/60 text-violet-900";
  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <p className="text-xs font-black">{title}</p>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">{description}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-700">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[170px] truncate text-slate-900">{value}</span>
    </span>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1.5 truncate text-base font-black text-slate-950 xl:text-lg">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{hint}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-black text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-black text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function ResultRows({
  title,
  rows,
}: {
  title: string;
  rows: { main: string; meta: string; amount: string }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-3">
        <ClipboardCheck className="h-4 w-4 text-blue-600" aria-hidden />
        <p className="text-sm font-black text-slate-950">{title}</p>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {rows.slice(0, 50).map((row, index) => (
          <div key={`${row.main}-${index}`} className="grid grid-cols-[1fr_90px] gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{row.main}</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{row.meta || "-"}</p>
            </div>
            <p className="text-end text-sm font-black tabular-nums text-slate-800">{row.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Capability({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-2">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
      <span>{text}</span>
    </div>
  );
}
