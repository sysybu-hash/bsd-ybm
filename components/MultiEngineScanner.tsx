"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Brain,
  Building2,
  CheckCircle2,
  FileSearch,
  FileText,
  Layers,
  LayoutPanelLeft,
  Loader2,
  ScanLine,
  Search,
  Sparkles,
  UploadCloud,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { DROPZONE_ACCEPT } from "@/lib/scan-mime";
import { useI18n } from "@/components/I18nProvider";
import { saveScannedDocumentAction } from "@/app/actions/save-scanned-document";
import { type IndustryType } from "@/lib/professions/config";
import { getMergedIndustryConfig } from "@/lib/construction-trades";
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
  gemini: { flagshipModelId: string; primaryModelId: string; primaryLabel: string };
  openai: { defaultModelId: string; modelOptions: { id: string; label: string }[] };
};

const SCAN_MODES: {
  id: ScanModeV5;
  label: string;
  hintShort: string;
  hintDetail: string;
}[] = [
  {
    id: "INVOICE_FINANCIAL",
    label: "חשבונית / פיננסי",
    hintShort: "Document AI (חשבונית) ואז GPT לפי הצורך",
    hintDetail:
      "מומלץ כשיש מעבד Document AI מוגדר ב־Vercel / .env. בלעדיו הסריקה תשתמש בשרשראות Gemini ו־OpenAI.",
  },
  {
    id: "DRAWING_BOQ",
    label: "גירושקא / שרטוט",
    hintShort: "Gemini לשרטוטים + GPT למיזוג ודיוק",
    hintDetail: "מתאים לתוכניות, טבלאות כמויות ומקרא. דגם Gemini הפעיל נטען מהגדרות הסביבה (GEMINI_MODEL וכו׳).",
  },
  {
    id: "GENERAL_DOCUMENT",
    label: "מסמך כללי",
    hintShort: "סיכום וישויות — דגם Gemini מהיר מהשרשרת",
    hintDetail: "מסלול קצר יותר; השרת בוחר דגם לפי המפתחות והשלכות הזמינות.",
  },
];

const FALLBACK_OPENAI_MODEL_OPTIONS: { id: string; label: string }[] = [
  { id: "gpt-5.4-turbo-2026-03", label: "GPT-5.4 Turbo" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4o", label: "GPT-4o" },
];

function truncateText(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

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
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 5) return null;
  return raw as ScanExtractionV5;
}

type ScanLookupProject = { id: string; name: string; isActive: boolean };
type ScanLookupContact = { id: string; name: string; projectId: string | null };

const STREAM_STAGE_LABELS: Record<string, string> = {
  document_ai: "Document AI",
  openai: "GPT",
  gemini: "Gemini (שרטוט)",
  merged_gemini_openai: "מיזוג Gemini + GPT",
  gemini_flash: "Gemini Flash",
};

function streamStageHebrew(stage: string) {
  if (stage === "gemini_fallback") return "Gemini fallback";
  return STREAM_STAGE_LABELS[stage] ?? stage;
}

