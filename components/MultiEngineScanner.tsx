"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
import WizardContainer, { WizardStepConfig } from "./wizard/WizardContainer";
import { saveScannedDocumentAction } from "@/app/actions/save-scanned-document";

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

type ScannerProps = {
  variant?: Variant;
  provider?: string;
  fillHeight?: boolean;
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
  const { t, dir } = useI18n();
  const { status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compareResults, setCompareResults] = useState<FileCompareResult[]>([]);
  
  // WIZARD STATE
  const [wizardStep, setWizardStep] = useState(0);

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
      if (restored.length > 0) setSelectedIds(restored);
      else setSelectedIds(eligible.map((p) => p.id));
    } else {
      setSelectedIds(eligible.map((p) => p.id));
    }
  }, [scanEngineRows, provider]);

  useEffect(() => {
    if (!selectedIds.length) return;
    try {
      window.localStorage.setItem(SCANNER_PREFS_KEY, JSON.stringify(selectedIds));
    } catch {}
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
      urls.forEach((u) => { if (u) URL.revokeObjectURL(u); });
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

  const selectAllEngines = () => setSelectedIds(scanEngineRows.filter(canRunEngine).map((p) => p.id));
  const clearEngines = () => setSelectedIds([]);

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
        formData.append("persist", "false");
        try {
          const res = await fetch("/api/ai", { method: "POST", body: formData });
          const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
            if (!res.ok) {
              const baseErr = typeof data.error === "string" ? data.error : t("common.error");
              const extra = data.code === "QUOTA_EXCEEDED" && typeof data.billingUrl === "string"
                ? ` — ${t("landing.trialUpgrade")}: ${data.billingUrl}` : "";
              engines.push({ providerId: pid, label: idToLabel.get(pid) ?? pid, ok: false, error: `${baseErr}${extra}`, score: 0 });
            } else {
              const ai = extractAiPayload(data);
              const notices: string[] = [];
              if (data._fromCache === true) notices.push(t("dashboard.forecast.status"));
              if (data._providerAdjusted === true && typeof data._provider === "string") notices.push(`Provider: ${data._provider}`);
              engines.push({
                providerId: pid, label: idToLabel.get(pid) ?? pid, ok: true, aiData: ai,
                notice: notices.length ? notices.join(" · ") : undefined, score: scoreExtractedDocument(ai),
              });
            }
          } catch {
            engines.push({ providerId: pid, label: idToLabel.get(pid) ?? pid, ok: false, error: t("aiBubble.errorNetwork"), score: 0 });
          }
        doneOps += 1;
        setProgress(Math.round((doneOps / totalOps) * 100));
      }

      const t = file.type || "";
      const recommendedIndex = pickBestEngineIndex(engines);
      out.push({
        fileName: file.name, previewUrl: previewUrls[fi] ?? null,
        isPdf: t === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
        isImage: t.startsWith("image/"), engines, recommendedIndex,
      });
    }

    setCompareResults(out);
    setProcessing(false);
    return out;
  }, [files, previewUrls, scanEngineRows, selectedIds, status]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setCompareResults([]);
  }, []);

  const clearFiles = () => {
    setFiles([]);
    setCompareResults([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: true, accept: DROPZONE_ACCEPT,
  });

  const onCancelScanFlow = () => {
    if (processing) return;
    clearFiles();
    setWizardStep(0);
  };

  const handleWizardStepChange = async (newIdx: number) => {
    if (newIdx === 2 && wizardStep === 1) { 
      // User moving from Files to Processing/Results
      setWizardStep(2);
      const out = await executeMultiScan();
      if (out && out.length > 0) {
        setWizardStep(3); // Results Step
      } else {
        setWizardStep(1); // Failed, return to files
      }
      return;
    }
    setWizardStep(newIdx);
  };

  const scanActionsDisabled = processing || files.length === 0 || status !== "authenticated" || selectedIds.length === 0;

  // -- UI BITS --

  const enginesUI = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-sm font-black text-slate-700">{t("scanner.configAi")}:</span>
        <button type="button" onClick={selectAllEngines} className="btn-primary py-1.5 px-3 text-xs">{t("cookie.acceptAll")}</button>
        <button type="button" onClick={clearEngines} className="btn-secondary py-1.5 px-3 text-xs">{t("cookie.ariaReject")}</button>
        {scanEngineRows.length === 0 && providers.length === 0 && (
          <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium"><Loader2 size={12} className="animate-spin" /> {t("common.loading")}</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {scanEngineRows.map((p) => {
          const on = selectedIds.includes(p.id);
          const ok = canRunEngine(p);
          const reason = !p.configured ? "חסר מפתח API" : p.allowedByPlan === false ? "דורש שדרוג מנוי" : "";
          return (
            <button
              key={p.id}
              type="button"
              title={ok ? p.description : reason}
              disabled={!ok && !on}
              onClick={() => toggleProvider(p.id)}
              className={`group flex items-start text-start gap-3 rounded-2xl border p-4 transition-all duration-150 ${
                !ok ? "cursor-not-allowed border-dashed border-slate-200 bg-slate-50 opacity-50"
                  : on ? "border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              } ${p.id === 'docai' ? 'relative overflow-hidden' : ''}`}
            >
              {p.id === 'docai' && ok && (
                <div className="absolute top-0 right-0 bg-blue-600 text-[8px] font-black text-white px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter">PREMIUM</div>
              )}
              <div className={`mt-0.5 flex shrink-0 h-5 w-5 items-center justify-center rounded-full transition-colors ${on && ok ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                {on && ok ? <CheckCircle2 size={12} strokeWidth={3} /> : p.id === 'docai' ? <Sparkles size={12} className="text-blue-400" /> : <Brain size={12} />}
              </div>
              <div>
                <div className={`font-bold transition-colors ${on && ok ? "text-blue-900" : "text-slate-900"}`}>{p.label}</div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">{ok ? (p.description || t("nav.solutionsDesc")) : (p.allowedByPlan === false ? t("layout.trialUpgrade") : t("scanner.noEngines"))}</div>
              </div>
            </button>
          );
        })}
      </div>
      {selectedIds.length === 0 ? (
        <div className="flex items-center gap-2 p-3 text-sm text-amber-700 bg-amber-50 rounded-xl border border-amber-200 font-medium">
          <AlertCircle size={16} /> נדרש לבחור לפחות מנוע אחד לפני התקדמות.
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 text-sm text-blue-700 bg-blue-50 rounded-xl border border-blue-200 font-medium">
          <CheckCircle2 size={16} /> נבחרו {eligibleSelectedCount} מנועים לסריקה יחד.
        </div>
      )}
    </div>
  );

  const filesUI = (
    <div className="space-y-6">
      <div {...getRootProps()} className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 md:p-12 min-h-[240px] cursor-pointer ${
        isDragActive ? "border-blue-500 bg-blue-50 scale-[0.99]" : "border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300"
      }`}>
        <input {...getInputProps()} />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100">
          <UploadCloud size={28} className="text-blue-500" />
        </div>
        <p className="text-lg font-black text-slate-700">{isDragActive ? t("scanner.drop") : t("scanner.dropDark")}</p>
        <p className="mt-2 text-sm text-slate-500">{SCAN_ACCEPT_SUMMARY}</p>
      </div>

      {files.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-700 flex justify-between items-center">
            <span>{t("scanner.filesQueued")} ({files.length})</span>
            <button onClick={clearFiles} className="text-xs text-rose-500 hover:underline font-normal">{t("cookie.ariaReject")}</button>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center text-blue-600"><Archive size={14} /></div>
                  <span className="font-semibold text-slate-700 truncate max-w-xs">{f.name}</span>
                </div>
                <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const processingUI = (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur bg-blue-300 animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl border border-blue-100">
          <Brain className="text-blue-600 animate-bounce" size={40} />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-800">{t("aiBubble.writing")}</h3>
        <p className="text-slate-500 mt-2 font-medium max-w-md mx-auto">
          {t("scanner.processing")}
        </p>
      </div>
      
      <div className="w-full max-w-md bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner mt-4">
        <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(5, progress)}%` }} />
      </div>
      <p className="text-blue-600 font-bold text-sm">{progress}%</p>
    </div>
  );

  const resultsUI = (
    <div className="space-y-8">
      {compareResults.map((row, idx) => (
        <div key={`${row.fileName}-${idx}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Brain size={18} /></div>
            <p className="font-black text-slate-900 truncate">{row.fileName}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2">
             <div className="border-b lg:border-b-0 lg:border-e border-slate-200 bg-slate-50/50 p-5">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">{t("scanner.preview")}</p>
                {row.previewUrl && row.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.previewUrl} alt="" className="max-h-80 w-full object-contain rounded-xl border border-slate-200 shadow-sm bg-white" />
                ) : row.previewUrl && row.isPdf ? (
                  <iframe title={row.fileName} src={row.previewUrl} className="w-full h-80 rounded-xl border border-slate-200 bg-white shadow-sm" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-16"><Brain size={24} className="text-slate-300" /><p className="text-sm text-slate-400">{t("scanner.noPreview")}</p></div>
                )}
             </div>
             <div className="p-5 space-y-4">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">{t("scanner.results")}</p>
                {row.recommendedIndex >= 0 && row.engines[row.recommendedIndex]?.ok ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold flex items-center gap-2 text-emerald-800 shadow-sm">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    {t("landing.featureFlowTitle")}: {row.engines[row.recommendedIndex].label} (Score {row.engines[row.recommendedIndex].score})
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold flex items-center gap-2 text-amber-800">
                    <AlertCircle size={18} className="text-amber-500 shrink-0" />
                    {t("aiBubble.errorGeneric")}
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {row.engines.map((e, ei) => {
                     const ai = e.aiData;
                     const vendor = ai && typeof ai.vendor === "string" ? ai.vendor : "—";
                     const docType = ai && typeof ai.docType === "string" ? ai.docType : "—";
                     const total = ai && typeof ai.total === "number" ? `₪${ai.total.toLocaleString()}` : typeof ai?.total === "string" ? ai.total : "—";
                     const rec = ei === row.recommendedIndex && e.ok;
                     
                     return (
                        <div key={ei} className={`rounded-xl border p-4 text-sm transition-all ${rec ? "border-emerald-300 bg-white shadow-sm ring-1 ring-emerald-100" : "border-slate-200 bg-slate-50"}`}>
                           <div className="flex justify-between font-black mb-2">
                             <span className={rec ? "text-emerald-700" : "text-slate-700"}>{e.label}</span>
                             {e.ok ? <span className="rounded-md bg-slate-100 font-bold px-2 py-0.5 text-xs text-slate-600">ציון {e.score}</span> : <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">שגיאה</span>}
                           </div>
                           {!e.ok ? <p className="text-rose-600 font-medium text-xs">{e.error}</p> : (
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                 <div className="bg-white rounded-lg border border-slate-100 p-2 text-center text-xs">
                                    <div className="text-[10px] text-slate-400 font-black mb-1">{t("scanner.source")}</div>
                                    <div className="font-bold text-slate-800 truncate">{vendor}</div>
                                 </div>
                                 <div className="bg-white rounded-lg border border-slate-100 p-2 text-center text-xs">
                                    <div className="text-[10px] text-slate-400 font-black mb-1">{t("scanner.document")}</div>
                                    <div className="font-bold text-slate-800 truncate">{docType}</div>
                                 </div>
                                 <div className="bg-white rounded-lg border border-slate-100 p-2 text-center text-xs">
                                    <div className="text-[10px] text-slate-400 font-black mb-1">{t("erp.total")}</div>
                                    <div className="font-bold text-blue-600">{total}</div>
                                 </div>
                              </div>
                           )}
                        </div>
                     )
                  })}
                </div>
             </div>
          </div>
        </div>
      ))}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
        <button
          onClick={async () => {
            setProcessing(true);
            for (const row of compareResults) {
              const best = row.engines[row.recommendedIndex];
              if (best?.ok && best.aiData) {
                await saveScannedDocumentAction(row.fileName, best.aiData, "ERP");
              }
            }
            setProcessing(false);
            router.push("/dashboard/erp");
          }}
          disabled={processing || compareResults.length === 0}
          className="btn-primary py-4 text-base shadow-lg shadow-blue-600/20"
        >
          {processing ? <Loader2 className="animate-spin inline mr-2" size={20} /> : <Archive size={20} className="mr-2 inline" />}
          {t("erp.saveToErp")}
        </button>
        <button
          onClick={async () => {
            setProcessing(true);
            for (const row of compareResults) {
              const best = row.engines[row.recommendedIndex];
              if (best?.ok && best.aiData) {
                await saveScannedDocumentAction(row.fileName, best.aiData, "CRM");
              }
            }
            setProcessing(false);
            router.push("/dashboard/crm");
          }}
          disabled={processing || compareResults.length === 0}
          className="btn-secondary py-4 text-base bg-white"
        >
          {processing ? <Loader2 className="animate-spin inline mr-2" size={20} /> : <FolderKanban size={20} className="mr-2 inline" />}
          {t("erp.saveToCrm")}
        </button>
      </div>
    </div>
  );

  const steps: WizardStepConfig[] = [
    { id: "engines", title: "בחירת מנועים", subtitle: "ספקי AI שיבצעו את הסריקה", content: enginesUI, canAdvance: selectedIds.length > 0 },
    { id: "files", title: "העלאת קבצים", subtitle: "גרירת מסמכים סרוקים", content: filesUI, canAdvance: files.length > 0 && status === "authenticated" },
    { id: "processing", title: "עיבוד נתונים", subtitle: "פענוח באמצעות AI", content: processingUI, canAdvance: false },
    { id: "results", title: "תוצאות ופעולות", subtitle: "השוואת מנועים ושמירה למערכת", content: resultsUI, canAdvance: true }
  ];

  return (
    <div className={fillHeight ? "min-h-[min(92vh,860px)]" : ""}>
      <WizardContainer 
        title="אשף סריקה ובקרה (Vision AI)" 
        subtitle="תהליך חכם לסריקת חשבוניות, פירוק נתונים אוטומטי ושיוך למערך התשלומים וה-CRM שלך מתבסס על AI"
        icon={<Brain />}
        steps={steps}
        currentStepIndex={wizardStep}
        onStepChange={handleWizardStepChange}
        finishLabel="סרוק מסמכים נוספים"
        onFinish={onCancelScanFlow}
      />
    </div>
  );
}
