"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
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
  XCircle,
  Zap,
  ChevronRight,
  Target,
  FileSearch,
  Settings2
} from "lucide-react";

import { DROPZONE_ACCEPT, SCAN_ACCEPT_SUMMARY } from "@/lib/scan-mime";
import { pickBestEngineIndex, scoreExtractedDocument } from "@/lib/score-scan-result";
import { useI18n } from "@/components/I18nProvider";
import WizardContainer, { WizardStepConfig } from "./wizard/WizardContainer";
import { saveScannedDocumentAction } from "@/app/actions/save-scanned-document";
import { 
  getIndustryConfig,
  IndustryType, 
  AnalysisType 
} from "@/lib/professions/config";
import * as LucideIcons from "lucide-react";

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
  analysisType: string;
};

type ScannerProps = {
  industry?: IndustryType; // Optional override, otherwise fetched from session
  compactHeader?: boolean;
};

const SCANNER_PREFS_KEY = "bsd-erp:scanner:selected-engines";

export default function MultiEngineScanner({
  industry: industryOverride,
  compactHeader = false,
}: ScannerProps) {
  const { t } = useI18n();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Modular Data based on industry
  const userIndustry = (industryOverride || (session?.user as any)?.organization?.industry || "GENERAL") as IndustryType;
  const config = getIndustryConfig(userIndustry);
  
  // Icon resolution from name
  const ActiveIcon = (LucideIcons as any)[config.iconName] || LucideIcons.Bot;

  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string>(config.scanner.analysisTypes[0]?.id || "INVOICE");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compareResults, setCompareResults] = useState<FileCompareResult[]>([]);
  
  const [wizardStep, setWizardStep] = useState(0);

  const scanEngineRows = useMemo(
    () => providers.filter((p) => p.supportsDocumentScan),
    [providers],
  );

  // Fetch Providers
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
    return () => { cancelled = true; };
  }, []);

  // Restore selections
  useEffect(() => {
    if (!scanEngineRows.length) return;
    const eligible = scanEngineRows.filter(canRunEngine);
    let stored: string[] = [];
    try {
      const raw = window.localStorage.getItem(SCANNER_PREFS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) stored = parsed;
    } catch { stored = []; }

    if (stored.length > 0) {
      const restored = stored.filter(id => scanEngineRows.some(p => p.id === id && canRunEngine(p)));
      if (restored.length > 0) setSelectedIds(restored);
      else setSelectedIds(eligible.slice(0, 2).map(p => p.id));
    } else {
      setSelectedIds(eligible.slice(0, 2).map(p => p.id));
    }
  }, [scanEngineRows]);

  // Handle URL creation for previews
  useEffect(() => {
    const urls = files.map(f => {
      if (f.type.startsWith("image/") || f.type === "application/pdf") return URL.createObjectURL(f);
      return null;
    });
    setPreviewUrls(urls);
    return () => urls.forEach(u => u && URL.revokeObjectURL(u));
  }, [files]);

  const toggleProvider = (id: string) => {
    const row = scanEngineRows.find(p => p.id === id);
    if (!row || !canRunEngine(row)) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: true, accept: DROPZONE_ACCEPT,
  });

  const executeMultiScan = async (): Promise<FileCompareResult[] | null> => {
    if (files.length === 0 || authStatus !== "authenticated") return null;
    const runIds = selectedIds.filter(id => scanEngineRows.find(x => x.id === id && canRunEngine(x)));
    if (runIds.length === 0) return null;

    setProcessing(true);
    setProgress(0);
    
    const out: FileCompareResult[] = [];
    const totalOps = files.length * runIds.length;
    let doneOps = 0;

    for (let fi = 0; fi < files.length; fi++) {
      const file = files[fi];
      const engines: PerEngineScan[] = [];

      for (const pid of runIds) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("provider", pid);
        formData.append("persist", "false");
        formData.append("industry", userIndustry);
        formData.append("analysisType", activeAnalysisId);

        try {
          const res = await fetch("/api/ai", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) {
            engines.push({ providerId: pid, label: pid, ok: false, error: data.error || "Error", score: 0 });
          } else {
            const ai = data.aiData || data;
            engines.push({
              providerId: pid, label: pid, ok: true, aiData: ai,
              score: scoreExtractedDocument(ai),
            });
          }
        } catch {
          engines.push({ providerId: pid, label: pid, ok: false, error: "Network Error", score: 0 });
        }
        doneOps++;
        setProgress(Math.round((doneOps / totalOps) * 100));
      }

      out.push({
        fileName: file.name, previewUrl: previewUrls[fi],
        isPdf: file.type === "application/pdf" || file.name.endsWith(".pdf"),
        isImage: file.type.startsWith("image/"),
        engines, recommendedIndex: pickBestEngineIndex(engines),
        analysisType: activeAnalysisId
      });
    }

    setCompareResults(out);
    setProcessing(false);
    return out;
  };

  const handleWizardStepChange = async (newIdx: number) => {
    if (newIdx === 3 && wizardStep === 2) {
      setWizardStep(3);
      const res = await executeMultiScan();
      if (res && res.length > 0) setWizardStep(4);
      else setWizardStep(2);
      return;
    }
    setWizardStep(newIdx);
  };

  // --- UI STEPS ---

  const modeUI = (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {config.scanner.analysisTypes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveAnalysisId(mode.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all group ${
              activeAnalysisId === mode.id 
                ? "border-blue-600 bg-blue-50/50 shadow-xl ring-4 ring-blue-500/10" 
                : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg"
            }`}
          >
            <div className={`p-4 rounded-2xl mb-4 transition-colors ${activeAnalysisId === mode.id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"}`}>
               <Target size={28} />
            </div>
            <h4 className="font-black text-slate-900 mb-1">{mode.label}</h4>
            <p className="text-[10px] font-bold text-slate-400 text-center leading-tight">{mode.description}</p>
          </button>
        ))}
      </div>
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
         <Sparkles className="text-amber-500" size={18} />
         <p className="text-xs font-bold text-slate-600">
           מודל ה-AI יונחה לבצע פענוח מותאם אישית עבור {config.scanner.analysisTypes.find(a => a.id === activeAnalysisId)?.label}.
         </p>
      </div>
    </div>
  );

  const enginesUI = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {scanEngineRows.map((p) => {
          const on = selectedIds.includes(p.id);
          const ok = canRunEngine(p);
          return (
            <button
              key={p.id}
              disabled={!ok && !on}
              onClick={() => toggleProvider(p.id)}
              className={`flex items-start text-start gap-3 rounded-2xl border p-4 transition-all ${
                on && ok ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20" : "border-slate-100 bg-white"
              } ${!ok ? "opacity-40 cursor-not-allowed bg-slate-50 border-dashed" : "hover:border-blue-200"}`}
            >
              <div className={`mt-0.5 flex shrink-0 h-5 w-5 items-center justify-center rounded-full ${on && ok ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                {on && ok ? <CheckCircle2 size={12} /> : <Brain size={12} />}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{p.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">{p.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const filesUI = (
    <div className="space-y-6">
      <div {...getRootProps()} className={`relative flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed p-10 transition-all ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300"
      }`}>
        <input {...getInputProps()} />
        <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-blue-500">
           <UploadCloud size={32} />
        </div>
        <p className="text-xl font-black text-slate-800">{config.scanner.dropzoneTitle}</p>
        <p className="text-sm text-slate-400 mt-1 font-medium">{config.scanner.dropzoneSub}</p>
      </div>
      {files.length > 0 && (
         <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 max-h-48 overflow-y-auto shadow-sm">
            {files.map((f, i) => (
               <div key={i} className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    <FileSearch size={14} className="text-blue-500" />
                    <span>{f.name}</span>
                  </div>
                  <XCircle size={14} className="text-slate-300 cursor-pointer hover:text-rose-500" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} />
               </div>
            ))}
         </div>
      )}
    </div>
  );

  const resultsUI = (
    <div className="space-y-8 animate-in fade-in duration-700">
      {compareResults.map((row, idx) => (
        <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all">
           <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><FileSearch size={20} /></div>
                 <div>
                    <h5 className="font-black text-slate-900 tracking-tight">{row.fileName}</h5>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{config.scanner.analysisTypes.find(a => a.id === row.analysisType)?.label}</p>
                 </div>
              </div>
              <span className="text-xs font-black bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-400 italic">#{idx + 1}</span>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 bg-slate-50 p-6">
                 {row.previewUrl ? (
                   row.isImage ? <Image src={row.previewUrl} alt="" width={1200} height={1600} className="h-auto w-full rounded-2xl bg-white shadow-lg" unoptimized />
                   : <iframe src={row.previewUrl} className="w-full h-96 rounded-2xl shadow-lg bg-white" />
                 ) : <div className="h-48 bg-white rounded-2xl flex items-center justify-center text-slate-300 italic">No Preview</div>}
              </div>
              <div className="lg:col-span-7 p-6 space-y-4">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t("scanner.results")}</span>
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                       <CheckCircle2 size={12} /> Confidence Active
                    </div>
                 </div>
                 {row.engines.filter(e => e.ok).map((e, ei) => {
                    const ai = e.aiData || {};
                    const isBest = ei === row.recommendedIndex;
                    return (
                       <div key={ei} className={`rounded-3xl border p-6 transition-all ${isBest ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500/10" : "border-slate-100 bg-white"}`}>
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isBest ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}><Brain size={16} /></div>
                                <span className={`font-black tracking-tighter uppercase ${isBest ? "text-blue-900" : "text-slate-700"}`}>{e.label}</span>
                             </div>
                             <span className="text-[10px] font-black italic bg-white/50 px-2 py-1 rounded-lg">ציון {e.score}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                             {config.scanner.resultColumns.map(col => (
                               <div key={col.key} className="bg-white/80 rounded-2xl p-3 border border-slate-100/50">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{col.label}</p>
                                  <p className="text-xs font-black text-slate-900 truncate">{(ai as any)[col.key] || "—"}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto pt-8">
         <button 
                  onClick={() => router.push("/app/documents/erp")}
           className="flex-1 btn-primary py-5 rounded-[2rem] text-sm font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
         >
            שמור והעבר להנהלת חשבונות
         </button>
         <button 
                  onClick={() => router.push("/app/clients")}
           className="flex-1 btn-secondary py-5 rounded-[2rem] text-sm font-black border-2 border-slate-100 active:scale-95 transition-all"
         >
            שיוך לכרטיסי לקוח ב-CRM
         </button>
      </div>
    </div>
  );

  const steps: WizardStepConfig[] = [
    { id: "mode", title: "סוג פענוח", subtitle: "התאמת בינה מלאכותית למקצוע שלך", content: modeUI, canAdvance: !!activeAnalysisId },
    { id: "engines", title: "מנועי סריקה", subtitle: "בחירת מומחי ה-AI לתהליך", content: enginesUI, canAdvance: selectedIds.length > 0 },
    { id: "files", title: "קלט מקור", subtitle: "העלאת מסמכים למערכת", content: filesUI, canAdvance: files.length > 0 },
    { id: "processing", title: "פענוח בזמן אמת", subtitle: "ה-AI מעבד את הנתונים", content: <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse"><Brain size={48} className="text-white" /></div>
        <p className="font-black text-xl italic text-slate-800">מבצע פענוח מולטי-מנוע...</p>
        <div className="w-64 bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
    </div>, canAdvance: false },
    { id: "results", title: "אישור ותיוק", subtitle: "בקרת איכות ושיוך לארגון", content: resultsUI, canAdvance: true }
  ];

  return (
    <div className="p-4 md:p-0">
      {compactHeader ? (
        <div className="mb-6 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-indigo-700">
              <Settings2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">סקטור: {config.label}</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">{config.scanner.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{config.scanner.subtitle}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 text-center">
         <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 mb-4">
            <Settings2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">סקטור: {config.label}</span>
         </div>
         <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 mb-2">{config.scanner.title}</h1>
         <p className="text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">{config.scanner.subtitle}</p>
        </div>
      )}

      <WizardContainer 
        title={config.scanner.title}
        subtitle={config.scanner.subtitle}
        icon={<ActiveIcon />}
        steps={steps}
        currentStepIndex={wizardStep}
        onStepChange={handleWizardStepChange}
        onFinish={() => setWizardStep(0)}
      />
    </div>
  );
}