function enginePillClass(phase: EnginePhase, scanning: boolean): string {
  if (phase === "ok") return "border-emerald-400/45 bg-emerald-500/15 text-emerald-100";
  if (phase === "error") return "border-amber-400/50 bg-amber-500/20 text-amber-100" + (scanning ? "" : " animate-pulse");
  if (phase === "skipped") return "border-slate-600/80 bg-slate-800/50 text-slate-500";
  if (phase === "running") return "border-sky-400/50 bg-sky-500/20 text-sky-50 animate-pulse";
  return "border-white/10 bg-white/5 text-slate-400";
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
  const ActiveIcon = iconMap[config.iconName] ?? LucideIcons.Bot;

  const [files, setFiles] = useState<File[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);

  const [scanMode, setScanMode] = useState<ScanModeV5>("GENERAL_DOCUMENT");
  const [projects, setProjects] = useState<ScanLookupProject[]>([]);
  const [contacts, setContacts] = useState<ScanLookupContact[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [debouncedLookup, setDebouncedLookup] = useState("");
  const [openAiModel, setOpenAiModel] = useState("");
  const [engineMeta, setEngineMeta] = useState<EngineMetaResponse | null>(null);
  const [engineMetaLoading, setEngineMetaLoading] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [telemetry, setTelemetry] = useState<TriTelemetry>(IDLE_TELEMETRY);
  const [aiData, setAiData] = useState<Record<string, unknown> | null>(null);
  const [streamPartialV5, setStreamPartialV5] = useState<ScanExtractionV5 | null>(null);
  const [streamStage, setStreamStage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState<"ERP" | "CRM" | null>(null);

  const activeFile = files[activeFileIndex] ?? null;
  const activePreviewUrl = previewUrls[activeFileIndex] ?? null;

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedLookup(lookupSearch), 380);
    return () => window.clearTimeout(id);
  }, [lookupSearch]);

  useEffect(() => {
    const urls = files.map((file) => {
      if (isImageFile(file) || isPdfFile(file)) return URL.createObjectURL(file);
      return null;
    });
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [files]);

  useEffect(() => {
    setActiveFileIndex((i) => (files.length === 0 ? 0 : Math.min(i, files.length - 1)));
  }, [files.length]);

  const projectLabel = useMemo(() => {
    if (!selectedProjectId) return "";
    return projects.find((p) => p.id === selectedProjectId)?.name ?? "";
  }, [projects, selectedProjectId]);

  const clientLabel = useMemo(() => {
    if (!selectedContactId) return "";
    return contacts.find((c) => c.id === selectedContactId)?.name ?? "";
  }, [contacts, selectedContactId]);

  const v5 = useMemo(() => {
    const fromAi = readV5FromAiData(aiData);
    if (fromAi) return fromAi;
    return streamPartialV5;
  }, [aiData, streamPartialV5]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let cancelled = false;
    (async () => {
      setLookupsLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedLookup.trim()) params.set("q", debouncedLookup.trim());
        if (selectedProjectId) params.set("contactProjectId", selectedProjectId);
        const qs = params.toString();
        const res = await fetch(qs ? `/api/org/scan-lookups?${qs}` : "/api/org/scan-lookups");
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
        const data = (await res.json()) as EngineMetaResponse & { error?: string };
        if (!cancelled && res.ok && data.configured && data.gemini && data.openai) {
          setEngineMeta(data);
        } else if (!cancelled) {
          setEngineMeta(null);
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
    setOpenAiModel((prev) => {
      const opts = engineMeta.openai.modelOptions;
      if (prev && opts.some((o) => o.id === prev)) return prev;
      const def = engineMeta.openai.defaultModelId;
      if (opts.some((o) => o.id === def)) return def;
      return opts[0]?.id ?? def;
    });
  }, [engineMeta]);

  const openAiModelOptions = useMemo(
    () =>
      engineMeta?.openai.modelOptions?.length
        ? engineMeta.openai.modelOptions
        : FALLBACK_OPENAI_MODEL_OPTIONS,
    [engineMeta],
  );

  const resolvedOpenAiModel = useMemo(() => {
    if (openAiModel && openAiModelOptions.some((o) => o.id === openAiModel)) return openAiModel;
    return engineMeta?.openai.defaultModelId ?? openAiModelOptions[0]?.id ?? "";
  }, [openAiModel, openAiModelOptions, engineMeta]);

  const telemetryEngineLabels = useMemo(() => {
    const gem = engineMeta
      ? `Gemini · ${truncateText(engineMeta.gemini.primaryLabel, 32)}`
      : "Gemini";
    const gptOpt = openAiModelOptions.find((o) => o.id === resolvedOpenAiModel);
    const gpt = gptOpt ? `GPT · ${gptOpt.label}` : `GPT · ${truncateText(resolvedOpenAiModel, 24)}`;
    return { gemini: gem, gpt } as const;
  }, [engineMeta, openAiModelOptions, resolvedOpenAiModel]);

  const engineSubtitle = useMemo(() => {
    if (!engineMeta) {
      return engineMetaLoading ? "טוען הגדרות מנועים מהשרת…" : "Document AI · Gemini · GPT (הגדרות סביבה)";
    }
    const { configured: c } = engineMeta;
    const parts = [
      c.documentAI ? "Document AI" : "Document AI (לא מוגדר)",
      c.gemini ? `Gemini ${truncateText(engineMeta.gemini.primaryLabel, 36)}` : "Gemini (לא מוגדר)",
      c.openai
        ? `OpenAI ${truncateText(engineMeta.openai.defaultModelId.replace(/^gpt-/, ""), 28)}`
        : "OpenAI (לא מוגדר)",
    ];
    return parts.join(" · ");
  }, [engineMeta, engineMetaLoading]);

  const visibleProjects = useMemo(() => {
    let rows = projects;
    const q = lookupSearch.trim().toLowerCase();
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q));
    if (selectedProjectId && !rows.some((p) => p.id === selectedProjectId)) {
      const sel = projects.find((p) => p.id === selectedProjectId);
      if (sel) rows = [sel, ...rows];
    }
    return rows;
  }, [projects, lookupSearch, selectedProjectId]);

  useEffect(() => {
    if (!selectedContactId) return;
    if (!contacts.some((c) => c.id === selectedContactId)) {
      setSelectedContactId("");
    }
  }, [contacts, selectedContactId]);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    setFiles((prev) => [...prev, ...accepted]);
    setAiData(null);
    setStreamPartialV5(null);
    setStreamStage(null);
    setScanError(null);
    setTelemetry(IDLE_TELEMETRY);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: DROPZONE_ACCEPT,
  });

  const clearWorkspace = () => {
    setFiles([]);
    setPreviewUrls([]);
    setAiData(null);
    setStreamPartialV5(null);
    setStreamStage(null);
    setScanError(null);
    setTelemetry(IDLE_TELEMETRY);
  };

  const runTriScan = async () => {
    if (!activeFile || authStatus !== "authenticated") {
      toast.error("יש להתחבר ולבחור קובץ.");
      return;
    }
    setScanning(true);
    setScanError(null);
    setAiData(null);
    setStreamPartialV5(null);
    setStreamStage(null);
    setTelemetry(RUNNING_TELEMETRY);

    const fd = new FormData();
    fd.append("file", activeFile);
    fd.append("scanMode", scanMode);
    fd.append("persist", "false");
    if (projectLabel.trim()) fd.append("project", projectLabel.trim());
    if (clientLabel.trim()) fd.append("client", clientLabel.trim());
    fd.append("openAiModel", resolvedOpenAiModel);

    try {
      const res = await fetch("/api/scan/tri-engine/stream", { method: "POST", body: fd });

      if (!res.ok) {
        const text = await res.text();
        let msg = "הסריקה נכשלה";
        const firstLine = text.split("\n").find((l) => l.trim());
        if (firstLine) {
          try {
            const j = JSON.parse(firstLine) as { error?: string };
            if (typeof j.error === "string") msg = j.error;
          } catch {
            msg = text.slice(0, 300) || msg;
          }
        }
        setScanError(msg);
        setTelemetry(IDLE_TELEMETRY);
        toast.error(msg);
        return;
      }

      if (!res.body) {
        setScanError("תשובת שרת ללא גוף");
        setTelemetry(IDLE_TELEMETRY);
        toast.error("תשובת שרת ללא גוף");
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let finishedOk = false;
      let streamErr: string | null = null;

      const handleNdjsonEvent = (ev: Record<string, unknown>) => {
        if (ev.type === "start") {
          const w = ev.usageWarnings;
          if (Array.isArray(w) && w.length > 0) {
            toast.message("סריקה", { description: String(w[0]).slice(0, 160) });
          }
          return;
        }
        if (ev.type === "telemetry" && ev.telemetry && typeof ev.telemetry === "object") {
          setTelemetry(ev.telemetry as TriTelemetry);
        }
        if (ev.type === "partial_v5" && ev.v5 && typeof ev.v5 === "object") {
          setStreamPartialV5(ev.v5 as ScanExtractionV5);
          setStreamStage(typeof ev.stage === "string" ? ev.stage : null);
        }
        if (ev.type === "done" && ev.ok === true && ev.aiData && typeof ev.aiData === "object") {
          streamErr = null;
          setScanError(null);
          setAiData(ev.aiData as Record<string, unknown>);
          if (ev.telemetry && typeof ev.telemetry === "object") {
            setTelemetry(ev.telemetry as TriTelemetry);
          }
          setStreamPartialV5(null);
          setStreamStage(null);
          finishedOk = true;
          const warns = ev.usageWarnings;
          if (Array.isArray(warns) && warns.length > 0) {
            toast.message("הסריקה הושלמה", { description: String(warns[0]).slice(0, 120) });
          } else {
            toast.success("הפענוח הושלם");
          }
          return;
        }
        if (ev.type === "error" && typeof ev.error === "string") {
          if (finishedOk) return;
          streamErr = ev.error;
          setStreamStage(null);
          setStreamPartialV5(null);
          setScanError(ev.error);
          toast.error(ev.error);
        }
      };

      const consumeLine = (rawLine: string) => {
        const t = rawLine.trim();
        if (!t) return;
        let ev: Record<string, unknown>;
        try {
          ev = JSON.parse(t) as Record<string, unknown>;
        } catch {
          return;
        }
        handleNdjsonEvent(ev);
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (value) buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) consumeLine(line);
          if (done) break;
        }

        consumeLine(buf);

        if (!finishedOk && !streamErr) {
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
        const msg = saved.error || "השמירה נכשלה";
        toast.error(msg);
        return;
      }
      toast.success(target === "ERP" ? "אושר ל-ERP" : "יוצא ל-CRM");
      if (target === "ERP") router.push("/app/documents/erp");
      else router.push("/app/clients");
    } finally {
      setSavingTarget(null);
    }
  };

  const shellClass = compactHeader
    ? "flex h-[min(78vh,820px)] max-h-[90vh] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 shadow-2xl shadow-cyan-950/20"
    : "flex h-screen max-h-screen min-h-[640px] flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100";

  const pad = compactHeader ? "p-3 gap-3 sm:p-4 sm:gap-4" : "p-4 gap-4 sm:p-6 lg:p-8 lg:gap-6";
  const paneBase =
    "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/40 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl";

  const feedPrimary = scanMode === "DRAWING_BOQ" ? "boq" : scanMode === "INVOICE_FINANCIAL" ? "invoice" : "general";

  return (
    <div dir="rtl" lang="he" className={shellClass}>
      <header
        className={`shrink-0 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl ${
          compactHeader ? "px-4 py-3" : "px-5 py-4 sm:px-8"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-indigo-500/10">
              <ActiveIcon className="h-5 w-5 text-cyan-200" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className={`font-bold tracking-tight text-white ${compactHeader ? "text-sm" : "text-lg"}`}>
                לוח בקרת סריקה — Tri-Engine
              </h1>
              <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-400">{engineSubtitle}</p>
              {engineMeta ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(
                    [
                      ["Document AI", engineMeta.configured.documentAI],
                      ["Gemini", engineMeta.configured.gemini],
                      ["OpenAI", engineMeta.configured.openai],
                    ] as const
                  ).map(([label, ok]) => (
                    <span
                      key={label}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        ok
                          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-100/95"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400 shadow-[0_0_6px_rgb(52,211,153)]" : "bg-amber-400"}`}
                        aria-hidden
                      />
                      {label}
                      {!ok ? " — חסר מפתח" : null}
                    </span>
                  ))}
                </div>
              ) : engineMetaLoading ? (
                <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  בודק מפתחות סביבה…
                </p>
              ) : (
                <p className="mt-2 text-[10px] text-amber-200/90">
                  לא נטענו מטא-נתוני מנוע — בדקו התחברות או הגדרות Vercel / .env.
                </p>
              )}
            </div>
          </div>
          {files.length > 0 ? (
            <button
              type="button"
              onClick={clearWorkspace}
              className="shrink-0 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-slate-200 transition hover:bg-white/[0.08]"
            >
              נקה סביבת עבודה
            </button>
          ) : null}
        </div>
      </header>

      <div className={`grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12 ${pad}`}>
        {/* ימין קריאה: קודם הגדרות */}
        <section className={`${paneBase} lg:col-span-4`}>
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <Layers className="h-4 w-4 shrink-0 text-cyan-400/90" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">הגדרות</p>
              <p className="truncate text-xs font-semibold text-slate-200">קלט, מצב וקשר לפרויקט</p>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 transition ${
                isDragActive
                  ? "border-cyan-400/80 bg-cyan-500/10"
                  : "border-white/12 bg-slate-950/40 hover:border-cyan-500/35"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mb-2 h-9 w-9 text-cyan-500/50" aria-hidden />
              <p className="text-center text-xs font-bold text-slate-200">גרירה לכאן או לחיצה לבחירה</p>
              <p className="mt-1 text-center text-[10px] text-slate-500">PDF ותמונות — עד כמה קבצים במקביל</p>
            </div>

            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
              מצב סריקה
              <select
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value as ScanModeV5)}
                disabled={scanning}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-xs font-semibold text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500/35"
              >
                {SCAN_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            {(() => {
              const modeDef = SCAN_MODES.find((m) => m.id === scanMode);
              return (
                <>
                  <p className="text-[11px] font-medium leading-snug text-cyan-100/75">{modeDef?.hintShort}</p>
                  <details className="rounded-xl border border-white/[0.06] bg-slate-950/35 px-3 py-2 text-start">
                    <summary className="cursor-pointer text-[10px] font-bold text-slate-400">מידע נוסף על המצב</summary>
                    <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{modeDef?.hintDetail}</p>
                  </details>
                </>
              );
            })()}

            <div className="grid gap-3">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span className="mb-1 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-slate-600" aria-hidden />
                  חיפוש (מסנן פרויקטים + שאילתת לקוחות לשרת)
                </span>
                <input
                  type="search"
                  value={lookupSearch}
                  onChange={(e) => setLookupSearch(e.target.value)}
                  placeholder="שם פרויקט או לקוח…"
                  disabled={scanning}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500/35"
                />
                <p className="mt-1 text-[10px] font-medium text-slate-600">השהייה קצרה לפני שליחת החיפוש לשרת.</p>
              </label>

              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span className="mb-1 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-600" aria-hidden />
                  פרויקט
                  {lookupsLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin text-slate-500" aria-hidden />
                  ) : null}
                </span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={scanning || lookupsLoading}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="">— ללא —</option>
                  {visibleProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {!p.isActive ? " (ארכיון)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span className="mb-1 flex items-center gap-2">
                  <UserRound className="h-3.5 w-3.5 text-slate-600" aria-hidden />
                  לקוח (CRM)
                </span>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  disabled={scanning || lookupsLoading}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-100 outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="">— ללא —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] font-medium text-slate-600">
                  בפרויקט נבחר: לקוחות של הפרויקט וגם ללא פרויקט. השם נשלח לסריקה; מזהה הלקוח ל־CRM בייצוא.
                </p>
              </label>
            </div>

            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
              מודל GPT (מהשרת + env)
              <select
                value={openAiModel || resolvedOpenAiModel}
                onChange={(e) => setOpenAiModel(e.target.value)}
                disabled={scanning || openAiModelOptions.length === 0}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-xs font-semibold text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500/35"
              >
                {openAiModelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">סטטוס ריצה (מנועים)</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["Document AI", telemetry.documentAI],
                    [telemetryEngineLabels.gemini, telemetry.gemini],
                    [telemetryEngineLabels.gpt, telemetry.gpt],
                  ] as const
                ).map(([label, t]) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${enginePillClass(t.phase, scanning)}`}
                  >
                    {t.phase === "running" ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                    {t.phase === "ok" ? <CheckCircle2 className="h-3 w-3" aria-hidden /> : null}
                    {t.phase === "error" ? <XCircle className="h-3 w-3" aria-hidden /> : null}
                    {t.phase === "skipped" ? <Brain className="h-3 w-3 opacity-50" aria-hidden /> : null}
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={runTriScan}
              disabled={scanning || !activeFile || authStatus !== "authenticated" || !resolvedOpenAiModel}
              className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-950/40 transition hover:brightness-110 disabled:opacity-45"
            >
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ScanLine className="h-4 w-4" aria-hidden />}
              {scanning ? "מפענח…" : "הרץ סריקת Tri-Engine"}
            </button>
            {authStatus !== "authenticated" ? (
              <p className="text-center text-[10px] text-amber-200/90">נדרשת התחברות להרצת הסריקה.</p>
            ) : null}
          </div>
        </section>

        <section className={`${paneBase} min-h-[280px] lg:col-span-4`}>
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <LayoutPanelLeft className="h-4 w-4 shrink-0 text-cyan-400/90" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">תצוגה</p>
              <p className="truncate text-xs font-semibold text-slate-200">רשימת קבצים ותצוגה מקדימה</p>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="max-h-[32%] shrink-0 overflow-y-auto border-b border-white/[0.04] px-2 py-2">
              {files.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-slate-500">העלו קבצים מעמודת ההגדרות</p>
              ) : (
                <ul className="space-y-1">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`}>
                      <button
                        type="button"
                        onClick={() => setActiveFileIndex(i)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-xs font-semibold transition ${
                          i === activeFileIndex
                            ? "bg-cyan-500/20 text-cyan-50 ring-1 ring-cyan-400/40"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <FileSearch className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        <span className="min-w-0 truncate">{f.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {!activeFile || !activePreviewUrl ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
                  <FileText className="h-8 w-8 opacity-35" aria-hidden />
                  בחרו קובץ מהרשימה
                </div>
              ) : isImageFile(activeFile) ? (
                <div className="flex justify-center">
                  <Image
                    src={activePreviewUrl}
                    alt={activeFile.name}
                    width={960}
                    height={720}
                    unoptimized
                    className="max-h-full w-auto max-w-full rounded-xl border border-white/10 object-contain"
                  />
                </div>
              ) : isPdfFile(activeFile) ? (
                <div className="flex h-full min-h-[280px] flex-col gap-2">
                  <p className="text-[10px] font-bold text-slate-500">PDF — גלילה פנימית</p>
                  <iframe
                    title={activeFile.name}
                    src={activePreviewUrl}
                    className="min-h-0 flex-1 w-full rounded-xl border border-white/10 bg-slate-950/80"
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">תצוגה לא זמינה לסוג קובץ</div>
              )}
            </div>
          </div>
        </section>

        <section className={`${paneBase} lg:col-span-4`}>
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-200/90" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">פלט מיידי</p>
              <p className="truncate text-xs font-semibold text-slate-200">BOQ, פריטי שורה ומטא</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {scanError ? (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 break-words">{truncateText(scanError, 2400)}</span>
                </div>
              ) : null}

              {streamStage ? (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-sky-400/35 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-100">
                  {scanning ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden /> : null}
                  <span>
                    פיד חי — {streamStageHebrew(streamStage)}
                    {scanning ? "…" : ""}
                  </span>
                </div>
              ) : null}

              {v5?.priceAlertPending ? (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/15 px-3 py-2 text-[11px] font-bold text-amber-100">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  priceAlertPending — נדרש אימות מחירים ב-ERP
                </div>
              ) : null}

              {v5 ? (
                <div className="mb-4 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1.5">
                    <span className="text-slate-500">ספק</span>
                    <p className="truncate font-semibold text-slate-200">{v5.vendor}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1.5">
                    <span className="text-slate-500">סה״כ</span>
                    <p className="font-semibold text-slate-200">{v5.total}</p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1.5">
                    <span className="text-slate-500">סיכום</span>
                    <p className="text-xs font-medium leading-snug text-slate-300">{v5.summary || "—"}</p>
                  </div>
                </div>
              ) : null}

              {!v5 && !scanError ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-xs text-slate-500">
                  <Brain className="h-10 w-10 opacity-30" aria-hidden />
                  הפעלו סריקה כדי לראות נתונים כאן
                </div>
              ) : null}

              {v5 && feedPrimary === "boq" && v5.billOfQuantities.length > 0 ? (
                <div className="mb-6">
                  <p className="mb-2 text-[10px] font-black uppercase text-sky-300/90">כמויות (BOQ)</p>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="table-fixed text-xs w-full">
                      <colgroup>
                        <col className="w-[22%]" />
                        <col />
                        <col />
                        <col />
                        <col />
                      </colgroup>
                      <thead className="bg-white/[0.04] text-[10px] font-black uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-2 py-2 text-start">סימון</th>
                          <th className="px-2 py-2 text-start">תיאור</th>
                          <th className="px-2 py-2 text-end">כמות</th>
                          <th className="px-2 py-2 text-start">יח׳</th>
                          <th className="px-2 py-2 text-start">חומר</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {v5.billOfQuantities.map((row, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="px-2 py-1.5 align-top font-mono text-[10px] text-slate-400">{row.itemRef ?? "—"}</td>
                            <td className="px-2 py-1.5 align-top">{row.description}</td>
                            <td className="px-2 py-1.5 align-top text-end tabular-nums">{row.quantity ?? "—"}</td>
                            <td className="px-2 py-1.5 align-top">{row.unit ?? "—"}</td>
                            <td className="px-2 py-1.5 align-top text-[10px] text-slate-400">{row.material ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {v5 && (feedPrimary === "invoice" || (feedPrimary === "boq" && v5.lineItems.length > 0)) ? (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-emerald-300/90">פריטי שורה</p>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="table-fixed text-xs w-full">
                      <colgroup>
                        <col className="w-[22%]" />
                        <col />
                        <col />
                        <col />
                        <col />
                      </colgroup>
                      <thead className="bg-white/[0.04] text-[10px] font-black uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-2 py-2 text-start">מק״ט</th>
                          <th className="px-2 py-2 text-start">תיאור</th>
                          <th className="px-2 py-2 text-end">כמות</th>
                          <th className="px-2 py-2 text-end">מחיר יח׳</th>
                          <th className="px-2 py-2 text-end">סכום</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {v5.lineItems.map((row, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="px-2 py-1.5 align-top font-mono text-[10px] text-slate-400">{row.sku ?? "—"}</td>
                            <td className="px-2 py-1.5 align-top">{row.description}</td>
                            <td className="px-2 py-1.5 align-top text-end tabular-nums">{row.quantity ?? "—"}</td>
                            <td className="px-2 py-1.5 align-top text-end tabular-nums">{row.unitPrice ?? "—"}</td>
                            <td className="px-2 py-1.5 align-top text-end tabular-nums">{row.lineTotal ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {v5 && feedPrimary === "general" && v5.billOfQuantities.length === 0 && v5.lineItems.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400">
                  <p className="font-bold text-slate-300">מצב כללי</p>
                  <p className="mt-1 leading-relaxed">{v5.summary || "אין שורות מפורטות — השתמשו במטא-דאטה למעלה."}</p>
                </div>
              ) : null}
            </div>

            <footer className="flex shrink-0 gap-4 border-t border-white/10 bg-white/[0.02] p-4 backdrop-blur-md">
              <button
                type="button"
                onClick={() => handleSave("ERP")}
                disabled={!aiData || !activeFile || savingTarget !== null}
                className="flex flex-1 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/15 py-3 text-xs font-black text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-40"
              >
                {savingTarget === "ERP" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                אשר ל-ERP
              </button>
              <button
                type="button"
                onClick={() => handleSave("CRM")}
                disabled={!aiData || !activeFile || savingTarget !== null}
                className="flex flex-1 items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/15 py-3 text-xs font-black text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-40"
              >
                {savingTarget === "CRM" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                ייצוא ל-CRM
              </button>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
