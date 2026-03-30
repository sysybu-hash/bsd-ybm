"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import RechartsBounded from "@/components/RechartsBounded";
import { useI18n } from "@/components/I18nProvider";
import { intlLocaleForApp } from "@/lib/i18n/intl-locale";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

type Variant = "dark" | "light";

export default function FinancialCharts({
  data,
  variant: _variant = "light",
}: {
  data: Array<{ aiData?: { docType?: string; total?: number } | null }>;
  variant?: Variant;
}) {
  void _variant;
  const { t, locale } = useI18n();
  const intlTag = intlLocaleForApp(locale);

  const categoryData = data.reduce<{ name: string; value: number }[]>((acc, doc) => {
    const category = doc.aiData?.docType || "אחר";
    const amount = doc.aiData?.total || 0;
    const found = acc.find((item) => item.name === category);
    if (found) {
      found.value += amount;
    } else {
      acc.push({ name: category, value: amount });
    }
    return acc;
  }, []);

  const cardClass =
    "bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50";

  const titlePieClass = "text-lg font-bold mb-4 text-slate-900";
  const titleBarClass = "text-lg font-bold mb-4 text-slate-900";

  const tooltipStyle = {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
  };

  const barFill = "var(--primary-color, #3b82f6)";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
      <div className={`${cardClass} flex flex-col`}>
        <h3 className={`${titlePieClass} shrink-0`}>{t("financialCharts.pieTitle")}</h3>
        <RechartsBounded height={260} className="mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </RechartsBounded>
      </div>

      <div className={`${cardClass} flex flex-col`}>
        <h3 className={`${titleBarClass} shrink-0`}>{t("financialCharts.barTitle")}</h3>
        <RechartsBounded height={260} className="mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={8} />
              <YAxis stroke="#64748b" fontSize={12} width={48} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={tooltipStyle}
                formatter={(value: number) => [
                  `₪${Number(value).toLocaleString(intlTag)}`,
                  t("financialCharts.amountLabel"),
                ]}
              />
              <Bar dataKey="value" fill={barFill} radius={[4, 4, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </RechartsBounded>
      </div>
    </div>
  );
}
