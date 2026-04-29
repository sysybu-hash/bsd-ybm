"use client";

import { Maximize2, X } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { useAiHubPreview } from "@/components/documents/AiHubPreviewContext";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";

type Props = {
  className?: string;
  /** מגירת מובייל — כפתור סגירה */
  variant?: "sidebar" | "mobile";
  onClose?: () => void;
  /** פותח עריכה במסך מלא לפי הבחירה בארכיון */
  onExpandLibrary?: () => void;
};

export default function AiHubUnifiedPreview({
  className = "",
  variant = "sidebar",
  onClose,
  onExpandLibrary,
}: Props) {
  const { t, dir } = useI18n();
  const {
    scanPreview,
    notebookLastReply,
    notebookSourceNames,
    libraryPeek,
    previewPanelTab,
    setPreviewPanelTab,
  } = useAiHubPreview();

  const tabs: { id: typeof previewPanelTab; label: string }[] = [
    { id: "scan", label: t("workspaceAiHub.previewTabScan") },
    { id: "notebook", label: t("workspaceAiHub.previewTabNotebook") },
    { id: "library", label: t("workspaceAiHub.previewTabLibrary") },
  ];

  const extractionJson =
    scanPreview.extraction !== null && scanPreview.extraction !== undefined
      ? JSON.stringify(scanPreview.extraction, null, 2)
      : "";

  return (
    <section
      className={`flex min-h-0 flex-col rounded-[var(--cd-radius)] border border-[color:var(--cd-line)] bg-[color:var(--cd-bg-raised)] shadow-sm ${className}`}
      dir={dir}
      aria-label={t("workspaceAiHub.previewPanelAria")}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[color:var(--cd-line)] px-3 py-2">
        <p className="text-xs font-black text-[color:var(--cd-ink)]">{t("workspaceAiHub.previewTitle")}</p>
        {variant === "mobile" && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--cd-line)] bg-white text-[color:var(--cd-ink)]"
            aria-label={t("workspaceAiHub.mobilePreviewClose")}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </header>

      <div
        role="tablist"
        aria-label={t("workspaceAiHub.previewTabsAria")}
        className="flex shrink-0 gap-1 border-b border-[color:var(--cd-line)] p-1"
      >
        {tabs.map((tab) => {
          const selected = previewPanelTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setPreviewPanelTab(tab.id)}
              className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-[11px] font-black transition sm:text-xs ${
                selected
                  ? "bg-[color:var(--cd-bg-sunken)] text-[color:var(--cd-ink)] shadow-sm"
                  : "text-[color:var(--cd-ink-mute)] hover:text-[color:var(--cd-ink)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3" role="tabpanel">
        {previewPanelTab === "scan" ? (
          <div className="space-y-3">
            {scanPreview.scanning ? (
              <p className="text-sm font-semibold text-[color:var(--cd-ink-mute)]">{t("workspaceAiHub.previewScanRunning")}</p>
            ) : null}
            {scanPreview.scanError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{scanPreview.scanError}</p>
            ) : null}
            {scanPreview.streamStage && !scanPreview.scanError ? (
              <p className="text-xs font-bold text-[color:var(--cd-ink-mute)]">
                {t("workspaceAiHub.previewStreamStage", { stage: scanPreview.streamStage })}
              </p>
            ) : null}

            {scanPreview.previewUrl && scanPreview.previewKind === "image" ? (
              <div className="overflow-hidden rounded-xl border border-[color:var(--cd-line)] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scanPreview.previewUrl}
                  alt={scanPreview.fileName ?? "scan preview"}
                  className="max-h-[220px] w-full object-contain"
                />
              </div>
            ) : null}

            {scanPreview.previewUrl && scanPreview.previewKind === "pdf" ? (
              <iframe
                title={scanPreview.fileName ?? "pdf"}
                src={scanPreview.previewUrl}
                className="h-[min(240px,40vh)] w-full rounded-xl border border-[color:var(--cd-line)] bg-white"
              />
            ) : null}

            {extractionJson ? (
              <pre className="max-h-[min(320px,45vh)] overflow-auto rounded-xl bg-[color:var(--cd-bg-sunken)] p-3 text-[10px] leading-relaxed text-[color:var(--cd-ink)]">
                {extractionJson}
              </pre>
            ) : !scanPreview.scanning && !scanPreview.scanError ? (
              <p className="text-sm text-[color:var(--cd-ink-mute)]">{t("workspaceAiHub.previewScanEmpty")}</p>
            ) : null}
          </div>
        ) : null}

        {previewPanelTab === "notebook" ? (
          <div className="space-y-3">
            {notebookSourceNames.length > 0 ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--cd-ink-mute)]">
                  {t("workspaceAiHub.previewNotebookSources")}
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-[color:var(--cd-ink)]">
                  {notebookSourceNames.map((name) => (
                    <li key={name} className="truncate">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-[color:var(--cd-ink-mute)]">{t("workspaceAiHub.previewNotebookNoSources")}</p>
            )}
            {notebookLastReply ? (
              <div className="rounded-xl border border-[color:var(--cd-line)] bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--cd-ink-mute)]">
                  {t("workspaceAiHub.previewNotebookLast")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--cd-ink)]">{notebookLastReply}</p>
              </div>
            ) : (
              <p className="text-sm text-[color:var(--cd-ink-mute)]">{t("workspaceAiHub.previewNotebookEmpty")}</p>
            )}
          </div>
        ) : null}

        {previewPanelTab === "library" ? (
          <div className="space-y-3">
            {!libraryPeek ? (
              <p className="text-sm text-[color:var(--cd-ink-mute)]">{t("workspaceAiHub.previewLibraryEmpty")}</p>
            ) : libraryPeek.kind === "scanned" ? (
              <>
                <div className="rounded-xl border border-[color:var(--cd-line)] bg-white p-3 text-sm">
                  <p className="font-black text-[color:var(--cd-ink)]">{libraryPeek.vendor}</p>
                  <p className="mt-1 truncate text-xs text-[color:var(--cd-ink-mute)]">{libraryPeek.fileName}</p>
                  <p className="mt-2 text-xs text-[color:var(--cd-ink-mute)]">
                    {libraryPeek.extractedType} · {formatShortDate(libraryPeek.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--cd-ink)]">{libraryPeek.summary}</p>
                  <p className="mt-2 text-xs font-bold text-[color:var(--cd-ink-mute)]">
                    {t("workspaceAiHub.previewLibraryTotal", {
                      amount: libraryPeek.total > 0 ? formatCurrencyILS(libraryPeek.total) : t("workspaceDocuments.noAmountDetected"),
                      lines: String(libraryPeek.lineItemCount),
                    })}
                  </p>
                </div>
                {onExpandLibrary ? (
                  <button type="button" onClick={onExpandLibrary} className="bento-btn bento-btn--primary w-full justify-center">
                    {t("workspaceAiHub.previewOpenFullscreen")}
                    <Maximize2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-[color:var(--cd-line)] bg-white p-3 text-sm">
                  <p className="font-black text-[color:var(--cd-ink)]">{libraryPeek.clientName}</p>
                  <p className="mt-1 text-xs text-[color:var(--cd-ink-mute)]">
                    {t(`workspaceDocuments.issuedType.${libraryPeek.type}`)} #{libraryPeek.number}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--cd-ink-mute)]">{formatShortDate(libraryPeek.date)}</p>
                  <p className="mt-2 text-sm font-bold text-[color:var(--cd-ink)]">{formatCurrencyILS(libraryPeek.total)}</p>
                </div>
                {onExpandLibrary ? (
                  <button type="button" onClick={onExpandLibrary} className="bento-btn bento-btn--primary w-full justify-center">
                    {t("workspaceAiHub.previewOpenFullscreen")}
                    <Maximize2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
