'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ProjectHealthRow } from '@/hooks/useCompanyFinancials';
import { formatIls } from '@/components/finance/CountUpCurrency';

const BLUE = '#004694';
const ORANGE = '#FF8C00';

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-4xl border border-gray-100 bg-white p-4 text-sm shadow-lg"
      style={{ boxShadow: `0 0 20px ${ORANGE}33` }}
    >
      <p className="mb-2 font-bold text-[#004694]">{label}</p>
      <ul className="flex flex-col gap-2 text-right">
        {payload.map((p) => (
          <li key={String(p.name)} className="flex items-center justify-between gap-6">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-mono font-bold tabular-nums">{formatIls(p.value ?? 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProjectHealthChart({
  rows,
  loading,
  companyId,
}: {
  rows: ProjectHealthRow[];
  loading: boolean;
  companyId: string | null;
}) {
  if (!companyId) return null;

  if (loading) {
    return (
      <div className="flex h-[320px] w-full max-w-6xl items-center justify-center rounded-4xl border border-gray-100 bg-white p-6">
        <p className="text-gray-400">טוען תרשים…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-[280px] w-full max-w-6xl items-center justify-center rounded-4xl border border-gray-100 bg-white p-6 text-center text-gray-500">
        אין פרויקטים להצגה. הוסיפו פרויקטים או סנכרנו נתונים מ־Meckano / סריקות AI.
      </div>
    );
  }

  const data = rows.map((r) => ({
    name: r.name,
    'תקציב מתוכנן': r.budgeted,
    'עלות בפועל': r.actual,
  }));

  return (
    <motion.div
      className="w-full max-w-6xl rounded-4xl border border-gray-100 bg-white p-6"
      style={{ boxShadow: `0 16px 48px rgba(0,70,148,0.08), 0 0 1px rgba(255,140,0,0.15)` }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      dir="rtl"
    >
      <h2 className="mb-4 text-center text-lg font-black text-[#004694] sm:text-xl">
        בריאות פרויקטים — תקציב מול בפועל
      </h2>
      <p className="mb-6 text-center text-xs text-gray-500 sm:text-sm">
        בפועל = עלות עבודה (Meckano) + חומרים (סריקות AI). תקציב = שדה budgetedCost בפרויקט או הערכה.
      </p>
      <div className="h-[min(420px,55vh)] w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 48 }}
            barGap={6}
            barCategoryGap="18%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf2" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11 }}
              interval={0}
              angle={-28}
              textAnchor="end"
              height={56}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,70,148,0.04)' }} />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              formatter={(value) => <span className="text-sm font-bold text-gray-700">{value}</span>}
            />
            <Bar
              dataKey="תקציב מתוכנן"
              fill={BLUE}
              radius={[10, 10, 0, 0]}
              maxBarSize={48}
            />
            <Bar
              dataKey="עלות בפועל"
              fill={ORANGE}
              radius={[10, 10, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
