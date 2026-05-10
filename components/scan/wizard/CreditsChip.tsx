"use client";

import { Gauge } from "lucide-react";

type Props = {
  label?: string;
};

/**
 * Credits indicator. Currently a static placeholder — real usage will be
 * wired to /api/scan/credits via SWR in a follow-up. Kept as its own component
 * so we don't rebuild the visual when wiring data later.
 */
export default function CreditsChip({ label = "סריקות" }: Props) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--scanw-line)] bg-white/70 px-2.5 py-1 text-[11px] font-black text-[color:var(--scanw-ink)] backdrop-blur">
      <Gauge className="h-3.5 w-3.5 text-[color:var(--scanw-accent)]" aria-hidden />
      <span className="tabular-nums">— / —</span>
      <span className="text-[color:var(--scanw-muted)]">{label}</span>
    </div>
  );
}
