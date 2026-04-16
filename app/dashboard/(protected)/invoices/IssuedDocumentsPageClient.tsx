"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, Filter, Download, FileText, TrendingUp, 
  ShieldCheck, AlertCircle, ReceiptText, Settings2, Loader2
} from "lucide-react";
import { getIssuedDocumentsAction } from "@/app/actions/get-issued-documents";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getIssuedDocumentsAction();
        if (res.success && res.documents) {
          setDocuments(res.documents);
        }
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ניהול כספים וחשבוניות</h1>
          <p className="text-gray-500 mt-1 font-medium">ניהול מסמכים חשבונאיים וחיבור ישיר לרשות המסים (מערכת הקצאות 2026)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <Download size={18} />
            <span>ייצוא דוחות</span>
          </button>
          <button className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-teal-200 hover:scale-105 active:scale-95 transition-all">
            <Plus size={18} />
            <span>מסמך חדש</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "הכנסות החודש", value: documents.length > 0 ? `₪${documents.reduce((acc, d) => acc + (parseFloat(d.amount.replace('₪','').replace(',','')) || 0), 0).toLocaleString()}` : "₪0", trend: "+0%", isUp: true, icon: <TrendingUp className="text-emerald-500" /> },
          { label: "ממתינות להקצאה", value: documents.filter(d => d.status === "בתהליך").length.toString(), trend: "טיפול דחוף", isUp: false, icon: <AlertCircle className="text-amber-500" /> },
          { label: "מסמכים במערכת", value: documents.length.toString(), trend: "100% תקין", isUp: true, icon: <ShieldCheck className="text-teal-500" /> },
          { label: "יתרת מע״מ משוערת", value: "₪0", trend: "צפי תשלום", isUp: false, icon: <ReceiptText className="text-slate-500" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gray-50 rounded-2xl">{stat.icon}</div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* ISRAEL INVOICES REFORM - MINISTRY OF FINANCE CONNECTION */}
      <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-start">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">סטטוס רגולטורי 2026 מופעל</span>
            </div>
            <h2 className="text-3xl font-black mb-3">תאימות מלאה — רף ₪10,000 (ינואר 2026)</h2>
            <p className="text-teal-100/80 font-medium leading-relaxed">
              המערכת מעודכנת לרף הדיווח החדש של שנת 2026. כל חשבונית מעל ₪10,000 (ומעל ₪5,000 החל מיוני) נשלחת אוטומטית לקבלת מספר הקצאה בזמן אמת כדי להבטיח ניכוי מע״מ תשומות מלא.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
            <button className="flex items-center justify-center gap-2 bg-white text-teal-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-sm uppercase">
              <Settings2 size={18} />
              <span>הגדרות חיבור אישיות</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        
        {/* TABS */}
        <div className="flex items-center gap-8 px-8 border-b border-gray-100">
          {[
            { id: "invoices", label: "חשבוניות", count: documents.length },
            { id: "proforma", label: "חשבון עסקה", count: 0 },
            { id: "allocations", label: "הקצאות (MOF)", count: documents.filter(d => d.allocation !== '-').length },
            { id: "clients", label: "לקוחות לחיוב", count: 0 }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-5 text-sm font-black transition-all relative ${
                activeTab === tab.id ? "text-teal-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              <span className="ms-2 px-1.5 py-0.5 rounded-md bg-gray-50 text-[10px] text-gray-500 border border-gray-200/50">{tab.count}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-full" />}
            </button>
          ))}
        </div>

        {/* SEARCH & FILTERS */}
        <div className="p-6 flex flex-col md:flex-row items-center gap-4 bg-gray-50/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="חיפוש לפי מספר חשבונית, שם לקוח או ח״פ..."
              className="w-full bg-white border border-gray-200 rounded-2xl pr-12 pl-4 py-3 text-sm focus:ring-4 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
            <Filter size={18} />
            <span>סינון מתקדם</span>
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto min-h-[300px] flex flex-col">
          {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400 gap-4">
               <Loader2 className="animate-spin text-teal-500" size={32} />
               <p className="font-bold text-sm">מעדכן נתונים חיים...</p>
             </div>
          ) : documents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400 gap-4 text-center">
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200/50">
                <ReceiptText size={32} className="text-gray-300" />
              </div>
              <div>
                <p className="font-black text-gray-600">אין מסמכים עדיין</p>
                <p className="text-xs font-medium">המערכת נקייה ומוכנה להטמעת המסמך הראשון שלך.</p>
              </div>
              <button className="mt-2 text-teal-600 font-bold text-xs hover:underline">הפק חשבונית חדשה</button>
            </div>
          ) : (
            <table className="w-full text-start">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">מספר / סוג</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">לקוח / ח״פ</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">תאריך</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">סטטוס הקצאה</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-end">סה״כ לתשלום</th>
                  <th className="px-6 py-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-900">
                {documents.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 tracking-tight">{row.id}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{row.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">{row.client}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500 font-medium">{row.date}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          row.status === "הוקצה" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                          row.status === "בתהליך" ? "bg-amber-500 animate-pulse" : "bg-gray-300"
                        }`} />
                        <span className="text-xs font-black">{row.status}</span>
                        {row.allocation !== "-" && (
                          <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">#{row.allocation}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-gray-900 text-end tracking-tighter">{row.amount}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
                          <FileText size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
