"use client";

import React, { useState } from "react";
import { Play, Plus, Zap, ArrowRight, MessageSquare, Briefcase, ChevronDown, Save, Blocks } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

export default function AutomationBuilder() {
  const { dir } = useI18n();
  const [nodes, setNodes] = useState([
    {
      id: "1", type: "trigger", title: "כשנכנסת חשבונית חדשה לסורק",
      icon: <Briefcase className="text-blue-500" size={18} />, bg: "bg-blue-50 border-blue-200"
    },
    {
      id: "2", type: "condition", title: "בדוק אם: סכום גדול מ-5000 ש״ח",
      icon: <Zap className="text-amber-500" size={18} />, bg: "bg-amber-50 border-amber-200"
    },
    {
      id: "3", type: "action", title: "שלח הודעת WhatsApp ללקוח",
      icon: <MessageSquare className="text-emerald-500" size={18} />, bg: "bg-emerald-50 border-emerald-200"
    }
  ]);

  return (
    <div className="max-w-4xl mx-auto py-8 font-sans" dir={dir}>
       
      <div className="mb-8 flex items-center justify-between rounded-3xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-6 shadow-[var(--cd-shadow-sm)]">
         <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-purple-100 p-3 text-purple-600"><Blocks size={24} /></div>
            <div>
               <h2 className="text-2xl font-black tracking-tight text-[color:var(--ink-900)]">אוטומציות AI</h2>
               <p className="mt-1 text-sm font-medium text-[color:var(--ink-500)]">בנה סוכנים וירטואלים שעובדים בשבילך 24/7 באופן ויזואלי.</p>
            </div>
         </div>
         <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2 bg-[color:var(--canvas-sunken)]"><Play size={14}/> בדוק ריצה</button>
            <button className="btn-primary shadow-lg shadow-purple-500/30 bg-purple-600 hover:bg-purple-700 flex items-center gap-2"><Save size={14}/> עדכן כלל</button>
         </div>
      </div>

      <div className="relative flex min-h-[500px] flex-col items-center rounded-3xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)]/50 p-12 shadow-inner">
         
         {/* Custom Grid Background */}
         <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
         
         <div className="relative z-10 w-full max-w-sm space-y-6">
            {nodes.map((node, i) => (
              <React.Fragment key={node.id}>
                <div className={`p-5 rounded-2xl border ${node.bg} shadow-sm transition hover:shadow-md cursor-grab group bg-opacity-70 backdrop-blur-md`}>
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--ink-400)]">{node.type.toUpperCase()}</span>
                     {node.icon}
                   </div>
                   <h4 className="text-base font-bold text-[color:var(--ink-800)]">{node.title}</h4>
                   <div className="mt-4 flex cursor-pointer items-center gap-2 border-t border-[color:var(--line)]/50 pt-3 text-xs font-semibold text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)]">
                      הגדרות מתקדמות <ChevronDown size={14} />
                   </div>
                </div>

                {i < nodes.length - 1 && (
                  <div className="flex justify-center -my-3 z-0">
                     <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] text-[color:var(--ink-300)] shadow-[var(--cd-shadow-sm)]">
                        <ArrowRight size={14} className={dir === "rtl" ? "rotate-180" : ""} />
                     </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            <div className="flex justify-center mt-6">
               <button className="flex items-center gap-2 rounded-full border border-purple-200 bg-[color:var(--canvas-raised)] px-6 py-3 text-sm font-bold text-purple-600 shadow-[var(--cd-shadow-sm)] transition-all hover:scale-105 hover:bg-purple-50">
                  <Plus size={16} /> הוסף שלב לרובוט
               </button>
            </div>
         </div>
      </div>

    </div>
  );
}
