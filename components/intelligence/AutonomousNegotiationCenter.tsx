"use client";

import { useState } from "react";
import { 
  Zap, 
  MessageSquare, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  ShieldAlert, 
  Loader2,
  Sparkles,
  RefreshCcw,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NegotiationCase {
  id: string;
  vendor: string;
  item: string;
  oldPrice: number;
  newPrice: number;
  spike: number;
  status: "detected" | "generating" | "sent" | "waiting";
  draft?: string;
}

/**
 * 🚀 WORLD FIRST: Autonomous AI-to-AI Negotiation Center
 * Flags price spikes and lets AI negotiate directly with vendors.
 */
export default function AutonomousNegotiationCenter() {
  const [cases, setCases] = useState<NegotiationCase[]>([
    {
      id: "1",
      vendor: "ספק חומרי גלם א'",
      item: "לוחות אלומיניום 2ממ",
      oldPrice: 120,
      newPrice: 155,
      spike: 29,
      status: "detected"
    },
    {
       id: "2",
       vendor: "חברת הפצה ארצית",
       item: "שירותי לוגיסטיקה VIP",
       oldPrice: 450,
       newPrice: 590,
       spike: 31,
       status: "detected"
    }
  ]);

  const [activeCase, setActiveCase] = useState<NegotiationCase | null>(null);
  const [loading, setLoading] = useState(false);

  const generateDraft = (c: NegotiationCase) => {
    setActiveCase(c);
    setLoading(true);
    // Simulate AI drafting
    setTimeout(() => {
      const draft = `לכבוד מחלקת המכירות של ${c.vendor},

ברצוננו להסב את תשומת לבכם לכך שבחשבונית האחרונה שסרקה מערכת ה-AI שלנו, זוהתה חריגה של ${c.spike}% במחיר המוצר "${c.item}" לעומת המחיר ההיסטורי הממוצע (₪${c.oldPrice}).

מערכת BSD-YBM flagged את העסקה הזו כלא תקינה. נשמח לקבל הסבר על קפיצת המחיר או לחילופין זיכוי הפרש עבור החריגה.

בכבוד רב,
BSD-YBM Autonomous Agent`;
      
      setCases(prev => prev.map(x => x.id === c.id ? { ...x, status: "generating", draft } : x));
      setLoading(false);
    }, 1500);
  };

  const sendNegotiation = (id: string) => {
    setCases(prev => prev.map(x => x.id === id ? { ...x, status: "sent" } : x));
    setTimeout(() => {
        setCases(prev => prev.filter(x => x.id !== id));
        setActiveCase(null);
        alert("הודעת המו״מ נשלחה בהצלחה לספק!");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black italic text-slate-900">מרכז מו״מ אוטונומי</h3>
            <p className="text-xs font-bold text-slate-400">AI שמזהה התייקרויות ונלחם עבור הרווחים שלך</p>
          </div>
        </div>
        <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition">
           סרוק חריגות עכשיו <RefreshCcw size={10} className="inline ms-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases List */}
        <div className="space-y-3">
          {cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
               <CheckCircle2 size={32} className="text-emerald-400 opacity-50 mb-3" />
               <p className="text-sm font-bold text-slate-400">לא זוהו חריגות מחיר חדשות</p>
            </div>
          ) : (
            cases.map(c => (
              <div 
                key={c.id} 
                onClick={() => generateDraft(c)}
                className={`group relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition-all ${activeCase?.id === c.id ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-slate-200 bg-white hover:border-indigo-300 shadow-sm"}`}
              >
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                          <TrendingDown size={16} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900">{c.vendor}</p>
                          <p className="text-[11px] font-bold text-slate-500">{c.item}</p>
                       </div>
                    </div>
                    <div className="text-end">
                       <p className="text-xs font-black text-rose-600">+{c.spike}% חריגה</p>
                       <p className="text-[10px] text-slate-400 tabular-nums">₪{c.oldPrice} → ₪{c.newPrice}</p>
                    </div>
                 </div>
                 
                 {c.status === "sent" && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                       <CheckCircle2 size={12} /> מייל מו״מ נשלח לספק
                    </div>
                 )}
              </div>
            ))
          )}
        </div>

        {/* AI Workbench */}
        <div className="min-h-[300px] rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
           {!activeCase ? (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 opacity-40">
                <Sparkles size={48} strokeWidth={1} className="mb-4" />
                <p className="text-sm font-bold">בחרו חריגה כדי להפיק הצעת ניסוח אוטונומית</p>
             </div>
           ) : (
             <AnimatePresence mode="wait">
               {loading ? (
                 <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                 >
                    <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
                    <p className="text-sm font-black text-slate-700">ה-AI מנתח היסטוריית מחירים ומייצר טיוטת מו״מ...</p>
                 </motion.div>
               ) : (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                   className="flex-1 flex flex-col p-6"
                 >
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">
                       <Mail size={14} /> טיוטת מייל אוטונומית
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-xs font-medium text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap">
                       {activeCase.draft}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                       <button 
                         onClick={() => sendNegotiation(activeCase.id)}
                         className="flex-1 btn-primary py-3 px-6 shadow-lg shadow-blue-500/20"
                       >
                          שלח לספק עכשיו
                       </button>
                       <button className="btn-secondary bg-white border-slate-200 px-4">
                          <FileText size={18} />
                       </button>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
           )}
        </div>
      </div>
      
      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 flex items-start gap-4">
         <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-1" />
         <div>
            <p className="text-[11px] font-black text-amber-700 uppercase tracking-wider">אזהרה: אוטונומיה שלב 1</p>
            <p className="text-xs font-medium text-amber-900/70 mt-0.5">סוכן ה-AI שולח מייל רשמי בשם הארגון שלך. מומלץ לוודא שהדירוג של הספק במערכת מאפשר שליחה אוטומטית ללא אישור (Auto-Send).</p>
         </div>
      </div>
    </div>
  );
}
