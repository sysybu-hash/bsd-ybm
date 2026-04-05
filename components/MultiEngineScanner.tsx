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
    "border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/60 transition-colors";

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
    "border-gray-200 bg-gray-50/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-colors";

  const dropActive = "border-indigo-500 bg-indigo-50/40 scale-[0.995]";

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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
            <Brain className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">
              סורק ה-AI הרב-מנועי
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              {SCAN_ACCEPT_SUMMARY}. ניתן להעלות מספר קבצים יחד.
              בחר מנוע אחד או כולם — לאחר הפענוח תוצג השוואה והמלצה.
            </p>
          </div>
        </div>
      ) : null}

      {/* שלבים — שורה אחת */}
      <div className="mb-6 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const done = s.n < activeStep;
          const current = s.n === activeStep;
          return (
            <div key={s.n} className="flex shrink-0 items-center">
              <div
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  current
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : done
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <span>{done ? <CheckCircle2 size={13} /> : s.n}</span>
                <span>{s.t}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-1 h-px w-4 ${done ? "bg-emerald-300" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* בחירת מנועים */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs font-bold text-gray-500">מנועי פענוח:</span>
          <button
            type="button"
            onClick={selectAllEngines}
            className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
          >
            כל המנועים
          </button>
          <button
            type="button"
            onClick={clearEngines}
            className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-50"
          >
            נקה
          </button>
          {scanEngineRows.length === 0 && providers.length === 0 && (
            <span className="text-xs text-indigo-500">טוען רשימת מנועים…</span>
          )}
          {scanEngineRows.length > 0 && (
            <span className="text-[11px] font-semibold text-gray-400">בחירת המנועים נשמרת אוטומטית להמשך</span>
          )}
        </div>
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {scanEngineRows.map((p) => {
            const on = selectedIds.includes(p.id);
            const ok = canRunEngine(p);
            const reason = !p.configured
              ? "חסר מפתח API בשרת"
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
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                  !ok
                    ? "cursor-not-allowed border-dashed border-gray-200 bg-gray-50 text-gray-400 opacity-60"
                    : on
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <Sparkles size={14} className={on && ok ? "opacity-100" : "opacity-40"} />
                {p.label}
                {!ok ? <span className="text-[9px] font-medium opacity-80">({!p.configured ? "לא מוגדר" : "מנוי"})</span> : null}
              </button>
            );
          })}
        </div>
        {selectedIds.length === 0 && (
          <p className="text-xs font-semibold text-red-500">נדרש לבחור לפחות מנוע אחד לפני סריקה.</p>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 md:p-10 ${
          isDragActive ? dropActive : dropIdle
        }`}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {!processing ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
                <UploadCloud size={24} className="text-indigo-400" />
              </div>
              <p className="font-semibold text-gray-600">גרור קבצים או לחץ לבחירה</p>
              <p className="mt-1 text-xs text-gray-400">{SCAN_ACCEPT_SUMMARY}</p>
              {files.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {files.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700"
                    >
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
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="animate-spin text-indigo-500" size={36} />
              <p className="text-sm text-gray-500">
                מריץ פענוח מול {eligibleSelectedCount} מנועים לכל קובץ…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ PRIMARY SCAN BUTTON ══ */}
      {files.length > 0 && !processing && compareResults.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <motion.button
            type="button"
            disabled={scanActionsDisabled}
            onClick={() => void executeMultiScan()}
            whileHover={scanActionsDisabled ? undefined : { scale: 1.03 }}
            whileTap={scanActionsDisabled ? undefined : { scale: 0.97 }}
            className="w-full max-w-md rounded-2xl bg-indigo-600 px-8 py-4 text-base font-black text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Sparkles size={20} />
            התחל סריקה ({files.length} {files.length === 1 ? "קובץ" : "קבצים"} × {eligibleSelectedCount} מנועים)
          </motion.button>
          <button
            type="button"
            onClick={clearFiles}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
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
        <p className="text-sm mt-3 text-indigo-600 font-semibold">
          נדרשת התחברות כדי להריץ סריקה.
        </p>
      )}

      {processing && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">התקדמות פענוח</span>
            <span className="text-gray-700">{progress}%</span>
          </div>
          <div className="w-full rounded-full h-2 overflow-hidden bg-gray-100">
            <div className="h-full transition-all duration-300 bg-indigo-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* השוואה ותצוגה מקדימה */}
      {compareResults.length > 0 && (
        <div className="mt-8 space-y-6 text-gray-800">
          {compareResults.map((row, idx) => (
            <div
              key={`${row.fileName}-${idx}`}
              className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
            >
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                <div className="border-b border-gray-100 bg-gray-50/40 p-5 lg:border-b-0 lg:border-l">
                  <p className="mb-2 text-xs font-bold text-gray-400">תצוגה מקדימה</p>
                  <p className="mb-3 truncate text-sm font-bold text-gray-700" title={row.fileName}>
                    {row.fileName}
                  </p>
                  {row.previewUrl && row.isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.previewUrl}
                      alt=""
                      className="max-h-64 w-full object-contain rounded-2xl border border-gray-100"
                    />
                  ) : row.previewUrl && row.isPdf ? (
                    <iframe
                      title={row.fileName}
                      src={row.previewUrl}
                      className="w-full h-64 rounded-2xl border border-gray-100 bg-white"
                    />
                  ) : (
                    <p className="text-xs text-gray-500">אין תצוגה מקדימה לסוג קובץ זה — העמודה מציגה רק את הפענוח.</p>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-xs font-black text-gray-500">פענוח לפי מנוע (עברית)</p>
                  {row.recommendedIndex >= 0 && row.engines[row.recommendedIndex]?.ok ? (
                    <div
                      className="rounded-2xl px-3 py-2 text-xs font-black flex items-center gap-2 bg-emerald-100 text-emerald-900"
                    >
                      <CheckCircle2 size={16} />
                      מומלץ: {row.engines[row.recommendedIndex].label} (ציון {row.engines[row.recommendedIndex].score})
                    </div>
                  ) : (
                    <div
                      className="rounded-2xl px-3 py-2 text-xs font-bold flex items-center gap-2 bg-indigo-50 text-indigo-800"
                    >
                      <AlertCircle size={16} />
                      לא נמצאה תוצאה מוצלחת — בדוק מנוע או קובץ.
                    </div>
                  )}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
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
                          className={`rounded-2xl border p-3 text-xs space-y-1 ${
                            rec ? "border-emerald-300 bg-emerald-50/80" : "border-gray-100 bg-white"
                          }`}
                        >
                          <div className="flex justify-between gap-2 font-black">
                            <span>{e.label}</span>
                            {e.ok ? (
                              <span className="text-emerald-600">ציון {e.score}</span>
                            ) : (
                              <span className="text-rose-600">נכשל</span>
                            )}
                          </div>
                          {!e.ok ? (
                            <p className="text-rose-600 font-medium">{e.error}</p>
                          ) : (
                            <>
                              <p>
                                <strong>ספק:</strong> {vendor}
                              </p>
                              <p>
                                <strong>סוג מסמך:</strong> {docType}
                              </p>
                              <p>
                                <strong>סה״כ:</strong> {totalStr}
                              </p>
                              <p>
                                <strong>שורות מוצר:</strong> {lines}
                              </p>
                              <p className="italic text-gray-600">
                                <strong>תקציר:</strong> {summary}
                              </p>
                              {e.notice ? (
                                <p className="text-[10px] text-indigo-700 font-medium">{e.notice}</p>
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
          className={`rounded-2xl px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${crystalActionClass}`}
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
          className={`rounded-2xl px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${crystalActionClass}`}
        >
          {processing ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <FolderKanban className="size-5 shrink-0 text-indigo-500" strokeWidth={1.75} />}
          שיוך לפרויקט
        </motion.button>
        <motion.button
          type="button"
          disabled={scanActionsDisabled}
          onClick={onSaveAndNextDocument}
          whileHover={scanActionsDisabled ? undefined : { scale: 1.02 }}
          whileTap={scanActionsDisabled ? undefined : { scale: 0.98 }}
          className={`rounded-2xl px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${crystalActionClass}`}
        >
          {processing ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <StepForward className="size-5 shrink-0 text-indigo-500" strokeWidth={1.75} />}
          שמור והמשך למסמך הבא
        </motion.button>
        <motion.button
          type="button"
          disabled={processing}
          onClick={onCancelScanFlow}
          whileHover={processing ? undefined : { scale: 1.02 }}
          whileTap={processing ? undefined : { scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XCircle className="size-5 shrink-0 text-rose-600" strokeWidth={1.75} />
          ביטול
        </motion.button>
      </div>
      {processing ? (
        <p className="mt-2 text-center text-xs font-medium text-gray-500">
          מריצים פענוח מול המנועים הנבחרים — כל כפתורי הפעולה משתמשים באותו פענוח, ואז ממשיכים לפי הבחירה שלך.
        </p>
      ) : null}
    </section>
  );
}
