"use client";

import { Sparkles } from "lucide-react";
import type { ScanWizardProfile } from "@/lib/professions/scan-wizard";

type Props = {
  profile: ScanWizardProfile;
  /** "סריקה" / "NotebookLM" — הטאב הפעיל ב-shell, לתצוגה */
  modeLabel?: string;
};

export default function IndustryHero({ profile, modeLabel = "סריקה" }: Props) {
  const tradeChip = profile.tradeLabel ?? profile.industryLabel;
  return (
    <header className="relative shrink-0 overflow-hidden rounded-3xl border border-[color:var(--scanw-line)] bg-[color:var(--scanw-hero-bg)] p-5 shadow-sm sm:p-7">
      {/* רקע אורקטיבי */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div className="absolute -top-12 -end-12 h-44 w-44 rounded-full bg-[color:var(--scanw-glow-1)] blur-3xl" />
        <div className="absolute -bottom-16 -start-12 h-56 w-56 rounded-full bg-[color:var(--scanw-glow-2)] blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--scanw-muted)] backdrop-blur">
            <Sparkles className="h-3 w-3 text-[color:var(--scanw-accent)]" aria-hidden />
            {modeLabel} · {tradeChip}
          </span>
          <h1 className="mt-2 text-2xl font-black leading-tight text-[color:var(--scanw-ink)] sm:text-[28px]">
            {profile.heroTitle}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-relaxed text-[color:var(--scanw-muted)]">
            {profile.heroSubtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
