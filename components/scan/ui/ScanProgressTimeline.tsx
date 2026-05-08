"use client";

import { Check, Loader2 } from "lucide-react";
import type { ScanPhase } from "@/components/scan/state/scan-machine";

type Props = {
  phase: ScanPhase;
  elapsedSeconds?: number;
  streamStage?: string | null;
};

const STEPS: Array<{ id: "upload" | "extract" | "review" | "save"; label: string }> = [
  { id: "upload", label: "קובץ" },
  { id: "extract", label: "פענוח AI" },
  { id: "review", label: "בדיקה" },
  { id: "save", label: "סנכרון" },
];

function stepStatus(stepId: (typeof STEPS)[number]["id"], phase: ScanPhase): "done" | "active" | "pending" {
  const order: ScanPhase[] = ["idle", "ready", "uploading", "extracting", "review", "saving", "done"];
  const phaseIndex = order.indexOf(phase);

  const map: Record<(typeof STEPS)[number]["id"], { active: ScanPhase[]; doneAfter: number }> = {
    upload: { active: ["ready"], doneAfter: order.indexOf("ready") },
    extract: { active: ["uploading", "extracting"], doneAfter: order.indexOf("extracting") },
    review: { active: ["review"], doneAfter: order.indexOf("review") },
    save: { active: ["saving"], doneAfter: order.indexOf("saving") },
  };
  const cfg = map[stepId];
  if (cfg.active.includes(phase)) return "active";
  if (phaseIndex > cfg.doneAfter) return "done";
  return "pending";
}

export default function ScanProgressTimeline({ phase, elapsedSeconds = 0, streamStage }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const status = stepStatus(step.id, phase);
          return (
            <div key={step.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  status === "done"
                    ? "bg-emerald-500 text-white"
                    : status === "active"
                      ? "bg-violet-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {status === "done" ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : status === "active" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`truncate text-xs font-black ${
                  status === "pending" ? "text-slate-400" : "text-slate-900"
                }`}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 ? (
                <div className={`mx-1 h-px flex-1 ${status === "done" ? "bg-emerald-300" : "bg-slate-200"}`} />
              ) : null}
            </div>
          );
        })}
      </div>
      {(phase === "extracting" || phase === "uploading") && (streamStage || elapsedSeconds > 0) ? (
        <p className="mt-2 text-[11px] font-semibold text-slate-500">
          {streamStage ? `שלב נוכחי: ${streamStage} · ` : ""}
          {elapsedSeconds}s
        </p>
      ) : null}
    </div>
  );
}
