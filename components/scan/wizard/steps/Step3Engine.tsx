"use client";

import { Bolt, Layers, Sparkles } from "lucide-react";
import type { EngineCardConfig, EngineCardId, ScanWizardProfile } from "@/lib/professions/scan-wizard";
import type { EngineRunMode } from "@/components/scan/state/scan-machine";

type Props = {
  profile: ScanWizardProfile;
  selectedEngineRunMode: EngineRunMode;
  onSelect: (engineRunMode: EngineRunMode, cardId: EngineCardId) => void;
};

const ICON_MAP: Record<EngineCardId, React.ElementType> = {
  RECOMMENDED: Sparkles,
  FAST: Bolt,
  ADVANCED: Layers,
};

export default function Step3Engine({ profile, selectedEngineRunMode, onSelect }: Props) {
  return (
    <div className="grid gap-3">
      <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--scanw-muted)]">
        איך לפענח את המסמך?
      </h2>
      <div className="grid gap-2.5 md:grid-cols-3">
        {profile.engineCards.map((card: EngineCardConfig) => {
          const Icon = ICON_MAP[card.id];
          const active = card.engineRunMode === selectedEngineRunMode;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.engineRunMode, card.id)}
              className={[
                "group flex flex-col items-start gap-3 rounded-3xl border p-5 text-start transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] active:scale-[0.99]",
                active
                  ? "border-[color:var(--scanw-accent)] bg-[color:var(--scanw-accent-soft)] shadow-[0_12px_32px_-20px_var(--scanw-accent)]"
                  : "border-[color:var(--scanw-line)] bg-white/70 hover:border-[color:var(--scanw-accent-muted)] hover:bg-white",
              ].join(" ")}
            >
              <div className="flex w-full items-center justify-between">
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
                {card.id === "RECOMMENDED" ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    מומלץ
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-[color:var(--scanw-ink)]">{card.label}</p>
                <p className="mt-0.5 text-xs font-semibold text-[color:var(--scanw-muted)]">{card.hint}</p>
              </div>
              <dl className="grid w-full grid-cols-2 gap-2 text-[11px] font-black text-[color:var(--scanw-muted)]">
                <div>
                  <dt className="opacity-70">זמן ממוצע</dt>
                  <dd className="text-sm text-[color:var(--scanw-ink)] tabular-nums">~{card.estimatedSeconds} שנ׳</dd>
                </div>
                <div>
                  <dt className="opacity-70">עלות</dt>
                  <dd className="text-sm text-[color:var(--scanw-ink)] tabular-nums">{card.creditsCost} {card.creditsCost === 1 ? "סריקה" : "סריקות"}</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
    </div>
  );
}
