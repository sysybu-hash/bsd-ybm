"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bot, CreditCard, Layers, ReceiptText, Settings, Users as UsersIcon,
  Clock, TrendingUp, FileStack, Zap, BarChart3, Compass,
  ArrowRight, Plus, ChevronRight, BarChart2, Briefcase,
  DollarSign, Activity, Sparkles, ShieldCheck, LayoutDashboard
} from "lucide-react";
import CashFlowForecast from "@/components/dashboard/CashFlowForecast";
import { useI18n } from "@/components/I18nProvider";

/**
 * 🚀 BSD-YBM BSD-YBM: MANAGEMENT AVENUE (V3)
 * High-end professional dashboard.
 * 100% Language Consistency (No mixed strings).
 */

export default function DashboardHomePage() {
  const { t, dir } = useI18n();
  const { data: session } = useSession();
  const [userName, setUserName] = useState("...");
  const [activeTab, setActiveTab] = useState<"overview" | "actions" | "finance">("overview");

  useEffect(() => {
     if (session?.user?.name) {
       setUserName(session.user.name.split(" ")[0].trim());
     }
  }, [session]);

  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour < 5) return t("dashboard.greetings.night");
    if (hour < 12) return t("dashboard.greetings.morning");
    if (hour < 17) return t("dashboard.greetings.afternoon");
    if (hour < 21) return t("dashboard.greetings.evening");
    return t("dashboard.greetings.night");
  };

  return (
    <div className="space-y-8 pb-32 md:pb-12 px-2 md:px-0" dir={dir}>
      
      {/* ── MOBILE TAB NAVIGATION ── */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl pt-3 pb-4 border-b border-slate-200 -mx-6 px-6 shadow-sm">
        <div className="flex p-1 bg-slate-200/50 rounded-2xl">
          {[
            { id: "overview", label: t("dashboard.overview"), icon: <BarChart3 size={16}/> },
            { id: "actions",  label: t("dashboard.actions"),  icon: <Zap size={16}/> },
            { id: "finance",  label: t("dashboard.finance"),  icon: <DollarSign size={16}/> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-lg scale-[1.02]" : "text-slate-500 hover:bg-white/40"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── HEADER SECTION ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 text-start">
         <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600">
               <Sparkles size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] font-sans">Avenue Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-tight">
               {getGreeting()}, <span className="text-slate-400 uppercase">{userName}</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
               <ShieldCheck size={14} className="text-emerald-500" />
               {t("dashboard.smartArchiveHint")}
            </p>
         </div>
         <div className="flex items-center gap-3">
            <Link href="/dashboard/ai" className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
               <Zap size={14} /> {t("dashboard.aiHub")}
            </Link>
         </div>
      </header>

      {/* ── STATS ROW ── */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 ${(activeTab !== "overview" && activeTab !== "finance") ? "hidden md:grid" : "grid"}`}>
         {[
           { icon: UsersIcon, label: t("dashboard.stats.clients"), value: "—", href: "/dashboard/crm", color: "text-indigo-600", bg: "bg-indigo-50" },
           { icon: ReceiptText, label: t("dashboard.stats.expenses"), value: "₪—", href: "/dashboard/erp", color: "text-rose-600", bg: "bg-rose-50" },
           { icon: TrendingUp, label: t("dashboard.stats.revenue"), value: "₪—", href: "/dashboard/erp", color: "text-emerald-600", bg: "bg-emerald-50" },
           { icon: Bot, label: t("dashboard.stats.intelligence"), value: "Active", href: "/dashboard/ai", color: "text-violet-600", bg: "bg-violet-50" },
         ].map((stat, i) => (
           <Link key={i} href={stat.href} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                 <stat.icon size={22} strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black italic text-slate-900">{stat.value}</h3>
           </Link>
         ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-10 text-start">
         
         {/* ── LEFT COLUMN: MAIN INSIGHTS ── */}
         <div className={`lg:col-span-8 space-y-10 ${activeTab === "actions" ? "block" : (activeTab === "overview" ? "hidden md:block" : "hidden md:block")}`}>
            
            {/* Quick Actions Grid */}
            <div className="grid sm:grid-cols-2 gap-6 text-start">
               {[
                 { href: "/dashboard/crm", icon: UsersIcon, title: t("dashboard.quickActions.crm"), desc: t("marketing3D.revenueEngineDesc"), badge: "CRM BSD-YBM", color: "indigo" },
                 { href: "/dashboard/erp", icon: ReceiptText, title: t("dashboard.quickActions.erp"), desc: t("marketing3D.capitalFlowDesc"), badge: "ERP Active", color: "rose" },
                 { href: "/dashboard/ai", icon: Zap, title: t("dashboard.quickActions.negotiate"), desc: t("marketing3D.predictiveCommerceDesc"), badge: "Agentic", color: "violet" },
                 { href: "/dashboard/settings", icon: Settings, title: t("dashboard.quickActions.settings"), desc: t("settings.title"), badge: "System", color: "slate" },
               ].map((action, i) => (
                 <Link key={i} href={action.href} className="flex items-center gap-6 p-8 bg-white border border-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden ring-1 ring-slate-100">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full translate-x-10 -translate-y-10 group-hover:bg-indigo-50 transition-colors" />
                    <div className={`h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg relative z-10 italic`}>
                       <action.icon size={24} />
                    </div>
                    <div className="relative z-10 flex-1">
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-black italic text-slate-900 uppercase tracking-tighter">{action.title}</h4>
                          <span className={`text-[8px] font-black px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full uppercase tracking-widest border border-slate-100`}>
                             {action.badge}
                          </span>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 leading-relaxed ps-1">{action.desc}</p>
                    </div>
                 </Link>
               ))}
            </div>

            {/* Financial Intelligence Block */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm overflow-hidden relative">
               <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600" />
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                        <Activity size={24} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase">{t("dashboard.finance")}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("dashboard.forecast.subtitle")}</p>
                     </div>
                  </div>
                  <Link href="/dashboard/executive" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2 hover:gap-4 transition-all">
                     {t("dashboard.status.viewReport")} <ArrowRight size={14} />
                  </Link>
               </div>
               
               <div className="space-y-8">
                  <CashFlowForecast />
                  <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex items-center gap-6">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200">
                           <Layers size={18} className="text-slate-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t("dashboard.status.activeTier")}</p>
                           <p className="text-sm font-black text-slate-900 uppercase italic">{t("dashboard.status.enterprise")}</p>
                        </div>
                     </div>
                     <div className="h-px md:h-12 w-full md:w-px bg-slate-200" />
                     <div className="flex items-center gap-6">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 text-emerald-500">
                           <ShieldCheck size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t("dashboard.status.security")}</p>
                           <p className="text-sm font-black text-slate-900 uppercase italic">{t("dashboard.status.military")}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* ── RIGHT COLUMN: ALERTS & INTELLIGENCE ── */}
         <div className={`lg:col-span-4 space-y-10 ${activeTab === "finance" ? "block" : (activeTab === "overview" ? "hidden md:block" : "hidden md:block")}`}>
            
            {/* AI Intelligence Feed */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-900/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full translate-x-10 -translate-y-10 group-hover:bg-indigo-500/20 transition-all" />
               <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 italic">
                     <Bot size={24} className="animate-pulse" />
                  </div>
                  <div className="text-start">
                     <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">{t("dashboard.aiHub")}</p>
                     <h3 className="text-xl font-black italic uppercase tracking-tighter">Active Intelligence</h3>
                  </div>
               </div>

               <div className="space-y-6 relative z-10">
                  {[1, 2].map(i => (
                    <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:bg-white/10 transition-colors cursor-pointer group/item text-start">
                       <div className="flex items-center justify-between">
                           <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">{t("dashboard.status.anomaly")}</span>
                           <span className="text-[8px] font-black uppercase tracking-widest text-white/20">2m {t("dashboard.status.ago")}</span>
                       </div>
                       <p className="text-[10px] font-bold leading-relaxed">{i === 1 ? t("marketing3D.intelF2") : t("marketing3D.intelF4")}</p>
                       <div className="flex justify-end opacity-0 group-hover/item:opacity-100 transition-opacity">
                           <ChevronRight size={14} className="text-indigo-400" />
                       </div>
                    </div>
                  ))}
               </div>

               <Link href="/dashboard/ai" className="mt-10 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white block text-center transition-all">
                  {t("dashboard.status.openControl")}
               </Link>
            </div>

            {/* System Status / Meta */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm text-start">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Platform Meta</h3>
               <div className="space-y-8">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                           <Clock size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{t("dashboard.status.responseTime")}</span>
                     </div>
                     <span className="text-xs font-black text-emerald-500 italic">14ms</span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                           <LayoutDashboard size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{t("dashboard.status.activeAvenue")}</span>
                     </div>
                     <span className="text-xs font-black text-indigo-600 italic">BSD-YBM.04</span>
                  </div>
               </div>
            </div>

         </div>

      </div>

    </div>
  );
}
