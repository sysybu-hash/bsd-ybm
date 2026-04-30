"use client";

import type { DropzoneInputProps, DropzoneRootProps } from "react-dropzone";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  DatabaseZap,
  Eye,
  FileSearch,
  Gauge,
  Loader2,
  Network,
  PanelTopOpen,
  Play,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  TableProperties,
  UploadCloud,
  UserRound,
} from "lucide-react";
import type { ScanExtractionV5, ScanModeV5 } from "@/lib/scan-schema-v5";
import type { TFunction } from "@/lib/i18n/translate";
import type { ScanLookupContact, ScanLookupProject, TriTelemetry } from "./types";
import type { EngineMetaResponse, EngineRunMode } from "./types";
import { RUN_MODES, SCAN_MODES, STREAM_STAGE_LABELS } from "./constants";
import {
  engineProgress,
  fileSizeLabel,
  phaseIcon,
  phaseLabel,
  progressTone,
  truncateText,
} from "./utils";
import {
  Capability,
  CardShell,
  DashboardAction,
  EngineOptionRow,
  IconMetric,
  MiniPill,
  ProcessorBadge,
  SectionTitle,
  StatTile,
} from "./ui-blocks";

type EngineRow = {
  key: "documentAI" | "gemini" | "gpt";
  label: string;
  detail: string;
  configured: boolean;
  telemetry: TriTelemetry["documentAI"];
  icon: typeof DatabaseZap;
  offset: number;
};

export type DockWizardScanLayoutProps = {
  hubPreviewMode: boolean;
  dockWizardStep: 1 | 2 | 3 | 4 | 5;
  setDockWizardStep: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4 | 5>>;
  wizardStepLabels: string[];
  t: TFunction;
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  isDragActive: boolean;
  files: File[];
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  activeFile: File | null;
  activePreviewUrl: string | null;
  triggerFilePreview: () => void;
  scanMode: ScanModeV5;
  setScanMode: (mode: ScanModeV5) => void;
  engineRunMode: EngineRunMode;
  setEngineRunMode: (mode: EngineRunMode) => void;
  scanning: boolean;
  authStatus: string;
  lookupSearch: string;
  setLookupSearch: (value: string) => void;
  engineInstruction: string;
  setEngineInstruction: (value: string) => void;
  lookupsLoading: boolean;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  selectedContactId: string;
  setSelectedContactId: (id: string) => void;
  visibleProjects: ScanLookupProject[];
  contacts: ScanLookupContact[];
  engineMeta: EngineMetaResponse | null;
  engineMetaLoading: boolean;
  resolvedOpenAiModel: string;
  openAiModelOptions: { id: string; label: string }[];
  setOpenAiModel: (id: string) => void;
  docAiProcessors: NonNullable<NonNullable<EngineMetaResponse["documentAI"]>["processors"]>;
  docAiRecommendedKinds: string[];
  engineRows: EngineRow[];
  selectedScanMode: (typeof SCAN_MODES)[number];
  selectedRunMode: (typeof RUN_MODES)[number];
  streamStage: string | null;
  scanError: string | null;
  v5: ScanExtractionV5 | null;
  totalProgress: number;
  elapsedSeconds: number;
  runScan: () => void | Promise<void>;
  setResultsOpen: (open: boolean) => void;
  handleSave: (target: "ERP" | "CRM") => void | Promise<void>;
  resetResult: () => void;
  clearWorkspace: () => void;
  aiData: Record<string, unknown> | null;
  savingTarget: "ERP" | "CRM" | null;
  docAiProcessorSummary: string;
};

