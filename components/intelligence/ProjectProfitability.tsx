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
      className="min-h-screen bg-[#f8fafc] p-8 text-slate-900 font-sans"
      dir="rtl"
    >
      <header className="mb-12">
        <h1 className="text-4xl font-black italic tracking-tighter text-blue-600">
          {project.name}
        </h1>
        <p className="text-slate-500 font-medium">סטטוס רווחיות ופיננסים חי</p>
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
            color: "text-emerald-600",
          },
          {
            label: "רווח/הפסד נוכחי",
            value: `₪${currentProfit.toLocaleString()}`,
            icon: TrendingUp,
            color: isProfitable ? "text-emerald-600" : "text-rose-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/40"
          >
            <stat.icon className="text-slate-400 mb-4" size={24} />
            <p className="text-slate-500 text-sm mb-1 font-bold">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color ?? "text-slate-900"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 italic">
          מד רווחיות פרויקט
        </h3>
        <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden border border-slate-200 p-1 flex items-center relative">
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-300" />
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${(currentProfit / project.budget) * 50 + 50}%`,
            }}
            className={`h-full rounded-full transition-all ${
              isProfitable ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
        </div>
        <p className="text-xs font-bold text-slate-400 mt-3 text-center">
          מחושב לפי יחס הכנסות CRM מול הוצאות ERP ששויכו לפרויקט
        </p>
      </div>
    </div>
  );
}
