"use client";

import { 
  Phone, 
  Mail, 
  MoreVertical, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Zap
} from "lucide-react";

type MobileContactCardProps = {
  contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    value: number | null;
    notes?: string | null;
    project?: { name: string } | null;
    erp?: {
      totalPending: number;
      invoiceCount: number;
    }
  };
  statusMeta: (status: string) => { label: string; cls: string };
  avatarColor: (id: string) => string;
  onClick: () => void;
};

/**
 * 🚀 High-End 2026 Mobile Card View
 * Enhanced with "Client Health" (Sentiment/Churn AI)
 */
export default function MobileContactCard({ 
  contact, 
  statusMeta, 
  avatarColor, 
  onClick 
}: MobileContactCardProps) {
  const meta = statusMeta(contact.status);

  // 🧠 Sentiment AI logic (Simulated for 2026 Experience)
  const getHealth = (notes?: string | null, pending?: number) => {
    if ((pending ?? 0) > 10000) return { label: "סיכון תשלום גבוה", color: "text-rose-600 bg-rose-50 border-rose-100", icon: <AlertCircle size={10} /> };
    if (notes?.includes("בעיה") || notes?.includes("כועס") || notes?.includes("עיכוב")) 
       return { label: "סנטימנט שלילי", color: "text-amber-600 bg-amber-50 border-amber-100", icon: <TrendingDown size={10} /> };
    if (notes && notes.length > 60) 
       return { label: "מעורבות גבוהה", color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: <TrendingUp size={10} /> };
    return { label: "קשר יציב", color: "text-blue-600 bg-blue-50 border-blue-100", icon: <Activity size={10} /> };
  };

  const health = getHealth(contact.notes, contact.erp?.totalPending);
  
  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm active:scale-[0.98] transition-all mb-4"
    >
      {/* ── Header Area ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white text-base font-black shadow-lg"
            style={{ backgroundColor: avatarColor(contact.id) }}
          >
            {contact.name.split(" ").map(n => n?.[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-900 leading-tight">{contact.name}</h3>
            <div className="flex items-center gap-2 mt-1">
               <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${health.color} border shadow-sm`}>
                  {health.icon} {health.label}
               </span>
            </div>
          </div>
        </div>
        <button className="rounded-xl p-2 text-slate-300 hover:bg-slate-50 transition">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* ── Context & Project ── */}
      <div className="flex items-center gap-2 px-1">
         <p className="truncate text-[11px] font-bold text-slate-400">
            {contact.project?.name || "ללא שיוך תיק"}
         </p>
         <span className="h-1 w-1 rounded-full bg-slate-200" />
         <span className={`text-[10px] font-black uppercase tracking-tight ${meta.cls} bg-transparent border-transparent px-0`}>
           {meta.label}
         </span>
      </div>

      {/* ── Main Stats Dashboard ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/50 border border-slate-100 px-3 py-3 shadow-inner">
          <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">פוטנציאל</span>
          <span className="text-xs font-black text-slate-900">
            ₪{(contact.value || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-blue-50/30 border border-blue-100 px-3 py-3 shadow-inner">
          <span className="text-[10px] font-black uppercase tracking-tight text-blue-400">יתרת חוב</span>
          <span className="text-xs font-black text-blue-600 tabular-nums">
            ₪{(contact.erp?.totalPending || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Smart Actions Bar ── */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-1">
        <div className="flex gap-2.5">
           {contact.phone && (
             <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm active:bg-blue-100 transition-colors">
               <Phone size={14} />
             </a>
           )}
           {contact.email && (
             <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 shadow-sm active:bg-slate-100 transition-colors">
               <Mail size={14} />
             </a>
           )}
        </div>
        
        {contact.erp && (contact.erp.invoiceCount > 0) ? (
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
            <Zap size={10} className="text-amber-500 fill-amber-500" />
            <span className="hidden sm:inline">מסמכים פעילים:</span> {contact.erp.invoiceCount}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300">
             ללא מסמכי ERP
          </div>
        )}
      </div>
    </div>
  );
}
