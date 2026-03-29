"use client";

import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
  Label,
} from "recharts";
import { formatCreditsForDisplay } from "@/lib/org-credits-display";

type Props = {
  cheapLeft: number;
  cheapIncluded: number;
  premiumLeft: number;
  premiumIncluded: number;
};

/** אחוז „נותר” מתוך תקרה להצגה (מכסת מנוי או יתרה הגבוהה ממנה אחרי בנדלים) */
function remainingPercent(left: number, included: number): number {
  const cap = Math.max(included, left, 1);
  return Math.min(100, Math.round((left / cap) * 100));
}

function Ring({
  title,
  left,
  included,
  cheapTone,
}: {
  title: string;
  left: number;
  included: number;
  cheapTone: boolean;
}) {
  const pct = remainingPercent(left, included);
  const data = [{ name: "נותרו", value: pct, fill: cheapTone ? "#38bdf8" : "#a78bfa" }];
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{title}</p>
      <div className="h-[180px] w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="58%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
            cx="50%"
            cy="50%"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: "rgba(148,163,184,0.15)" }}
              dataKey="value"
              cornerRadius={8}
            >
              <Label
                position="center"
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const cx = (viewBox as { cx: number; cy: number }).cx;
                    const cy = (viewBox as { cx: number; cy: number }).cy;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy - 6} className="fill-white text-2xl font-black">
                          {pct}%
                        </tspan>
                        <tspan x={cx} y={cy + 14} className="fill-slate-400 text-[10px] font-semibold">
                          נותרו
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-slate-300 font-medium tabular-nums mt-1">
        {formatCreditsForDisplay(left)} נותרו · עד {included} במנוי
      </p>
    </div>
  );
}

export default function ScanUsageRadialCharts({
  cheapLeft,
  cheapIncluded,
  premiumLeft,
  premiumIncluded,
}: Props) {
  return (
    <section
      className="rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-black/40"
      dir="rtl"
    >
      <h2 className="text-lg font-black text-white mb-1">ניצול סריקות</h2>
      <p className="text-xs text-slate-400 mb-8 max-w-xl">
        זולות (Gemini) מול פרימיום (OpenAI / Claude). הטבעת מציגה יחס יתרה לעומת תקרת התצוגה (מכסת המנוי או
        היתרה הגבוהה יותר).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4">
        <Ring title="סריקות זולות" left={cheapLeft} included={cheapIncluded} cheapTone />
        <Ring title="סריקות פרימיום" left={premiumLeft} included={premiumIncluded} cheapTone={false} />
      </div>
    </section>
  );
}
