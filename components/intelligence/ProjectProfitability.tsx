"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, DollarSign, FileText } from "lucide-react";

export default function ProjectProfitability() {
  const project = {
    name: "פיתוח אפליקציית BSD Intelligence",
    budget: 150000,
    expenses: 112000,
    invoicesSent: 90000,
  };

  const currentProfit = project.invoicesSent - project.expenses;
  const isProfitable = currentProfit > 0;

  return (
    <div
      className="min-h-screen bg-[color:var(--canvas)] p-8 font-sans text-[color:var(--ink-900)]"
      dir="rtl"
    >
      <header className="mb-12">
        <h1 className="text-4xl font-black italic tracking-tighter text-[color:var(--cd-accent)]">
          {project.name}
        </h1>
        <p className="font-medium text-[color:var(--ink-400)]">סטטוס רווחיות ופיננסים חי</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          {
            label: "תקציב פרויקט",
            value: `₪${project.budget.toLocaleString()}`,
            icon: Target,
          },
          {
            label: "הוצאות בפועל (ERP)",
            value: `₪${project.expenses.toLocaleString()}`,
            icon: FileText,
            color: "text-rose-600",
          },
          {
            label: "חשבוניות שהופקו (CRM)",
            value: `₪${project.invoicesSent.toLocaleString()}`,
            icon: DollarSign,
            color: "text-emerald-400",
          },
          {
            label: "רווח/הפסד נוכחי",
            value: `₪${currentProfit.toLocaleString()}`,
            icon: TrendingUp,
            color: isProfitable ? "text-emerald-400" : "text-rose-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-6 shadow-[var(--cd-shadow-sm)]"
          >
            <stat.icon className="mb-4 text-[color:var(--ink-400)]" size={24} />
            <p className="mb-1 text-sm font-bold text-[color:var(--ink-400)]">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color ?? "text-white"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-8 shadow-[var(--cd-shadow-sm)]">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 italic">
          מד רווחיות פרויקט
        </h3>
        <div className="relative flex h-6 w-full items-center overflow-hidden rounded-full border border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)] p-1">
          <div className="absolute start-1/2 top-0 h-full w-0.5 bg-[color:var(--ink-300)]" />
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${(currentProfit / project.budget) * 50 + 50}%`,
            }}
            className={`h-full rounded-full transition-all ${
              isProfitable ? "bg-emerald-500/15" : "bg-rose-500"
            }`}
          />
        </div>
        <p className="mt-3 text-center text-xs font-bold text-[color:var(--ink-400)]">
          מחושב לפי יחס הכנסות CRM מול הוצאות ERP ששויכו לפרויקט
        </p>
      </div>
    </div>
  );
}
