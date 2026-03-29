"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const primary = "var(--primary-color, #3b82f6)";

export type ErpStatCard = {
  label: string;
  value: string;
  trend: string;
  /** מחלקת צבע לערך מספרי */
  valueClass: string;
};

type Props = {
  stats: ErpStatCard[];
  chartData: { name: string; value: number }[];
  creditsRemaining: number | null;
  creditsAllowance: number | null;
};

export default function ERPDashboard({
  stats,
  chartData,
  creditsRemaining,
  creditsAllowance,
}: Props) {
  const quotaLabel =
    creditsRemaining != null && creditsAllowance != null
      ? `${creditsRemaining} / ${creditsAllowance}`
      : "—";

  return (
    <div className="space-y-12" dir="rtl">
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-end">
        <div>
          <h1
            className="text-4xl font-black italic tracking-tighter"
            style={{ color: primary }}
          >
            ניהול פיננסי חכם
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            סקירה כללית של הוצאות ומסמכים ב־BSD-YBM
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm shrink-0">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">
            יתרת סריקות (מכסה חודשית)
          </p>
          <p className="text-3xl font-black text-slate-900">
            {quotaLabel}{" "}
            {creditsAllowance != null && (
              <span className="text-sm text-slate-400 font-normal">נקודות</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40"
          >
            <p className="text-slate-500 text-sm mb-2 font-bold">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.valueClass}`}>{stat.value}</p>
            <div className="mt-4 text-xs font-bold bg-slate-50 inline-block px-3 py-1 rounded-full text-slate-500">
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30">
        <h3 className="text-xl font-black mb-8 italic text-slate-900">
          מגמת הוצאות (חודשים אחרונים)
        </h3>
        <div className="h-[400px] w-full min-h-[280px]">
          {chartData.length === 0 ? (
            <p className="text-slate-400 text-center py-20">אין עדיין נתונים להצגת גרף</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
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
                  }}
                  formatter={(value: number) => [`₪${value.toLocaleString()}`, "הוצאות"]}
                />
                <Bar dataKey="value" fill={primary} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
