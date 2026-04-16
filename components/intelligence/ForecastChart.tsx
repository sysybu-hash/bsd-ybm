"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import RechartsBounded from "@/components/RechartsBounded";
import { BrainCircuit, AlertTriangle } from "lucide-react";

const forecastData = [
  { day: "01/04", balance: 52000, type: "actual" as const },
  { day: "05/04", balance: 48000, type: "actual" as const },
  { day: "10/04", balance: 65000, type: "forecast" as const },
  {
    day: "14/04",
    balance: 12000,
    type: "forecast" as const,
    alert: "תשלום מע״מ צפוי",
  },
  { day: "20/04", balance: 35000, type: "forecast" as const },
  { day: "28/04", balance: 72000, type: "forecast" as const },
];

/** נתונים ל־Recharts: קו מלא לאקטואלי + קו מקווקו לחיזוי (רציף בנקודת המעבר) */
const chartRows = forecastData.map((d, i, arr) => {
  const prev = arr[i - 1];
  if (d.type === "actual") {
    return {
      day: d.day,
      actual: d.balance,
      forecast: null as number | null,
    };
  }
  const bridge =
    prev?.type === "actual" ? prev.balance : null;
  return {
    day: d.day,
    actual: bridge,
    forecast: d.balance,
  };
});

const primary = "var(--primary-color, #4f46e5)";

export default function ForecastChart() {
  const [insight] = useState(
    "יוחנן, שימת לב: בעוד 10 ימים (14/04) צפויה חריגה מהתקציב בגלל תשלומי מע״מ וביטוח לאומי. יתרה חזויה: ₪12,000. מומלץ להקדים גבייה מלקוח 'אקווה סטאר'.",
  );

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-8 font-sans shadow-sm"
      dir="rtl"
    >
      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-gray-100 pb-6 md:flex-row">
        <div>
          <h3 className="text-2xl font-black italic text-gray-950 flex items-center gap-2">
            <BrainCircuit className="text-teal-500" /> חיזוי תזרים מזומנים AI
          </h3>
          <p className="text-gray-400 text-sm font-medium">
            ניתוח היסטורי וצפי 30 יום קדימה (Gemini Ultra)
          </p>
        </div>
        <div className="flex max-w-xl items-start gap-3 rounded-xl border border-teal-500/20 bg-teal-500/15 p-5 text-sm leading-relaxed text-gray-600">
          <AlertTriangle
            className="text-teal-500 flex-shrink-0 mt-1"
            size={20}
            aria-hidden
          />
          <span>{insight}</span>
        </div>
      </div>

      <RechartsBounded height={400} className="font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartRows}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
                padding: "12px",
              }}
              cursor={{
                stroke: primary,
                strokeWidth: 1,
              }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="בפועל"
              stroke={primary}
              strokeWidth={3}
              dot={{
                stroke: primary,
                strokeWidth: 2,
                fill: "white",
                r: 5,
              }}
              activeDot={{ r: 8 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="חיזוי"
              stroke={primary}
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={{
                stroke: primary,
                strokeWidth: 2,
                fill: "white",
                r: 4,
              }}
              connectNulls
            />
            <ReferenceLine
              y={15000}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: "קו אדום ₪15K",
                position: "right",
                fill: "#ef4444",
                fontSize: 10,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </RechartsBounded>
    </div>
  );
}
