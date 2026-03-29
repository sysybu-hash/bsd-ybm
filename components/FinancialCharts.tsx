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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

type Variant = "dark" | "light";

export default function FinancialCharts({
  data,
  variant = "dark",
}: {
  data: Array<{ aiData?: { docType?: string; total?: number } | null }>;
  variant?: Variant;
}) {
  const isLight = variant === "light";

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

  const cardClass = isLight
    ? "bg-white p-6 rounded-3xl border border-slate-100 shadow-lg  shadow-slate-200/50"
    : "bg-slate-900/50 p-6 rounded-3xl border border-white/5";

  const titlePie = isLight ? "text-lg font-bold mb-4 text-slate-900" : "text-lg font-bold mb-4 text-blue-400";
  const titleBar = isLight ? "text-lg font-bold mb-4 text-slate-900" : "text-lg font-bold mb-4 text-emerald-400";

  const tooltipStyle = isLight
    ? { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }
    : { backgroundColor: "#0f172a", border: "none", borderRadius: "8px" };

  const barFill = isLight ? "var(--primary-color, #3b82f6)" : "#3b82f6";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[350px] mb-10">
      <div className={cardClass}>
        <h3 className={titlePie}>התפלגות הוצאות (ERP)</h3>
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
      </div>

      <div className={cardClass}>
        <h3 className={titleBar}>השוואת תזרים</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              cursor={isLight ? { fill: "#f1f5f9" } : { fill: "#1e293b" }}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="value" fill={barFill} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
