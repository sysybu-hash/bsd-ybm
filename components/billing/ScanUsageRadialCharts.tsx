"use client";

import { useId } from "react";
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
  /** light — כרטיס בהיר כמו שאר הדשבורד; dark — זכוכית כהה (legacy) */
  variant?: "light" | "dark";
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
  gradientId,
  isLight,
}: {
  title: string;
  left: number;
  included: number;
  cheapTone: boolean;
  gradientId: string;
  isLight: boolean;
}) {
  const pct = remainingPercent(left, included);
  const data = [{ name: "נותרו", value: pct, fill: `url(#${gradientId})` }];
  const centerMain = isLight ? "#0f172a" : "#ffffff";
  const centerSub = isLight ? "#64748b" : "#94a3b8";

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center">
      <p
        className={`mb-2 text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}
      >
        {title}
      </p>
      <div className="h-[min(220px,45vw)] w-full max-w-[220px] min-h-[180px]">
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
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                {cheapTone ? (
                  <>
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="55%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#92400e" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#f1f5f9" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </>
                )}
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{
                fill: isLight ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.15)",
              }}
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
                        <tspan x={cx} y={cy - 6} fill={centerMain} fontSize={26} fontWeight={800}>
                          {pct}%
                        </tspan>
                        <tspan x={cx} y={cy + 14} fill={centerSub} fontSize={11} fontWeight={600}>
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
      <p
        className={`mt-2 text-sm font-medium tabular-nums ${isLight ? "text-slate-600" : "text-slate-300"}`}
      >
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
  variant: _variant = "light",
}: Props) {
  void _variant;
  const uid = useId().replace(/:/g, "");
  const cheapGrad = `scan-cheap-${uid}`;
  const premGrad = `scan-prem-${uid}`;
  const isLight = true;

  return (
    <section
      className="rounded-[1.75rem] border border-slate-200/90 bg-white/85 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-md ring-1 ring-slate-100/90 md:p-8"
      dir="rtl"
    >
      <h2 className="mb-1 text-lg font-black text-slate-900">
        ניצול סריקות
      </h2>
      <p className="mb-8 max-w-xl text-xs font-medium leading-relaxed text-slate-600">
        זולות (Gemini) מול פרימיום (OpenAI / Claude). הטבעת מציגה יחס יתרה לעומת תקרת התצוגה (מכסת המנוי או
        היתרה הגבוהה יותר).
      </p>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
        <Ring
          title="סריקות זולות"
          left={cheapLeft}
          included={cheapIncluded}
          cheapTone
          gradientId={cheapGrad}
          isLight={isLight}
        />
        <Ring
          title="סריקות פרימיום"
          left={premiumLeft}
          included={premiumIncluded}
          cheapTone={false}
          gradientId={premGrad}
          isLight={isLight}
        />
      </div>
    </section>
  );
}
