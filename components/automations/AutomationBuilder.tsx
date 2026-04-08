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
       
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><Blocks size={24} /></div>
            <div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tight">אוטומציות AI</h2>
               <p className="text-sm font-medium text-gray-500 mt-1">בנה סוכנים וירטואלים שעובדים בשבילך 24/7 באופן ויזואלי.</p>
            </div>
         </div>
         <div className="flex gap-2">
            <button className="btn-secondary bg-gray-50 flex items-center gap-2"><Play size={14}/> בדוק ריצה</button>
            <button className="btn-primary shadow-lg shadow-purple-500/30 bg-purple-600 hover:bg-purple-700 flex items-center gap-2"><Save size={14}/> עדכן כלל</button>
         </div>
      </div>

      <div className="p-12 relative bg-gray-50/50 rounded-3xl border border-gray-200 shadow-inner min-h-[500px] flex flex-col items-center">
         
         {/* Custom Grid Background */}
         <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
         
         <div className="relative z-10 w-full max-w-sm space-y-6">
            {nodes.map((node, i) => (
              <React.Fragment key={node.id}>
                <div className={`p-5 rounded-2xl border ${node.bg} shadow-sm transition hover:shadow-md cursor-grab group bg-opacity-70 backdrop-blur-md`}>
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{node.type.toUpperCase()}</span>
                     {node.icon}
                   </div>
                   <h4 className="font-bold text-gray-800 text-base">{node.title}</h4>
                   <div className="mt-4 pt-3 border-t border-gray-200/50 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer transition">
                      הגדרות מתקדמות <ChevronDown size={14} />
                   </div>
                </div>

                {i < nodes.length - 1 && (
                  <div className="flex justify-center -my-3 z-0">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-300 shadow-sm z-10">
                        <ArrowRight size={14} className={dir === "rtl" ? "rotate-180" : ""} />
                     </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            <div className="flex justify-center mt-6">
               <button className="flex items-center gap-2 text-sm font-bold bg-white text-purple-600 border border-purple-200 shadow-sm px-6 py-3 rounded-full hover:bg-purple-50 hover:scale-105 transition-all">
                  <Plus size={16} /> הוסף שלב לרובוט
               </button>
            </div>
         </div>
      </div>

    </div>
  );
}
