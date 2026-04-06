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
      className="min-h-screen bg-white/[0.03] p-8 font-sans text-white"
      dir="rtl"
    >
      <header className="mb-12">
        <h1 className="text-4xl font-black italic tracking-tighter text-indigo-400">
          {project.name}
        </h1>
        <p className="text-gray-400 font-medium">סטטוס רווחיות ופיננסים חי</p>
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
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <stat.icon className="text-gray-400 mb-4" size={24} />
            <p className="text-gray-400 text-sm mb-1 font-bold">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color ?? "text-white"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 italic">
          מד רווחיות פרויקט
        </h3>
        <div className="w-full bg-white/[0.05] h-6 rounded-full overflow-hidden border border-gray-200 p-1 flex items-center relative">
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300" />
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
        <p className="text-xs font-bold text-gray-400 mt-3 text-center">
          מחושב לפי יחס הכנסות CRM מול הוצאות ERP ששויכו לפרויקט
        </p>
      </div>
    </div>
  );
}
