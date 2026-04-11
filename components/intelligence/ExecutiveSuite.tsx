"use client";

import React from "react";
import { TrendingUp, TrendingDown, DollarSign, BrainCircuit, Activity, PieChart, Users, AlertCircle, Sparkles } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

export default function ExecutiveSuite() {
  const { dir } = useI18n();
  
  return (
    <div className="max-w-[1400px] mx-auto py-8 text-start" dir={dir}>
       
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase tracking-widest rounded-lg mb-3">
             <BrainCircuit size={14} /> AI Executive Mode
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">חדר מצב — <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Executive BI</span></h1>
          <p className="text-slate-500 font-medium text-lg mt-2">תצוגת על מבוססת בינה מלאכותית לקבלת החלטות מהירות בזמן אמת.</p>
        </div>
        <div className="flex gap-3">
           <button className="btn-secondary py-2.5 px-5 bg-white shadow-sm border-slate-200">ייצא דוח דירקטוריון</button>
           <button className="btn-primary py-2.5 px-5 shadow-lg shadow-blue-500/30">זימון אנליזה מיידית</button>
        </div>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "תזרים חודשי צפוי", amt: "₪145,200", up: true, diff: "+12.5%", icon: <DollarSign />, color: "bg-emerald-50 text-emerald-600" },
          { title: "הוצאות תפעול פתוחות", amt: "₪28,450", up: false, diff: "-3.1%", icon: <Activity />, color: "bg-rose-50 text-rose-600" },
          { title: "לקוחות חדשים (לידים)", amt: "42", up: true, diff: "+8", icon: <Users />, color: "bg-blue-50 text-blue-600" },
          { title: "ציון בריאות אוטומטי", amt: "94/100", up: true, diff: "מצוין", icon: <PieChart />, color: "bg-indigo-50 text-indigo-600" }
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
             <div className="absolute -right-6 -top-6 rounded-full w-24 h-24 bg-slate-50/50 scale-100 group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${s.color}`}>
                     {s.icon}
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${s.up ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"}`}>
                     {s.up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {s.diff}
                  </span>
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-500 mb-1">{s.title}</p>
                   <p className="text-3xl font-black text-slate-900 tracking-tight">{s.amt}</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Main AI Predictor Zone */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         
         <div className="xl:col-span-2 bg-slate-900 p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full" />
            <div className="absolute left-0 bottom-0 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full" />
            
            <div className="relative z-10">
               <h3 className="text-white text-xl font-black tracking-tight mb-6 flex items-center gap-3">
                 <BrainCircuit className="text-blue-400" /> CashFlow AI Predictor (Gemini 3.1)
               </h3>
               
               {/* Faux graph representation */}
               <div className="h-64 w-full flex items-end justify-between gap-2 border-b border-slate-700/50 pb-4 mb-6">
                  {[40, 60, 45, 80, 55, 90, 75, 110, 85, 120, 100, 130].map((h, i) => (
                    <div key={i} className="w-full bg-blue-500/20 hover:bg-blue-400/50 transition-colors rounded-t-lg relative group cursor-pointer" style={{ height: `${h}%` }}>
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-xs font-bold text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                         ₪{h * 1500}
                       </div>
                       {i > 8 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    </div>
                  ))}
               </div>
               
               <div className="grid grid-cols-3 gap-4 text-center">
                 <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <p className="text-xs font-bold text-slate-400">חודש נוכחי</p>
                    <p className="text-xl font-black text-white mt-1">₪85,000</p>
                 </div>
                 <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/30">
                    <p className="text-xs font-bold text-blue-300">תחזית חודש הבא (AI)</p>
                    <p className="text-xl font-black text-blue-400 mt-1">₪120,000</p>
                 </div>
                 <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <p className="text-xs font-bold text-slate-400">סיכון מינוס קרוב</p>
                    <p className="text-lg font-black text-emerald-400 mt-1">0% (בטוח)</p>
                 </div>
               </div>
            </div>
         </div>

         {/* Actionable AI Insights */}
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> תובנות מומלצות למנכ״ל
            </h3>
            
            <div className="space-y-4 flex-1">
               <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-rose-700 uppercase tracking-widest bg-rose-200/50 px-2 py-0.5 rounded">גבייה מעכבת</span>
                    <AlertCircle size={14} className="text-rose-500" />
                  </div>
                  <p className="text-sm text-rose-900 font-bold mb-3">2 לקוחות גדולים מאחרים בתשלום מזה 14 יום. סך החוב: ₪12,500.</p>
                  <button className="text-xs font-bold bg-white text-rose-600 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm w-full transition hover:bg-rose-50">שלח התרעה קולית (WhatsApp)</button>
               </div>
               
               <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-widest bg-blue-200/50 px-2 py-0.5 rounded">הזדמנות צמיחה</span>
                    <TrendingUp size={14} className="text-blue-500" />
                  </div>
                  <p className="text-sm text-blue-900 font-bold mb-3">זוהתה עליה של 40% בלידים משיווק. כדאי להגדיל תקציב ממומן ב-₪2,000.</p>
                  <button className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm w-full transition hover:bg-blue-50">אשר הגדלה קמפיין</button>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
