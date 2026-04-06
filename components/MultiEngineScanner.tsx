"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Brain,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Archive,
  FolderKanban,
  StepForward,
  XCircle,
} from "lucide-react";
import { DROPZONE_ACCEPT, SCAN_ACCEPT_SUMMARY } from "@/lib/scan-mime";
import { pickBestEngineIndex, scoreExtractedDocument } from "@/lib/score-scan-result";
import { useI18n } from "@/components/I18nProvider";

type ProviderRow = {
  id: string;
  label: string;
  description: string;
  configured: boolean;
  supportsDocumentScan: boolean;
  allowedByPlan?: boolean;
};

function canRunEngine(p: ProviderRow): boolean {
  return p.configured && p.allowedByPlan !== false;
}

export type PerEngineScan = {
  providerId: string;
  label: string;
  ok: boolean;
  aiData?: Record<string, unknown>;
  error?: string;
  notice?: string;
  score: number;
};

export type FileCompareResult = {
  fileName: string;
  previewUrl: string | null;
  isPdf: boolean;
  isImage: boolean;
  engines: PerEngineScan[];
  recommendedIndex: number;
};

type Variant = "dark" | "light";

void 0; // primary color is now indigo-600 via Tailwind classes

type ScannerProps = {
  variant?: Variant;
  /** ברירת מחדל ממרכז AI — מגדיר סט התחלתי של מנועים (לרוב מנוע יחיד) */
  provider?: string;
  /** פריסה גבוהה יותר (מסך מלא מבועת הסריקה) */
  fillHeight?: boolean;
  /** כותרת חיצונית קומהקטית */
  compactHeader?: boolean;
};

const SCANNER_PREFS_KEY = "bsd-erp:scanner:selected-engines";

function extractAiPayload(data: Record<string, unknown>): Record<string, unknown> {
  const raw = data?.aiData ?? data;
  return typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
}

