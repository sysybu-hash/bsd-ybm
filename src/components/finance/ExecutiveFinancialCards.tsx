'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import CountUpCurrency from '@/components/finance/CountUpCurrency';

const WHITE = '#FFFFFF';
const BLUE = '#004694';
const ORANGE = '#FF8C00';
const GREEN = '#22c55e';

const GREEN_GLOW = `0 0 24px ${GREEN}88, 0 0 48px ${GREEN}44, 0 12px 40px rgba(0,70,148,0.06)`;
const ORANGE_GLOW = `0 0 24px ${ORANGE}99, 0 0 44px ${ORANGE}44, 0 12px 40px rgba(0,70,148,0.06)`;
const BLUE_GLOW = `0 0 20px ${BLUE}55, 0 12px 40px rgba(0,70,148,0.08)`;

type CardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  glow: string;
  accent: string;
  delay: number;
};

function ExecutiveCard({ title, value, icon, glow, accent, delay }: CardProps) {
  return (
    <motion.article
      className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-gray-100 p-6"
      style={{
        backgroundColor: WHITE,
        boxShadow: glow,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 26 }}
      whileHover={{ y: -4, boxShadow: glow.replace('0.06)', '0.12)') }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-4xl text-white"
        style={{ backgroundColor: accent, boxShadow: `0 8px 24px ${accent}66` }}
      >
        {icon}
      </div>
      <h3 className="text-center text-sm font-bold text-[#004694]">{title}</h3>
      <p className="text-center text-2xl font-black tabular-nums text-[#1a1a1a] sm:text-3xl">
        <CountUpCurrency value={value} />
      </p>
    </motion.article>
  );
}

export default function ExecutiveFinancialCards({
  revenue,
  expenses,
  netProfit,
  loading,
  companyId,
}: {
  revenue: number;
  expenses: number;
  netProfit: number;
  loading: boolean;
  companyId: string | null;
}) {
  if (!companyId) {
    return (
      <div className="flex w-full max-w-6xl items-center justify-center rounded-4xl border border-gray-100 bg-white p-6 text-center text-gray-500">
        בחרו חברה מהמתג בצד כדי לטעון נתונים כספיים.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex min-h-[180px] animate-pulse items-center justify-center rounded-4xl bg-gray-50 p-6"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
      <ExecutiveCard
        title="סה״כ הכנסות"
        value={revenue}
        icon={<TrendingUp className="h-7 w-7" aria-hidden />}
        glow={BLUE_GLOW}
        accent={BLUE}
        delay={0}
      />
      <ExecutiveCard
        title="סה״כ הוצאות"
        value={expenses}
        icon={<TrendingDown className="h-7 w-7" aria-hidden />}
        glow={ORANGE_GLOW}
        accent={ORANGE}
        delay={0.08}
      />
      <ExecutiveCard
        title="רווח נקי (פרויקטים)"
        value={netProfit}
        icon={<Scale className="h-7 w-7" aria-hidden />}
        glow={netProfit >= 0 ? GREEN_GLOW : ORANGE_GLOW}
        accent={netProfit >= 0 ? GREEN : ORANGE}
        delay={0.16}
      />
    </div>
  );
}