export function DockWizardScanLayout(props: DockWizardScanLayoutProps) {
  const {
    hubPreviewMode,
    dockWizardStep,
    setDockWizardStep,
    wizardStepLabels,
    t,
    getRootProps,
    getInputProps,
    isDragActive,
    files,
    activeFileIndex,
    setActiveFileIndex,
    activeFile,
    activePreviewUrl,
    triggerFilePreview,
    scanMode,
    setScanMode,
    engineRunMode,
    setEngineRunMode,
    scanning,
    authStatus,
    lookupSearch,
    setLookupSearch,
    engineInstruction,
    setEngineInstruction,
    lookupsLoading,
    selectedProjectId,
    setSelectedProjectId,
    selectedContactId,
    setSelectedContactId,
    visibleProjects,
    contacts,
    engineMeta,
    engineMetaLoading,
    resolvedOpenAiModel,
    openAiModelOptions,
    setOpenAiModel,
    docAiProcessors,
    docAiRecommendedKinds,
    engineRows,
    selectedScanMode,
    selectedRunMode,
    streamStage,
    scanError,
    v5,
    totalProgress,
    elapsedSeconds,
    runScan,
    setResultsOpen,
    handleSave,
    resetResult,
    clearWorkspace,
    aiData,
    savingTarget,
    docAiProcessorSummary,
  } = props;

  const canRunScan = Boolean(activeFile) && !scanning && authStatus === "authenticated";

  const startScan = () => {
    if (!canRunScan) return;
    setDockWizardStep(4);
    void runScan();
  };

  const canAdvance =
    dockWizardStep === 1
      ? files.length > 0
      : dockWizardStep === 2 || dockWizardStep === 3
        ? true
        : dockWizardStep === 4
          ? !!v5
          : false;

  const goNext = () => {
    if (!canAdvance || dockWizardStep >= 5) return;
    setDockWizardStep((previous) => {
      const n = previous + 1;
      return (n > 5 ? 5 : n) as 1 | 2 | 3 | 4 | 5;
    });
  };

  const goBack = () => {
    if (scanning && dockWizardStep === 4) return;
    setDockWizardStep((previous) => {
      const n = previous - 1;
      return (n < 1 ? 1 : n) as 1 | 2 | 3 | 4 | 5;
    });
  };

  const stepAria = (index: number) =>
    t("workspaceDock.scannerWizard.stepAria", {
      current: String(index + 1),
      total: "5",
      label: wizardStepLabels[index] ?? "",
    });

  return (
    <main
      className={`flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2.5 ${
        hubPreviewMode ? "overflow-y-auto overflow-x-hidden" : ""
      }`}
    >
      <nav
        className="shrink-0 rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-2 shadow-[var(--cd-shadow-sm)]"
        aria-label={t("workspaceDock.scannerWizard.navAria")}
      >
        <ol className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-between">
          {[1, 2, 3, 4, 5].map((stepNum) => {
            const active = dockWizardStep === stepNum;
            const label = wizardStepLabels[stepNum - 1] ?? "";
            return (
              <li key={stepNum} className="flex min-w-0 flex-1 basis-[30%] justify-center sm:basis-auto">
                <div
                  role="tab"
                  aria-current={active ? "step" : undefined}
                  aria-label={stepAria(stepNum - 1)}
                  className={`flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-[11px] font-black ${
                    active ? "bg-[color:var(--ink-900)] text-white" : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-600)]"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px]">
                    {stepNum}
                  </span>
                  <span className="hidden truncate sm:inline">{label}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid shrink-0 grid-cols-2 gap-2 rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-2 shadow-[var(--cd-shadow-sm)] md:grid-cols-5 xl:grid-cols-10">
        <button
          type="button"
          onClick={() => setDockWizardStep(1)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[color:var(--canvas-sunken)] px-3 text-xs font-black text-[color:var(--ink-800)] transition hover:bg-blue-50 hover:text-blue-700"
        >
          <UploadCloud className="h-4 w-4" aria-hidden />
          קבצים
        </button>
        <button
          type="button"
          onClick={() => setDockWizardStep(2)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[color:var(--canvas-sunken)] px-3 text-xs font-black text-[color:var(--ink-800)] transition hover:bg-blue-50 hover:text-blue-700"
        >
          <Network className="h-4 w-4" aria-hidden />
          מנועים
        </button>
        <button
          type="button"
          onClick={() => setDockWizardStep(3)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[color:var(--canvas-sunken)] px-3 text-xs font-black text-[color:var(--ink-800)] transition hover:bg-blue-50 hover:text-blue-700"
        >
          <Building2 className="h-4 w-4" aria-hidden />
          שיוך
        </button>
        <button
          type="button"
          onClick={triggerFilePreview}
          disabled={!activeFile || !activePreviewUrl}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[color:var(--canvas-sunken)] px-3 text-xs font-black text-[color:var(--ink-800)] transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Eye className="h-4 w-4" aria-hidden />
          תצוגה
        </button>
        <button
          type="button"
          onClick={startScan}
          disabled={!canRunScan}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Play className="h-4 w-4" aria-hidden />
          סרוק עכשיו
        </button>
        <button
          type="button"
          onClick={() => setResultsOpen(true)}
          disabled={!v5}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[color:var(--canvas-sunken)] px-3 text-xs font-black text-[color:var(--ink-800)] transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <TableProperties className="h-4 w-4" aria-hidden />
          תוצאות
        </button>
        <button
          type="button"
          onClick={resetResult}
          disabled={scanning}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[color:var(--canvas-sunken)] px-3 text-xs font-black text-[color:var(--ink-800)] transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          איפוס
        </button>
        <button
          type="button"
          onClick={() => handleSave("ERP")}
          disabled={!aiData || !activeFile || savingTarget !== null}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <CircleDollarSign className="h-4 w-4" aria-hidden />
          ERP
        </button>
        <button
          type="button"
          onClick={() => handleSave("CRM")}
          disabled={!aiData || !activeFile || savingTarget !== null}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 text-xs font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <UserRound className="h-4 w-4" aria-hidden />
          CRM
        </button>
        <button
          type="button"
          onClick={clearWorkspace}
          disabled={scanning}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[color:var(--ink-900)] px-3 text-xs font-black text-white transition hover:bg-[color:var(--ink-800)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Save className="h-4 w-4" aria-hidden />
          לוח חדש
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-3 shadow-[var(--cd-shadow-sm)]"
        aria-label={stepAria(dockWizardStep - 1)}
      >
        {dockWizardStep === 1 ? (
          <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
            <SectionTitle eyebrow="קלט" title="קבצים" icon={UploadCloud} />
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
            </div>

            <CardShell className="flex min-h-0 flex-col">
              <div className="mb-2 flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-blue-600" aria-hidden />
                <h2 className="text-sm font-black text-[color:var(--ink-900)]">הנחיה למנועים</h2>
              </div>
              <p className="mb-2 text-[11px] font-semibold leading-5 text-[color:var(--ink-500)]">
                אחרי העלאת הקובץ אפשר לכתוב למנועים מה לפענח, מה חשוב לך במיוחד, ואילו בדיקות להוסיף מעבר לסוגי הפענוח הקיימים.
              </p>
              <textarea
                value={engineInstruction}
                onChange={(event) => setEngineInstruction(event.target.value)}
                disabled={!activeFile || scanning}
                maxLength={1200}
                placeholder="לדוגמה: התמקד בכמויות בטון וברזל, חלץ מספרי חשבונית, בדוק כפילויות, וסמן סעיפים שחסרים מחיר."
                className="min-h-0 flex-1 resize-none rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] p-3 text-sm font-semibold leading-6 text-[color:var(--ink-900)] outline-none placeholder:text-[color:var(--ink-400)] focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[color:var(--ink-400)]">{engineInstruction.length}/1200</span>
                <button
                  type="button"
                  onClick={() => setEngineInstruction("")}
                  disabled={!engineInstruction.trim()}
                  className="rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] px-3 py-1.5 text-xs font-black text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)] disabled:opacity-45"
                >
                  נקה
                </button>
              </div>
            </CardShell>
          </div>
        ) : null}

        {dockWizardStep === 2 ? (
          <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-2">
            <SectionTitle eyebrow="מנועים" title="תכנון הסריקה" icon={Network} />
            <div className="grid min-h-0 gap-2 lg:grid-cols-3">
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
            </div>
          </div>
        ) : null}

        {dockWizardStep === 3 ? (
          <div className="space-y-3">
            <SectionTitle eyebrow="CRM" title="שיוך CRM / ERP" icon={Building2} />
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
          </div>
        ) : null}

        {dockWizardStep === 4 ? (
          <div className="space-y-3">
            <SectionTitle eyebrow="הרצה" title="סריקה והתקדמות" icon={Play} />

            <button
              type="button"
              onClick={startScan}
              disabled={!canRunScan}
              className="flex w-full min-h-[64px] items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-4 text-lg font-black text-white shadow-xl shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label={scanning ? "סריקה פעילה" : "הפעל סריקה עכשיו"}
            >
              {scanning ? <Loader2 className="h-6 w-6 shrink-0 animate-spin" aria-hidden /> : <Play className="h-6 w-6 shrink-0" aria-hidden />}
              <span>{scanning ? "סורק עכשיו..." : activeFile ? "סרוק עכשיו" : "בחר קובץ כדי לסרוק"}</span>
            </button>

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

            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[var(--cd-shadow-sm)]">
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

              <div className="p-3">
                {scanError ? (
                  <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800">
                    <div className="mb-2 flex items-center gap-2 font-black">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      שגיאת סריקה
                    </div>
                    {truncateText(scanError, 1800)}
                  </div>
                ) : null}

                {!v5 && !scanning ? (
                  <p className="mb-3 text-center text-xs font-semibold text-[color:var(--ink-500)]">{t("workspaceDock.scannerWizard.runHint")}</p>
                ) : null}

                <button
                  type="button"
                  onClick={startScan}
                  disabled={!canRunScan}
                  className="mb-4 flex w-full min-h-[52px] shrink-0 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-4 py-3.5 text-base font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[56px] sm:text-lg"
                  aria-label={scanning ? "סריקה פעילה" : "הפעל סריקה"}
                >
                  {scanning ? <Loader2 className="h-6 w-6 animate-spin shrink-0" aria-hidden /> : <Play className="h-6 w-6 shrink-0" aria-hidden />}
                  {scanning ? "סורק..." : "הפעל סריקה"}
                </button>

                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {engineRows.map((engine) => {
                    const Icon = engine.icon;
                    const StatusIcon = phaseIcon(engine.telemetry.phase);
                    return (
                      <button
                        key={`compact-${engine.key}`}
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
        ) : null}

        {dockWizardStep === 5 ? (
          <div className="space-y-3">
            <SectionTitle eyebrow="תוצאות" title="סיכום ושמירה" icon={CheckCircle2} />

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

            <CardShell className="min-h-[200px]">
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-[2rem] ${
                    v5 ? "bg-emerald-50 text-emerald-700" : scanning ? "bg-blue-50 text-blue-700" : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]"
                  }`}
                >
                  {v5 ? (
                    <CheckCircle2 className="h-10 w-10" aria-hidden />
                  ) : scanning ? (
                    <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
                  ) : (
                    <UploadCloud className="h-10 w-10" aria-hidden />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-[color:var(--ink-900)]">{v5 ? "פוענח" : scanning ? "בעבודה" : "אין תוצאה עדיין"}</h3>
                  <p className="mt-2 text-sm font-bold text-[color:var(--ink-500)]">
                    {v5 ? "פתח את התוצאות המלאות לבדיקה או שמור ל-ERP/CRM." : "הרץ סריקה משלב ההרצה."}
                  </p>
                </div>
                <div className="grid w-full max-w-xl grid-cols-3 gap-2">
                  <IconMetric icon={Settings2} label="מצב" value={selectedScanMode.label} />
                  <IconMetric icon={Network} label="מנוע" value={selectedRunMode.short} />
                  <IconMetric icon={Gauge} label="התקדמות" value={`${totalProgress}%`} />
                </div>
              </div>
            </CardShell>

            <CardShell>
              <div className="mb-3 flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-600" aria-hidden />
                <h2 className="text-sm font-black text-[color:var(--ink-900)]">שמירה</h2>
              </div>
              <div className="grid gap-2">
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
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[color:var(--line)] bg-[color:var(--canvas-raised)]/80 px-1 py-2">
        <button
          type="button"
          onClick={goBack}
          disabled={dockWizardStep === 1 || (scanning && dockWizardStep === 4)}
          aria-label={t("workspaceDock.scannerWizard.backAria")}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 text-sm font-black text-[color:var(--ink-800)] transition hover:bg-[color:var(--canvas-sunken)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {t("workspaceDock.scannerWizard.back")}
        </button>
        {dockWizardStep === 4 ? (
          <button
            type="button"
            onClick={startScan}
            disabled={!canRunScan}
            aria-label="סרוק עכשיו"
            className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-base font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {scanning ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Play className="h-5 w-5" aria-hidden />}
            {scanning ? "סורק..." : "סרוק עכשיו"}
          </button>
        ) : dockWizardStep < 5 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance}
            aria-label={t("workspaceDock.scannerWizard.nextAria")}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[color:var(--ink-900)] px-4 text-sm font-black text-white transition hover:bg-[color:var(--ink-800)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {t("workspaceDock.scannerWizard.next")}
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-[color:var(--ink-500)]" aria-hidden />
        )}
      </div>
    </main>
  );
}
