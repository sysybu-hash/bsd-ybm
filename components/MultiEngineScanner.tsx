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

const primary = "var(--primary-color, #3b82f6)";

type ScannerProps = {
  variant?: Variant;
  /** ברירת מחדל ממרכז AI — מגדיר סט התחלתי של מנועים (לרוב מנוע יחיד) */
  provider?: string;
  /** פריסה גבוהה יותר (מסך מלא מבועת הסריקה) */
  fillHeight?: boolean;
  /** כותרת חיצונית קומהקטית */
  compactHeader?: boolean;
};

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
    if (provider) {
      const hit = scanEngineRows.find((p) => p.id === provider);
      if (hit && canRunEngine(hit)) setSelectedIds([hit.id]);
      else setSelectedIds(eligible.map((p) => p.id));
    } else {
      setSelectedIds(eligible.map((p) => p.id));
    }
  }, [scanEngineRows, provider]);

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
    "border border-amber-300/50 bg-white/80 text-slate-900 shadow-lg shadow-amber-200/20 backdrop-blur-xl hover:border-amber-400 hover:bg-amber-50/90";

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

  const shellClass = `flex flex-col rounded-[2rem] scroll-mt-24 bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden ${
    fillHeight ? "min-h-[min(92vh,860px)] flex-1 p-6 md:p-8" : "min-h-[320px] rounded-[3rem] p-10"
  }`;

  const dropIdle = "border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200";

  const dropActive = "border-blue-500 bg-blue-50/50 scale-[0.99]";

  const steps = [
    { n: 1, t: "מנועים" },
    { n: 2, t: "קבצים" },
    { n: 3, t: "פענוח" },
    { n: 4, t: "השוואה" },
    { n: 5, t: "סיום" },
  ];

  return (
    <section id="erp-multi-scanner" className={shellClass} dir="rtl">
      {!compactHeader ? (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="p-3 rounded-2xl bg-blue-50">
            <Brain style={{ color: primary }} size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter" style={{ color: primary }}>
              סורק ה-AI הרב-מנועי
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {SCAN_ACCEPT_SUMMARY}. ניתן להעלות <strong>מספר קבצים יחד</strong> (ארכיון מהמחשב).
              בחר מנוע אחד, כמה מנועים, או כולם — לאחר מכן תוצג השוואה בעברית והמלצה.
            </p>
          </div>
        </div>
      ) : null}

      {/* שלבים — שורה אחת */}
      <div className="flex flex-nowrap items-center gap-2 mb-6 overflow-x-auto pb-1 w-full">
        {steps.map((s) => {
          const done = s.n < activeStep;
          const current = s.n === activeStep;
          return (
            <div
              key={s.n}
              className={`flex items-center gap-2 shrink-0 rounded-full px-3 py-1.5 text-xs font-black border ${
                current
                  ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-300/50"
                  : done
                    ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              <span className="opacity-80">{done ? "✓" : s.n}</span>
              <span>{s.t}</span>
            </div>
          );
        })}
      </div>

      {/* בחירת מנועים — שורה אחת עם גלילה */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500 shrink-0">מנועי פענוח:</span>
          <button
            type="button"
            onClick={selectAllEngines}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-700 text-white hover:bg-amber-800"
          >
            כל המנועים
          </button>
          <button
            type="button"
            onClick={clearEngines}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            נקה
          </button>
          {scanEngineRows.length === 0 && providers.length === 0 && (
            <span className="text-xs text-amber-600">טוען רשימת מנועים…</span>
          )}
        </div>
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 w-full">
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
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold border transition-all ${
                  !ok
                    ? "opacity-55 cursor-not-allowed border-dashed border-slate-300 text-slate-500 bg-slate-100"
                    : on
                      ? "bg-blue-600 text-white border-blue-500 shadow-md"
                      : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <Sparkles size={14} className={on && ok ? "opacity-100" : "opacity-50"} />
                {p.label}
                {!ok ? <span className="text-[9px] font-medium opacity-80">({!p.configured ? "לא מוגדר" : "מנוי"})</span> : null}
              </button>
            );
          })}
        </div>
        {selectedIds.length === 0 ? (
          <p className="text-xs text-rose-600 font-bold">נדרש לבחור לפחות מנוע אחד לפני סריקה.</p>
        ) : null}
      </div>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-[2rem] p-8 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer md:p-12 min-h-[200px] ${
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
              <>
                <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-50">
                  <UploadCloud size={28} className="text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium">גרור קבצים או לחץ לבחירה</p>
              </>
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {files.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200/80 text-slate-700"
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
              <Loader2 className="animate-spin text-blue-500" size={40} />
              <p className="text-slate-600 text-sm">
                מריץ פענוח מול {eligibleSelectedCount} מנועים לכל קובץ…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {files.length > 0 && !processing && (
        <button
          type="button"
          onClick={clearFiles}
          className="mt-2 text-xs font-bold underline text-slate-500"
        >
          נקה רשימת קבצים
        </button>
      )}

      {status !== "authenticated" && (
        <p className="text-sm mt-3 text-amber-700">
          נדרשת התחברות כדי להריץ סריקה.
        </p>
      )}

      {processing && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">התקדמות פענוח</span>
            <span className="text-slate-700">{progress}%</span>
          </div>
          <div className="w-full rounded-full h-2 overflow-hidden bg-slate-100">
            <div className="h-full transition-all duration-300 bg-blue-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* השוואה ותצוגה מקדימה */}
      {compareResults.length > 0 && (
        <div className="mt-8 space-y-8 text-slate-800">
          {compareResults.map((row, idx) => (
            <div
              key={`${row.fileName}-${idx}`}
              className="rounded-3xl border overflow-hidden border-slate-200 bg-slate-50/50"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="p-4 border-b lg:border-b-0 lg:border-l border-slate-200 bg-white">
                  <p className="text-xs font-black text-slate-500 mb-2">תצוגה מקדימה</p>
                  <p className="text-sm font-bold mb-2 truncate" title={row.fileName}>
                    {row.fileName}
                  </p>
                  {row.previewUrl && row.isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.previewUrl}
                      alt=""
                      className="max-h-64 w-full object-contain rounded-2xl border border-slate-100"
                    />
                  ) : row.previewUrl && row.isPdf ? (
                    <iframe
                      title={row.fileName}
                      src={row.previewUrl}
                      className="w-full h-64 rounded-2xl border border-slate-100 bg-white"
                    />
                  ) : (
                    <p className="text-xs text-slate-500">אין תצוגה מקדימה לסוג קובץ זה — העמודה מציגה רק את הפענוח.</p>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-xs font-black text-slate-500">פענוח לפי מנוע (עברית)</p>
                  {row.recommendedIndex >= 0 && row.engines[row.recommendedIndex]?.ok ? (
                    <div
                      className="rounded-2xl px-3 py-2 text-xs font-black flex items-center gap-2 bg-emerald-100 text-emerald-900"
                    >
                      <CheckCircle2 size={16} />
                      מומלץ: {row.engines[row.recommendedIndex].label} (ציון {row.engines[row.recommendedIndex].score})
                    </div>
                  ) : (
                    <div
                      className="rounded-2xl px-3 py-2 text-xs font-bold flex items-center gap-2 bg-amber-50 text-amber-900"
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
                            rec ? "border-emerald-300 bg-emerald-50/80" : "border-slate-100 bg-white"
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
                              <p className="italic text-slate-600">
                                <strong>תקציר:</strong> {summary}
                              </p>
                              {e.notice ? (
                                <p className="text-[10px] text-blue-700 font-medium">{e.notice}</p>
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

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          disabled={scanActionsDisabled}
          onClick={onSaveToDocumentInbox}
          whileHover={scanActionsDisabled ? undefined : { scale: 1.02 }}
          whileTap={scanActionsDisabled ? undefined : { scale: 0.98 }}
          className={`rounded-2xl px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${crystalActionClass}`}
        >
          {processing ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <Archive className="size-5 shrink-0 text-amber-600" strokeWidth={1.75} />}
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
          {processing ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <FolderKanban className="size-5 shrink-0 text-amber-600" strokeWidth={1.75} />}
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
          {processing ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <StepForward className="size-5 shrink-0 text-amber-600" strokeWidth={1.75} />}
          שמור והמשך למסמך הבא
        </motion.button>
        <motion.button
          type="button"
          disabled={processing}
          onClick={onCancelScanFlow}
          whileHover={processing ? undefined : { scale: 1.02 }}
          whileTap={processing ? undefined : { scale: 0.98 }}
          className="rounded-2xl px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-300 hover:bg-rose-100"
        >
          <XCircle className="size-5 shrink-0 text-rose-600" strokeWidth={1.75} />
          ביטול
        </motion.button>
      </div>
      {processing ? (
        <p className="mt-2 text-center text-xs font-medium text-slate-500">
          מריצים פענוח מול המנועים הנבחרים — כל כפתורי הפעולה משתמשים באותו פענוח, ואז ממשיכים לפי הבחירה שלך.
        </p>
      ) : null}
    </section>
  );
}
