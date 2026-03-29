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

export default function ForecastChart() {
  const [insight] = useState(
    "יוחנן, שימת לב: בעוד 10 ימים (14/04) צפויה חריגה מהתקציב בגלל תשלומי מע״מ וביטוח לאומי. יתרה חזויה: ₪12,000. מומלץ להקדים גבייה מלקוח 'אקווה סטאר'.",
  );

  return (
    <div
      className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 font-sans"
      dir="rtl"
    >
      <div className="flex flex-col md:flex-row gap-6 justify-between mb-10 border-b border-slate-100 pb-8">
        <div>
          <h3 className="text-2xl font-black italic text-slate-950 flex items-center gap-2">
            <BrainCircuit className="text-blue-500" /> חיזוי תזרים מזומנים AI
          </h3>
          <p className="text-slate-400 text-sm font-medium">
            ניתוח היסטורי וצפי 30 יום קדימה (Gemini Ultra)
          </p>
        </div>
        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 max-w-xl text-sm text-slate-700 leading-relaxed flex items-start gap-3">
          <AlertTriangle
            className="text-blue-500 flex-shrink-0 mt-1"
            size={20}
            aria-hidden
          />
          <span>{insight}</span>
        </div>
      </div>

      <div className="h-[400px] w-full font-mono">
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
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                padding: "15px",
              }}
              cursor={{
                stroke: "var(--primary-color, #3b82f6)",
                strokeWidth: 1,
              }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="בפועל"
              stroke="var(--primary-color, #3b82f6)"
              strokeWidth={3}
              dot={{
                stroke: "var(--primary-color, #3b82f6)",
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
              stroke="var(--primary-color, #3b82f6)"
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={{
                stroke: "var(--primary-color, #3b82f6)",
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
      </div>
    </div>
  );
}
