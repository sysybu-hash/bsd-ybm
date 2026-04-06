"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import RechartsBounded from "@/components/RechartsBounded";
import { useI18n } from "@/components/I18nProvider";
import { AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";

type Row = { date: string; price: number };

export default function PriceComparisonChart({
  data,
  productName,
}: {
  data: Row[];
  productName: string;
}) {
  const { t, dir } = useI18n();

  const ordered = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const latest = ordered[ordered.length - 1];
  const previous = ordered.length >= 2 ? ordered[ordered.length - 2] : undefined;
  const diff =
    latest && previous && previous.price > 0
      ? ((latest.price - previous.price) / previous.price) * 100
      : 0;

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm" dir={dir}>
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tighter italic">
            {t("priceCompare.title", { name: productName })}
          </h3>
          <p className="text-gray-400 font-medium">{t("priceCompare.subtitle")}</p>
        </div>
        <div
          className={`p-4 rounded-2xl flex items-center gap-2 font-black ${
            diff > 0 ? "bg-rose-500/[0.08] text-rose-400" : "bg-green-50 text-green-600"
          }`}
        >
          {diff > 0 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          {diff > 0
            ? t("priceCompare.up", { pct: diff.toFixed(1) })
            : ordered.length < 2
              ? t("priceCompare.noPoints")
              : t("priceCompare.change", { pct: Math.abs(diff).toFixed(1) })}
        </div>
      </div>

      {ordered.length === 0 ? (
        <p className="text-center text-gray-400 py-16">{t("priceCompare.noData")}</p>
      ) : (
        <RechartsBounded height={250}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ordered} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v) => `₪${v}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "1.5rem",
                  border: "none",
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ fontWeight: "bold", color: "#1e293b" }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                strokeWidth={4}
                dot={{ r: 6, fill: "#2563eb", strokeWidth: 3, stroke: "#fff" }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </RechartsBounded>
      )}

      {latest && previous ? (
        <div className="flex items-start gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/15 p-6">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shrink-0">
            <Lightbulb size={20} />
          </div>
          <div>
            <p className="text-white font-black text-sm uppercase tracking-widest">
              {t("priceCompare.insightKicker")}
            </p>
            <p className="text-indigo-800 text-sm mt-1 leading-relaxed">
              {t("priceCompare.insightBody", {
                diff: (latest.price - previous.price).toFixed(2),
              })}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
