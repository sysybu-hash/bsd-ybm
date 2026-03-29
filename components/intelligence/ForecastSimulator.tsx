"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

export default function ForecastSimulator() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [extraExpense, setExtraExpense] = useState(0);

  const displayData = baseData.map((d) => ({
    ...d,
    balance: d.type === "forecast" ? d.balance - extraExpense : d.balance,
  }));

  return (
    <div
      className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50"
      dir="rtl"
    >
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-black italic flex items-center gap-2 text-slate-900">
            <BrainCircuit className="text-blue-500" /> חיזוי וסימולציה AI
          </h3>
          <p className="text-slate-400 text-sm italic font-medium">
            נתח את העתיד ושחק עם תרחישים פיננסיים
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsSimulating(!isSimulating);
            setExtraExpense(0);
          }}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
            isSimulating
              ? "bg-rose-50 text-rose-600 border border-rose-100"
              : "bg-blue-600 text-white shadow-lg shadow-blue-200"
          }`}
        >
          {isSimulating ? 'בטל סימולציה' : 'מצב "מה אם?"'}
        </button>
      </div>

      {isSimulating ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-wrap gap-4 items-center"
        >
          <span className="text-sm font-bold text-slate-600">
            הוסף הוצאה צפויה (₪):
          </span>
          <input
            type="number"
            onChange={(e) => setExtraExpense(Number(e.target.value))}
            className="bg-white border border-slate-200 p-2 rounded-lg w-32 font-bold text-blue-600"
            placeholder="0"
          />
          {extraExpense > 20000 ? (
            <span className="text-rose-500 text-xs font-bold animate-pulse">
              סכנה לתזרים
            </span>
          ) : null}
        </motion.div>
      ) : null}

      <RechartsBounded height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: "20px",
                border: "none",
                boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorBal)"
            />
            <ReferenceLine y={15000} stroke="#ef4444" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </RechartsBounded>
    </div>
  );
}
