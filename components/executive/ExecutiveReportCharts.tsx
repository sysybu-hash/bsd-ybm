"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import RechartsBounded from "@/components/RechartsBounded";
import { useI18n } from "@/components/I18nProvider";
import { intlLocaleForApp } from "@/lib/i18n/intl-locale";
import type { ExecutiveFlowPoint } from "@/lib/executive-report-data";

type Props = {
  data: ExecutiveFlowPoint[];
  year: number;
};

export default function ExecutiveReportCharts({ data, year }: Props) {
  const { t, locale } = useI18n();
  const intlTag = intlLocaleForApp(locale);

  return (
    <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 md:p-10 shadow-2xl shadow-slate-200/50">
      <h3 className="text-xl md:text-2xl font-black italic text-slate-900 tracking-tight mb-2">
        {t("executiveCharts.title", { year: String(year) })}
      </h3>
      <p className="text-sm text-slate-500 font-medium mb-8">{t("executiveCharts.subtitle")}</p>
      <RechartsBounded height={340}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="execIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="execExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "1.25rem",
                border: "none",
                boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
              }}
              formatter={(value: number, name: string) => [
                `₪${value.toLocaleString(intlTag)}`,
                name === "income" ? t("executive.incomeBadge") : t("executive.expenseBadge"),
              ]}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="income"
              stroke="#2563eb"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#execIncome)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="expenses"
              stroke="#e11d48"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#execExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </RechartsBounded>
      <p className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500 justify-center">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-blue-600" /> {t("executiveCharts.legendIncome")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-rose-500" /> {t("executiveCharts.legendExpense")}
        </span>
      </p>
    </div>
  );
}
