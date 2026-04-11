"use client";

import React, { useState } from "react";
import { 
  Users, 
  Layers, 
  ReceiptText, 
  LayoutDashboard,
  ShieldCheck,
  Activity,
  Zap,
  Bot,
  Sparkles
} from "lucide-react";
import CrmClient from "@/app/dashboard/(protected)/crm/CrmClient";
import MissionControl from "@/components/MissionControl";
import ERPDashboard from "@/components/ERPDashboard";
import ExecutiveSuite from "@/components/intelligence/ExecutiveSuite";
import { useI18n } from "@/components/I18nProvider";

type TabId = "crm" | "business" | "erp" | "executive";

export default function UnifiedCommandCenter({ 
  initialData 
}: { 
  initialData: {
    contacts: any[];
    projects: any[];
    orgId: string;
    erpData: {
      stats: any[];
      chartData: any[];
      quota: string;
    };
  } 
}) {
  const { dir, t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>("executive");

  const tabs = [
    { id: "executive", label: "חדר מצב Executive", icon: <ShieldCheck size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" },
    { id: "crm", label: "ניהול מנויים ו-CRM", icon: <Users size={18} />, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "business", label: "ניהול עסקי ותפעול", icon: <Layers size={18} />, color: "text-sky-600", bg: "bg-sky-50" },
    { id: "erp", label: "כספים וחשבוניות (ERP)", icon: <ReceiptText size={18} />, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "executive":
        return <ExecutiveSuite />;
      case "crm":
        return (
          <CrmClient 
            contacts={initialData.contacts} 
            projects={initialData.projects}
            hasOrganization={true}
            organizations={[]}
            orgBilling={null}
          />
        );
      case "business":
        return <MissionControl />;
      case "erp":
        return (
          <ERPDashboard 
            stats={initialData.erpData.stats}
            chartData={initialData.erpData.chartData}
            scanQuotaSummary={initialData.erpData.quota}
            flowSummary={null}
            priceSpikes={[]}
          />
        );
      default:
        return <ExecutiveSuite />;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] w-full gap-6 animate-in fade-in duration-700" dir={dir}>
      
      {/* Dynamic Header & Navigation Tab Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                 <LayoutDashboard className="text-indigo-600" /> מרכז בקרה אחוד <span className="text-slate-400 font-medium">| BSD-YBM</span>
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-1">ניהול סינכרוני של כל היבטי הפעילות בחלון אחד.</p>
           </div>
           
           <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[13px] font-black transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                    ? `bg-white shadow-md ${tab.color} scale-100` 
                    : `text-slate-500 hover:bg-slate-200 hover:text-slate-700 scale-95`
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl shadow-slate-200/40 p-4 md:p-8 min-h-[600px] overflow-hidden relative">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none">
            <Bot size={400} />
         </div>
         
         <div className="relative z-10 h-full">
            {renderContent()}
         </div>
      </div>

      {/* Synchronized Intelligence Footer Tips */}
      <div className="hidden lg:flex items-center justify-center gap-12 py-6 text-slate-400 font-black text-[10px] uppercase tracking-widest border-t border-slate-100 mt-4">
         <span className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> סנכרון CRM↔ERP פעיל</span>
         <span className="flex items-center gap-2"><Zap size={14} className="text-violet-500" /> AI בינה עסקית בזמן אמת</span>
         <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-blue-500" /> הצפנת נתונים צבאית (BSD)</span>
      </div>
    </div>
  );
}

function CheckCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
