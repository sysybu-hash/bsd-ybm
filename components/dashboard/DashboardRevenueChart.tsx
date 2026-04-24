"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import RechartsBounded from "@/components/RechartsBounded";
import type { DashboardChartPoint } from "@/lib/dashboard-home-data";

type Props = {
  data: DashboardChartPoint[];
};

export default function DashboardRevenueChart({ data }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h4 className="text-lg font-bold text-gray-900 mb-1">הכנסות לפי חודש (מסמכים שהונפקו)</h4>
      <p className="text-xs text-gray-400 mb-6 font-medium">
        סכום כולל מחשבוניות / קבלות שהונפקו ב־ERP — שישה חודשים אחרונים
      </p>
      <RechartsBounded height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `₪${(v / 1000).toFixed(0)}k` : `₪${v}`)}
            />
            <Tooltip
              cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
              contentStyle={{
                borderRadius: "1rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number) => [`₪${value.toLocaleString("he-IL")}`, "סה״כ"]}
            />
            <Bar dataKey="total" fill="var(--primary-color, #3b82f6)" radius={[10, 10, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </RechartsBounded>
      <p className="mt-4 text-center">
        <a
      href="/app/settings/billing"
          className="text-sm font-bold text-teal-300 hover:text-teal-800 underline underline-offset-2"
        >
          ניהול מסמכים ב־ERP
        </a>
      </p>
    </div>
  );
}
