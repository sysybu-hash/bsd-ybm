"use client";

import { useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import RechartsBounded from "@/components/RechartsBounded";
import { BrainCircuit } from "lucide-react";

const baseData = [
  { day: "01/04", balance: 52000, type: "actual" as const },
  { day: "15/04", balance: 45000, type: "forecast" as const },
  { day: "30/04", balance: 60000, type: "forecast" as const },
];

const primary = "#4f46e5";

export default function ForecastSimulator() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [extraExpense, setExtraExpense] = useState(0);

  const displayData = baseData.map((d) => ({
    ...d,
    balance: d.type === "forecast" ? d.balance - extraExpense : d.balance,
  }));

  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      dir="rtl"
    >
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div className="text-start">
          <h3 className="text-2xl font-black italic flex items-center gap-2 text-gray-900">
            <BrainCircuit className="text-indigo-500" /> חיזוי וסימולציה AI
          </h3>
          <p className="text-gray-400 text-sm italic font-medium">
            נתח את העתיד ושחק עם תרחישים פיננסיים
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsSimulating(!isSimulating);
            setExtraExpense(0);
          }}
          className={`rounded-xl px-6 py-2 text-sm font-bold transition-all ${
            isSimulating
              ? "border border-rose-200 bg-rose-50 text-rose-600"
              : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-95"
          }`}
        >
          {isSimulating ? 'בטל סימולציה' : 'מצב "מה אם?"'}
        </button>
      </div>

      {isSimulating ? (
        <div
          className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <span className="text-sm font-bold text-gray-500">
            הוסף הוצאה צפויה (₪):
          </span>
          <input
            type="number"
            onChange={(e) => setExtraExpense(Number(e.target.value))}
            className="w-32 rounded-xl border border-gray-200 bg-white p-2 text-indigo-400 outline-none ring-0 transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300"
            placeholder="0"
          />
          {extraExpense > 20000 ? (
            <span className="text-rose-500 text-xs font-bold animate-pulse">
              ⚠️ סכנה לתזרים
            </span>
          ) : null}
        </div>
      ) : null}

      <RechartsBounded height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primary} stopOpacity={0.22} />
                <stop offset="95%" stopColor={primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 600 }}
              tickMargin={12}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
                fontSize: "13px",
                fontWeight: "bold",
                textAlign: "right"
              }}
              formatter={(value: number) => [`₪${value.toLocaleString()}`, "יתרה חזויה"]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={primary}
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorBal)"
              animationDuration={1000}
            />
            <ReferenceLine y={15000} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'קו סכנה', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
          </AreaChart>
        </ResponsiveContainer>
      </RechartsBounded>
    </div>
  );
}
