"use client";

import { formatCreditsForDisplay } from "@/lib/org-credits-display";

type Props = {
  cheapLeft: number;
  cheapIncluded: number;
  premiumLeft: number;
  premiumIncluded: number;
};

function barPct(left: number, included: number): number {
  const denom = Math.max(included, left, 1);
  return Math.min(100, Math.round((left / denom) * 100));
}

export default function ScanUsageProgress({
  cheapLeft,
  cheapIncluded,
  premiumLeft,
  premiumIncluded,
}: Props) {
  const cheapBar = barPct(cheapLeft, cheapIncluded);
  const premBar = barPct(premiumLeft, premiumIncluded);

  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
      dir="rtl"
    >
      <h2 className="text-lg font-black text-white mb-1">ניצול סריקות</h2>
      <p className="text-xs text-gray-400 mb-6">
        זולות (Gemini) מול פרימיום (OpenAI / Anthropic). הבר מציג יחס יתרה לעומת המכסה הבסיסית מהמנוי; רכישת בנדל מגדילה
        את היתרה.
      </p>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
            <span>סריקות זולות</span>
            <span className="tabular-nums">
              נותרו {formatCreditsForDisplay(cheapLeft)} · כלול במנוי עד {cheapIncluded}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden ring-1 ring-gray-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-l from-sky-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${cheapBar}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
            <span>סריקות פרימיום</span>
            <span className="tabular-nums">
              נותרו {formatCreditsForDisplay(premiumLeft)} · כלול במנוי עד {premiumIncluded}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden ring-1 ring-gray-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-sky-500 transition-all duration-500"
              style={{ width: `${premBar}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
