"use client";

import { Check } from "lucide-react";

export type WizardStepDescriptor = {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
};

type Props = {
  steps: WizardStepDescriptor[];
  currentIndex: number;
  /** אילו שלבים כבר הושלמו (גם אם המשתמש חזר אחורה). */
  completedFlags: boolean[];
  onJump: (index: number) => void;
};

export default function WizardProgressRail({ steps, currentIndex, completedFlags, onJump }: Props) {
  return (
    <ol
      className="relative flex w-full items-stretch gap-1.5 overflow-x-auto rounded-3xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-rail-bg)] p-1.5 backdrop-blur-md sm:gap-2"
      aria-label="שלבי האשף"
    >
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isCompleted = completedFlags[index] === true && !isCurrent;
        const isReachable = index <= currentIndex || completedFlags[index] === true;
        return (
          <li key={step.id} className="flex min-w-0 flex-1">
            <button
              type="button"
              onClick={() => isReachable && onJump(index)}
              disabled={!isReachable}
              aria-current={isCurrent ? "step" : undefined}
              className={[
                "group relative flex w-full min-w-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-start transition-all",
                isCurrent
                  ? "bg-[color:var(--scanw-accent)] text-white shadow-[0_8px_24px_-12px_var(--scanw-accent)]"
                  : isCompleted
                    ? "bg-[color:var(--scanw-completed-bg)] text-[color:var(--scanw-completed-fg)] hover:brightness-105"
                    : "text-[color:var(--scanw-muted)] hover:bg-white/40",
                !isReachable ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black",
                  isCurrent
                    ? "bg-white/20 text-white"
                    : isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white/60 text-[color:var(--scanw-muted)]",
                ].join(" ")}
                aria-hidden
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <span className="tabular-nums">{index + 1}</span>}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-black uppercase tracking-[0.14em] opacity-80">
                  {step.shortLabel ?? step.label}
                </span>
                <span className="hidden truncate text-[13px] font-black sm:inline">{step.label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
