"use client";

import { Database, Loader2, RotateCcw, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ScanExtractionV5 } from "@/lib/scan-schema-v5";
import type { SaveTarget } from "@/components/scan/state/scan-machine";
import type { ResultColumnConfig, ScanWizardProfile } from "@/lib/professions/scan-wizard";

type Props = {
  profile: ScanWizardProfile;
  aiData: Record<string, unknown> | null;
  v5: ScanExtractionV5 | null;
  saving: boolean;
  saveTarget: SaveTarget | null;
  streamStage: string | null;
  partialV5: ScanExtractionV5 | null;
  isExtracting: boolean;
  elapsedSeconds: number;
  onSave: (target: SaveTarget) => void;
  onRescan: () => void;
};

function pickFromCandidates(item: Record<string, unknown>, candidates?: string[]): unknown {
  if (!candidates) return undefined;
  for (const key of candidates) {
    if (item[key] !== undefined && item[key] !== null && item[key] !== "") return item[key];
  }
  return undefined;
}

function fmtNumber(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("he-IL", { maximumFractionDigits: 2 });
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n.toLocaleString("he-IL", { maximumFractionDigits: 2 });
    return value;
  }
  return "—";
}

function fmtString(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return "—";
}

export default function Step4Review({
  profile,
  aiData,
  v5,
  saving,
  saveTarget,
  streamStage,
  partialV5,
  isExtracting,
  elapsedSeconds,
  onSave,
  onRescan,
}: Props) {
  if (isExtracting) {
    const partialVendor = partialV5?.vendor;
    const partialItems = partialV5?.lineItems?.length ?? 0;
    return (
      <div className="grid gap-4">
        <div className="overflow-hidden rounded-3xl border border-[color:var(--scanw-line)] bg-white/70 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--scanw-accent)] text-white">
            <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
          </div>
          <p className="mt-3 text-base font-black text-[color:var(--scanw-ink)]">
            {streamStage ?? "מפענח את המסמך..."}
          </p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--scanw-muted)] tabular-nums">
            {elapsedSeconds} שנ׳ · {partialVendor ? `${profile.vendorLabel}: ${partialVendor}` : "ממתין לתוצאה ראשונה"} · {partialItems} {profile.lineItemsLabel}
          </p>
          <div className="mx-auto mt-5 grid max-w-md gap-2" aria-hidden>
            <Skeleton className="h-3 w-full max-w-[280px]" />
            <Skeleton className="mx-auto h-3 w-full max-w-[220px]" />
            <Skeleton className="mx-auto h-3 w-full max-w-[180px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!aiData) {
    return (
      <div className="rounded-3xl border border-dashed border-[color:var(--scanw-line)] bg-white/60 p-6 text-center">
        <p className="text-sm font-black text-[color:var(--scanw-ink)]">עוד לא רצה סריקה</p>
        <p className="mt-1 text-xs font-semibold text-[color:var(--scanw-muted)]">
          חזור לשלב הקודם והתחל סריקה — התוצאה תופיע כאן.
        </p>
      </div>
    );
  }

  const lineItems = Array.isArray(aiData.lineItems)
    ? (aiData.lineItems as Array<Record<string, unknown>>)
    : Array.isArray(aiData.items)
      ? (aiData.items as Array<Record<string, unknown>>)
      : [];

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-[color:var(--scanw-line)] bg-white/70 p-5">
        <div className="min-w-0">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">פענוח הושלם</span>
          <h3 className="mt-1 truncate text-lg font-black text-[color:var(--scanw-ink)]">
            {fmtString(aiData.vendor)}
          </h3>
          <p className="text-xs font-semibold text-[color:var(--scanw-muted)] tabular-nums">
            {profile.totalLabel}: ₪{fmtNumber(aiData.total)} · {lineItems.length} {profile.lineItemsLabel}
            {v5?.documentMetadata.documentDate ? ` · ${v5.documentMetadata.documentDate}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onRescan}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[color:var(--scanw-line)] bg-white/80 px-3 text-xs font-black text-[color:var(--scanw-muted)] transition-all duration-200 hover:border-[color:var(--scanw-accent-muted)] hover:text-[color:var(--scanw-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          סרוק שוב
        </button>
      </header>

      {lineItems.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-[color:var(--scanw-line)] bg-white/70">
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[color:var(--scanw-rail-bg)] text-start text-[10px] font-black uppercase tracking-wider text-[color:var(--scanw-muted)]">
                <tr>
                  {profile.resultColumns.map((col: ResultColumnConfig) => (
                    <th key={col.key} className={`px-3 py-2 ${col.align === "end" ? "text-end" : "text-start"}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.slice(0, 50).map((item, index) => (
                  <tr key={index} className="border-t border-[color:var(--scanw-line)]">
                    {profile.resultColumns.map((col: ResultColumnConfig) => {
                      const raw = pickFromCandidates(item, col.candidates ?? [col.key]);
                      const looksNumeric = col.align === "end";
                      const display = looksNumeric ? fmtNumber(raw) : fmtString(raw);
                      return (
                        <td
                          key={col.key}
                          className={[
                            "px-3 py-2 tabular-nums",
                            col.align === "end" ? "text-end" : "text-start",
                            col.emphasize ? "font-black text-[color:var(--scanw-ink)]" : "font-semibold text-[color:var(--scanw-muted)]",
                          ].join(" ")}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSave("ERP")}
          disabled={saving}
          className={[
            "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-sm transition",
            profile.defaultSaveTarget === "ERP"
              ? "bg-[color:var(--scanw-accent)] hover:brightness-110"
              : "bg-emerald-600 hover:bg-emerald-700",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        >
          {saving && saveTarget === "ERP" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Database className="h-4 w-4" aria-hidden />
          )}
          {profile.saveTargetLabels.ERP}
        </button>
        <button
          type="button"
          onClick={() => onSave("CRM")}
          disabled={saving}
          className={[
            "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-sm transition",
            profile.defaultSaveTarget === "CRM"
              ? "bg-[color:var(--scanw-accent)] hover:brightness-110"
              : "bg-sky-600 hover:bg-sky-700",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        >
          {saving && saveTarget === "CRM" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Users className="h-4 w-4" aria-hidden />
          )}
          {profile.saveTargetLabels.CRM}
        </button>
      </div>
    </div>
  );
}