export default function MultiEngineScanner({
  variant = "light",
  provider,
  fillHeight = false,
  compactHeader = false,
}: ScannerProps) {
  const { dir } = useI18n();
  const { status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compareResults, setCompareResults] = useState<FileCompareResult[]>([]);

  /** תאימות לאחור: כל הערכים מוצגים במצב בהיר */
  void variant;

  /** כל המנועים שמתאימים לסריקת מסמך — גם לפני הגדרת מפתח בשרת */
  const scanEngineRows = useMemo(
    () => providers.filter((p) => p.supportsDocumentScan),
    [providers],
  );

  const eligibleSelectedCount = useMemo(
    () =>
      selectedIds.filter((id) => {
        const p = scanEngineRows.find((x) => x.id === id);
        return p != null && canRunEngine(p);
      }).length,
    [selectedIds, scanEngineRows],
  );

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
    const eligible = scanEngineRows.filter(canRunEngine);

    let stored: string[] = [];
    try {
      const raw = window.localStorage.getItem(SCANNER_PREFS_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      if (Array.isArray(parsed)) {
        stored = parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      stored = [];
    }

    if (provider) {
      const hit = scanEngineRows.find((p) => p.id === provider);
      if (hit && canRunEngine(hit)) setSelectedIds([hit.id]);
      else setSelectedIds(eligible.map((p) => p.id));
    } else if (stored.length > 0) {
      const restored = stored.filter((id) => {
        const row = scanEngineRows.find((p) => p.id === id);
        return row != null && canRunEngine(row);
      });
      if (restored.length > 0) {
        setSelectedIds(restored);
      } else {
        setSelectedIds(eligible.map((p) => p.id));
      }
    } else {
      setSelectedIds(eligible.map((p) => p.id));
    }
  }, [scanEngineRows, provider]);

  useEffect(() => {
    if (!selectedIds.length) return;
    try {
      window.localStorage.setItem(SCANNER_PREFS_KEY, JSON.stringify(selectedIds));
    } catch {
      // Ignore storage write issues.
    }
  }, [selectedIds]);

  useEffect(() => {
    const urls = files.map((f) => {
      const t = f.type || "";
      if (t.startsWith("image/") || t === "application/pdf") {
        return URL.createObjectURL(f);
      }
      return null;
    });
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [files]);

  const toggleProvider = (id: string) => {
    const row = scanEngineRows.find((p) => p.id === id);
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (!row || !canRunEngine(row)) return prev;
      return [...prev, id];
    });
  };

  const selectAllEngines = () =>
    setSelectedIds(scanEngineRows.filter(canRunEngine).map((p) => p.id));
  const clearEngines = () => setSelectedIds([]);

  /** זרימה לינארית: מנועים → קבצים → פענוח → השוואה → סיום */
  const activeStep = useMemo(() => {
    if (compareResults.length > 0) return 5;
    if (processing) return 3;
    if (files.length > 0) return 2;
    return 1;
  }, [compareResults.length, processing, files.length]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setCompareResults([]);
  }, []);

  const clearFiles = () => {
    setFiles([]);
    setCompareResults([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: DROPZONE_ACCEPT,
  });

  const executeMultiScan = useCallback(async (): Promise<FileCompareResult[] | null> => {
    if (files.length === 0 || status !== "authenticated") return null;
    const runIds = selectedIds.filter((id) => {
      const p = scanEngineRows.find((x) => x.id === id);
      return p && canRunEngine(p);
    });
    if (runIds.length === 0) return null;

    setProcessing(true);
    setProgress(0);
    setCompareResults([]);

    const idToLabel = new Map(scanEngineRows.map((p) => [p.id, p.label] as const));
    const totalOps = files.length * runIds.length;
    let doneOps = 0;
    const out: FileCompareResult[] = [];

    for (let fi = 0; fi < files.length; fi++) {
      const file = files[fi];
      const engines: PerEngineScan[] = [];

      for (const pid of runIds) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("provider", pid);
        try {
          const res = await fetch("/api/ai", { method: "POST", body: formData });
          const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          if (!res.ok) {
            const baseErr =
              typeof data.error === "string" ? data.error : "שגיאת שרת";
            const extra =
              data.code === "QUOTA_EXCEEDED" && typeof data.billingUrl === "string"
                ? ` — לרכישת בנדל או שדרוג: ${data.billingUrl}`
                : "";
            engines.push({
              providerId: pid,
              label: idToLabel.get(pid) ?? pid,
              ok: false,
              error: `${baseErr}${extra}`,
              score: 0,
            });
          } else {
            const ai = extractAiPayload(data);
            const notices: string[] = [];
            if (data._fromCache === true) {
              notices.push("תוצאה מהמטמון (לא נשלחה בקשה חדשה לספק)");
            }
            if (data._providerAdjusted === true && typeof data._provider === "string") {
              notices.push(`הספק בפועל: ${data._provider}`);
            }
            engines.push({
              providerId: pid,
              label: idToLabel.get(pid) ?? pid,
              ok: true,
              aiData: ai,
              notice: notices.length ? notices.join(" · ") : undefined,
              score: scoreExtractedDocument(ai),
            });
          }
        } catch {
          engines.push({
            providerId: pid,
            label: idToLabel.get(pid) ?? pid,
            ok: false,
            error: "שגיאת רשת",
            score: 0,
          });
        }
        doneOps += 1;
        setProgress(Math.round((doneOps / totalOps) * 100));
      }

      const t = file.type || "";
      const recommendedIndex = pickBestEngineIndex(engines);
      out.push({
        fileName: file.name,
        previewUrl: previewUrls[fi] ?? null,
        isPdf: t === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
        isImage: t.startsWith("image/"),
        engines,
        recommendedIndex,
      });
    }

    setCompareResults(out);
    setProcessing(false);
    return out;
  }, [files, previewUrls, scanEngineRows, selectedIds, status]);

  const scanActionsDisabled =
    processing || files.length === 0 || status !== "authenticated" || selectedIds.length === 0;

  const crystalActionClass =
    "border border-gray-200 bg-white text-gray-600 shadow-sm hover:border-indigo-500/40 hover:bg-indigo-500/15 transition-colors";

  const onSaveToDocumentInbox = async () => {
    const out = await executeMultiScan();
    if (out && out.length > 0) {
      router.push("/dashboard/erp");
    }
  };

  const onAssignToProject = async () => {
    const out = await executeMultiScan();
    if (out && out.length > 0) {
      router.push("/dashboard/crm");
    }
  };

  const onSaveAndNextDocument = async () => {
    const out = await executeMultiScan();
    if (!out || out.length === 0) return;
    setFiles((prev) => prev.slice(1));
    setCompareResults([]);
    setProgress(0);
  };

  const onCancelScanFlow = () => {
    if (processing) return;
    clearFiles();
  };

  const shellClass = `flex flex-col scroll-mt-24 bg-white relative overflow-hidden ${
    fillHeight
      ? "min-h-[min(92vh,860px)] flex-1 rounded-2xl border border-gray-200/80 p-6 shadow-sm md:p-8"
      : "min-h-[320px] rounded-2xl border border-gray-200/80 p-8 shadow-sm lg:p-10"
  }`;

  const dropIdle =
    "border-gray-200 bg-white/[0.03]/50 hover:bg-indigo-500/15 hover:border-indigo-500/40 transition-colors";

  const dropActive = "border-indigo-500 bg-indigo-500/15 scale-[0.995]";

  const steps = [
    { n: 1, t: "מנועים" },
    { n: 2, t: "קבצים" },
    { n: 3, t: "פענוח" },
    { n: 4, t: "השוואה" },
    { n: 5, t: "סיום" },
  ];

  return (
    <section id="erp-multi-scanner" className={shellClass} dir={dir}>
      {!compactHeader ? (
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15">
            <Brain className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-700">
              סורק ה-AI הרב-מנועי
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">
              {SCAN_ACCEPT_SUMMARY}. ניתן להעלות מספר קבצים יחד.
              בחר מנוע אחד או כולם — לאחר הפענוח תוצג השוואה והמלצה.
            </p>
          </div>
        </div>
      ) : null}

      {/* שלבים — שורה אחת */}
      <div className="mb-7 flex flex-nowrap items-center gap-0 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const done = s.n < activeStep;
          const current = s.n === activeStep;
          return (
            <div key={s.n} className="flex shrink-0 items-center">
              <div
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                  current
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : done
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "bg-white/[0.03] text-gray-400 border border-gray-100"
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  current ? "bg-white/20 text-white" : done ? "bg-emerald-100 text-emerald-400" : "bg-white/[0.08] text-gray-400"
                }`}>
                  {done ? <CheckCircle2 size={12} /> : s.n}
                </span>
                <span>{s.t}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-1 h-px w-5 ${done ? "bg-emerald-300" : "bg-white/[0.08]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* בחירת מנועים */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs font-black text-gray-600">מנועי פענוח:</span>
          <button
            type="button"
            onClick={selectAllEngines}
            className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-md"
          >
            בחל הכל
          </button>
          <button
            type="button"
            onClick={clearEngines}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:border-gray-300"
          >
            אפס
          </button>
          {scanEngineRows.length === 0 && providers.length === 0 && (
            <span className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
              <Loader2 size={12} className="animate-spin" />
              טוען מנועים…
            </span>
          )}
          {scanEngineRows.length > 0 && (
            <span className="text-[11px] font-medium text-gray-400">הבחירה נשמרת אוטומטית</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {scanEngineRows.map((p) => {
            const on = selectedIds.includes(p.id);
            const ok = canRunEngine(p);
            const reason = !p.configured
              ? "חסר מפתח API"
              : p.allowedByPlan === false
                ? "דורש שדרוג מנוי"
                : "";
            return (
              <button
                key={p.id}
                type="button"
                title={ok ? p.description : reason}
                disabled={!ok && !on}
                onClick={() => toggleProvider(p.id)}
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all duration-150 ${
                  !ok
                    ? "cursor-not-allowed border-dashed border-gray-200 bg-white/[0.03] text-gray-400 opacity-50"
                    : on
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.01]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-500/40 hover:bg-indigo-500/15 hover:text-indigo-300 hover:shadow-sm"
                }`}
              >
                <span className={`flex h-4.5 w-4.5 items-center justify-center`}>
                  <Sparkles size={13} className={on && ok ? "text-white" : "text-gray-400"} />
                </span>
                {p.label}
                {!ok ? <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-semibold text-gray-400">{!p.configured ? "לא מוגדר" : "מנוי"}</span> : null}
                {on && ok ? <span className="h-1.5 w-1.5 rounded-full bg-white/60" /> : null}
              </button>
            );
          })}
        </div>
        {selectedIds.length === 0 && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <AlertCircle size={12} />
            נדרש לבחור לפחות מנוע אחד לפני סריקה.
          </p>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 md:p-12 ${
          isDragActive ? dropActive : dropIdle
        }`}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {!processing ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/15 shadow-sm">
                <UploadCloud size={28} className="text-indigo-500" />
              </div>
              <p className="text-base font-black text-gray-600">
                {isDragActive ? "שחרר כאן לסריקה עכשיו" : "גרור קבצים לכאן, או לחץ לבחירה"}
              </p>
              <p className="mt-2 text-xs text-gray-400 font-medium">{SCAN_ACCEPT_SUMMARY}</p>
              {files.length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {files.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-3 py-1.5 text-[11px] font-bold text-indigo-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/15" />
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="busy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15">
                <Loader2 className="animate-spin text-indigo-400" size={28} />
              </div>
              <p className="text-sm font-bold text-gray-500">
                מריץ פענוח מול {eligibleSelectedCount} מנועים לכל קובץ…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ PRIMARY SCAN BUTTON ══ */}
      {files.length > 0 && !processing && compareResults.length === 0 && (
        <div className="mt-7 flex flex-col items-center gap-3">
          <motion.button
            type="button"
            disabled={scanActionsDisabled}
            onClick={() => void executeMultiScan()}
            whileHover={scanActionsDisabled ? undefined : { scale: 1.02 }}
            whileTap={scanActionsDisabled ? undefined : { scale: 0.98 }}
            className="w-full max-w-md rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-700 px-8 py-4 text-base font-black text-white shadow-lg shadow-indigo-600/30 transition-all hover:shadow-xl hover:shadow-indigo-600/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Sparkles size={20} />
            התחל סריקה — {files.length} {files.length === 1 ? "קובץ" : "קבצים"} × {eligibleSelectedCount} מנועים
          </motion.button>
          <button
            type="button"
            onClick={clearFiles}
            className="text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors"
          >
            נקה רשימת קבצים
          </button>
        </div>
      )}

      {files.length > 0 && !processing && compareResults.length === 0 && (
        <p className="mt-2 text-center text-xs text-gray-400">
          או בחרו פעולה ספציפית למטה (שמירה בתיבת מסמכים, שיוך לפרויקט...)
        </p>
      )}

      {status !== "authenticated" && (
        <p className="text-sm mt-3 text-indigo-400 font-semibold">
          נדרשת התחברות כדי להריץ סריקה.
        </p>
      )}

      {processing && (
        <div className="mt-7 space-y-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/15 p-5">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Loader2 size={12} className="animate-spin" />
              התקדמות פענוח
            </span>
            <span className="text-indigo-400 font-black">{progress}%</span>
          </div>
          <div className="w-full rounded-full h-2.5 overflow-hidden bg-indigo-100">
            <div className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* השוואה ותצוגה מקדימה */}
      {compareResults.length > 0 && (
        <div className="mt-8 space-y-6 text-gray-700">
          {compareResults.map((row, idx) => (
            <div
              key={`${row.fileName}-${idx}`}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md"
            >
              {/* File header */}
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100">
                  <Brain size={15} className="text-indigo-400" />
                </div>
                <p className="font-black text-white truncate text-sm">{row.fileName}</p>
              </div>
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                <div className="border-b border-gray-100 bg-white/[0.03]/40 p-5 lg:border-b-0 lg:border-e">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">תצוגה מקדימה</p>
                  {row.previewUrl && row.isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.previewUrl}
                      alt=""
                      className="max-h-64 w-full object-contain rounded-2xl border border-gray-100 shadow-sm"
                    />
                  ) : row.previewUrl && row.isPdf ? (
                    <iframe
                      title={row.fileName}
                      src={row.previewUrl}
                      className="w-full h-64 rounded-2xl border border-gray-100 bg-white shadow-sm"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white py-8">
                      <Brain size={20} className="text-white/25" />
                      <p className="text-xs text-gray-400">אין תצוגה מקדימה לסוג קובץ זה</p>
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">פענוח לפי מנוע</p>
                  {row.recommendedIndex >= 0 && row.engines[row.recommendedIndex]?.ok ? (
                    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 text-xs font-black flex items-center gap-2 text-emerald-800 shadow-sm">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      מומלץ: {row.engines[row.recommendedIndex].label} — ציון {row.engines[row.recommendedIndex].score}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-500/15 px-4 py-3 text-xs font-bold flex items-center gap-2 text-amber-800">
                      <AlertCircle size={16} className="text-amber-500 shrink-0" />
                      לא נמצאה תוצאה מוצלחת — בדוק מנוע או קובץ.
                    </div>
                  )}
                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {row.engines.map((e, ei) => {
                      const ai = e.aiData;
                      const vendor = ai && typeof ai.vendor === "string" ? ai.vendor : "—";
                      const docType = ai && typeof ai.docType === "string" ? ai.docType : "—";
                      const summary =
                        ai && typeof ai.summary === "string" ? ai.summary.slice(0, 280) : "—";
                      const total = ai?.total;
                      const totalStr =
                        typeof total === "number"
                          ? `₪${total.toLocaleString()}`
                          : typeof total === "string"
                            ? total
                            : "—";
                      const lines =
                        ai && Array.isArray(ai.lineItems) ? ai.lineItems.length : 0;
                      const rec = ei === row.recommendedIndex && e.ok;
                      return (
                        <div
                          key={`${e.providerId}-${ei}`}
                          className={`rounded-2xl border p-4 text-xs space-y-1.5 transition-all ${
                            rec ? "border-emerald-300 bg-emerald-500/15 shadow-sm" : "border-gray-100 bg-white/[0.03]/50"
                          }`}
                        >
                          <div className="flex justify-between gap-2 font-black">
                            <span className={rec ? "text-emerald-800" : "text-gray-600"}>{e.label}</span>
                            {e.ok ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-400">ציון {e.score}</span>
                            ) : (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-600">נכשל</span>
                            )}
                          </div>
                          {!e.ok ? (
                            <p className="text-rose-600 font-medium">{e.error}</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-1.5 mt-2">
                                <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-1.5">
                                  <p className="text-[9px] font-bold text-gray-400 mb-0.5">ספק</p>
                                  <p className="font-bold text-gray-700">{vendor}</p>
                                </div>
                                <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-1.5">
                                  <p className="text-[9px] font-bold text-gray-400 mb-0.5">סוג מסמך</p>
                                  <p className="font-bold text-gray-700">{docType}</p>
                                </div>
                                <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-1.5">
                                  <p className="text-[9px] font-bold text-gray-400 mb-0.5">סה״כ</p>
                                  <p className="font-black text-indigo-300">{totalStr}</p>
                                </div>
                                <div className="rounded-xl bg-white border border-gray-100 px-2.5 py-1.5">
                                  <p className="text-[9px] font-bold text-gray-400 mb-0.5">שורות</p>
                                  <p className="font-bold text-gray-700">{lines}</p>
                                </div>
                              </div>
                              <p className="italic text-gray-400 mt-1.5 leading-relaxed">{summary}</p>
                              {e.notice ? (
                                <p className="text-[10px] text-indigo-400 font-bold mt-1">{e.notice}</p>
                              ) : null}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          disabled={scanActionsDisabled}
          onClick={onSaveToDocumentInbox}
          whileHover={scanActionsDisabled ? undefined : { scale: 1.02 }}
          whileTap={scanActionsDisabled ? undefined : { scale: 0.98 }}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-bold text-gray-600 shadow-sm hover:border-indigo-500/40 hover:bg-indigo-500/15 hover:text-indigo-300 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {processing ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <Archive className="size-5 shrink-0 text-indigo-500" strokeWidth={1.75} />}
          שמירה בתיבת המסמכים
        </motion.button>
        <motion.button
          type="button"
          disabled={scanActionsDisabled}
          onClick={onAssignToProject}
          whileHover={scanActionsDisabled ? undefined : { scale: 1.02 }}
          whileTap={scanActionsDisabled ? undefined : { scale: 0.98 }}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-bold text-gray-600 shadow-sm hover:border-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-400 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {processing ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <FolderKanban className="size-5 shrink-0 text-emerald-500" strokeWidth={1.75} />}
          שיוך לפרויקט
        </motion.button>
        <motion.button
          type="button"
          disabled={scanActionsDisabled}
          onClick={onSaveAndNextDocument}
          whileHover={scanActionsDisabled ? undefined : { scale: 1.02 }}
          whileTap={scanActionsDisabled ? undefined : { scale: 0.98 }}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-bold text-gray-600 shadow-sm hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {processing ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <StepForward className="size-5 shrink-0 text-sky-500" strokeWidth={1.75} />}
          שמור והמשך למסמך הבא
        </motion.button>
        <motion.button
          type="button"
          disabled={processing}
          onClick={onCancelScanFlow}
          whileHover={processing ? undefined : { scale: 1.02 }}
          whileTap={processing ? undefined : { scale: 0.98 }}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XCircle className="size-5 shrink-0 text-rose-500" strokeWidth={1.75} />
          ביטול
        </motion.button>
      </div>
      {processing ? (
        <p className="mt-2 text-center text-xs font-medium text-gray-400">
          מריצים פענוח מול המנועים הנבחרים — כל כפתורי הפעולה משתמשים באותו פענוח, ואז ממשיכים לפי הבחירה שלך.
        </p>
      ) : null}
    </section>
  );
}
