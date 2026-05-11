"use client";

import { useDropzone } from "react-dropzone";
import { FileSpreadsheet, FileText, Layers3, Upload, X } from "lucide-react";
import type { ScanModeOption, ScanWizardProfile } from "@/lib/professions/scan-wizard";
import type { ScanModeV5 } from "@/lib/scan-schema-v5";

type Props = {
  profile: ScanWizardProfile;
  files: File[];
  activeFileIndex: number;
  selectedMode: ScanModeV5;
  onMode: (mode: ScanModeV5) => void;
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onActiveFileChange: (index: number) => void;
};

const ICON_MAP = {
  invoice: FileSpreadsheet,
  drawing: Layers3,
  general: FileText,
} as const;

export default function Step1ModeUpload({
  profile,
  files,
  activeFileIndex,
  selectedMode,
  onMode,
  onFilesAdded,
  onFileRemove,
  onActiveFileChange,
}: Props) {
  const dropzone = useDropzone({
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    onDrop: (accepted) => {
      if (accepted.length > 0) onFilesAdded(accepted);
    },
  });

  return (
    <div className="grid gap-5">
      {/* בחירת מצב סריקה */}
      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--scanw-muted)]">
          איזה מסמך אנחנו סורקים?
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {profile.scanModes.map((mode: ScanModeOption) => {
            const Icon = ICON_MAP[mode.icon];
            const active = mode.id === selectedMode;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onMode(mode.id)}
                className={[
                  "group flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-start transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] active:scale-[0.99]",
                  active
                    ? "border-[color:var(--scanw-accent)] bg-[color:var(--scanw-accent-soft)] text-[color:var(--scanw-ink)] shadow-[0_8px_24px_-16px_var(--scanw-accent)]"
                    : "border-[color:var(--scanw-line)] bg-white/60 text-[color:var(--scanw-ink)] hover:border-[color:var(--scanw-accent-muted)] hover:bg-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-xl transition",
                    active
                      ? "bg-[color:var(--scanw-accent)] text-white"
                      : "bg-[color:var(--scanw-accent-soft)] text-[color:var(--scanw-accent)]",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-black">{mode.label}</span>
                <span className="text-xs font-semibold text-[color:var(--scanw-muted)]">{mode.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* העלאת קבצים */}
      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--scanw-muted)]">
          העלאת קבצים
        </h2>
        {files.length === 0 ? (
          <div
            {...dropzone.getRootProps()}
            className={[
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed bg-white/60 px-6 py-10 text-center transition-all",
              dropzone.isDragActive
                ? "border-[color:var(--scanw-accent)] bg-[color:var(--scanw-accent-soft)]"
                : "border-[color:var(--scanw-line)] hover:border-[color:var(--scanw-accent-muted)]",
            ].join(" ")}
          >
            <input {...dropzone.getInputProps()} />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--scanw-accent)] text-white">
              <Upload className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-base font-black text-[color:var(--scanw-ink)]">גרור קבצים לכאן או לחץ להעלאה</p>
              <p className="mt-1 text-xs font-semibold text-[color:var(--scanw-muted)]">
                {profile.uploadAcceptHint} · {profile.uploadSizeHint}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <div
              {...dropzone.getRootProps()}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[color:var(--scanw-line)] bg-white/60 px-4 py-2.5 text-sm font-black text-[color:var(--scanw-muted)] hover:border-[color:var(--scanw-accent-muted)]"
            >
              <input {...dropzone.getInputProps()} />
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" aria-hidden />
                הוסף עוד קבצים
              </span>
              <span className="text-xs font-semibold">{profile.uploadAcceptHint}</span>
            </div>

            <ul className="grid gap-1.5">
              {files.map((file, index) => {
                const active = index === activeFileIndex;
                return (
                  <li key={`${file.name}-${index}`}>
                    <div
                      className={[
                        "flex items-center gap-3 rounded-2xl border bg-white/80 px-3 py-2.5 transition",
                        active
                          ? "border-[color:var(--scanw-accent)] shadow-sm"
                          : "border-[color:var(--scanw-line)] hover:border-[color:var(--scanw-accent-muted)]",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => onActiveFileChange(index)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-start"
                      >
                        <span
                          className={[
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            active
                              ? "bg-[color:var(--scanw-accent)] text-white"
                              : "bg-[color:var(--scanw-accent-soft)] text-[color:var(--scanw-accent)]",
                          ].join(" ")}
                        >
                          <FileText className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-[color:var(--scanw-ink)]">
                            {file.name}
                          </span>
                          <span className="block text-[11px] font-semibold text-[color:var(--scanw-muted)]">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onFileRemove(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-[color:var(--scanw-muted)] hover:bg-rose-50 hover:text-rose-600"
                        aria-label="הסר קובץ"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
