"use client";

import { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  TrendingUp, 
  CreditCard, 
  ShieldCheck, 
  Globe, 
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  Settings2
} from "lucide-react";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ניהול כספים וחשבוניות</h1>
          <p className="text-gray-500 mt-1 font-medium">ניהול מסמכים חשבונאיים וחיבור ישיר לרשות המסים (מערכת הקצאות 2024)</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <Download size={18} />
            <span>ייצוא דוחות</span>
          </button>
          <button className="btn-primary flex items-center gap-2 bg-[var(--primary-brand,#4f46e5)] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
            <Plus size={18} />
            <span>מסמך חדש</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "הכנסות החודש", value: "₪42,500", trend: "+12.5%", isUp: true, icon: <TrendingUp className="text-emerald-500" /> },
          { label: "חשבוניות הממתינות להקצאה", value: "3", trend: "טיפול דחוף", isUp: false, icon: <AlertCircle className="text-amber-500" /> },
          { label: "מסמכים שנחתמו", value: "128", trend: "100% תקין", isUp: true, icon: <ShieldCheck className="text-indigo-500" /> },
          { label: "יתרת מע״מ משוערת", value: "₪7,225", trend: "צפי תשלום", isUp: false, icon: <ReceiptText className="text-slate-500" /> },
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
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-end md:text-start">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">מחובר למערכת "חשבוניות ישראל" (API)</span>
            </div>
            <h2 className="text-3xl font-black mb-3">חיבור ישיר למשרד האוצר</h2>
            <p className="text-indigo-100/80 font-medium leading-relaxed">
              המערכת מסונכרנת עם רפורמת מספרי ההקצאה של רשות המסים. כל חשבונית מעל ₪25,000 מקבלת מספר הקצאה אוטומטי בתוך שניות, תוך הגנה מלאה על זכויות קיזוז המע״מ של לקוחותיך.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
            <button className="flex items-center justify-center gap-2 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-sm uppercase">
              <Settings2 size={18} />
              <span>הגדרות חיבור אישיות</span>
            </button>
            <p className="text-center text-[10px] text-white/40 font-bold tracking-widest uppercase">ID: LIC-MOF-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        
        {/* TABS */}
        <div className="flex items-center gap-8 px-8 border-b border-gray-100">
          {[
            { id: "invoices", label: "חשבוניות", count: 142 },
            { id: "proforma", label: "חשבון עסקה", count: 24 },
            { id: "allocations", label: "הקצאות (MOF)", count: 3 },
            { id: "clients", label: "לקוחות לחיוב", count: 85 }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-5 text-sm font-black transition-all relative ${
                activeTab === tab.id ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              <span className="ms-2 px-1.5 py-0.5 rounded-md bg-gray-50 text-[10px] text-gray-500 border border-gray-200/50">{tab.count}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
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
              className="w-full bg-white border border-gray-200 rounded-2xl pr-12 pl-4 py-3 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
            <Filter size={18} />
            <span>סינון מתקדם</span>
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
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
            <tbody className="divide-y divide-gray-50">
              {[
                { id: "INV-10024", client: "טכנולוגיות בע״מ", date: "12/04/2026", status: "הוקצה", amount: "₪32,500", allocation: "8472591", type: "חשבונית מס" },
                { id: "INV-10023", client: "נדל״ן אקטיבי", date: "11/04/2026", status: "בתהליך", amount: "₪12,000", allocation: "-", type: "חשבונית מס" },
                { id: "INV-10022", client: "משווקי הדרום", date: "10/04/2026", status: "פטור", amount: "₪4,500", allocation: "-", type: "קבלה" },
                { id: "INV-10021", client: "חברת הבניה הישראלית", date: "09/04/2026", status: "שגיאת API", amount: "₪48,000", allocation: "ERROR", type: "חשבונית מס" }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors group italic">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 tracking-tight">{row.id}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{row.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{row.client}</span>
                      <span className="text-[10px] text-gray-400 font-medium">ח״פ: 512345678</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500 font-medium">{row.date}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        row.status === "הוקצה" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                        row.status === "בתהליך" ? "bg-amber-500 animate-pulse" : 
                        row.status === "שגיאת API" ? "bg-rose-500" : "bg-gray-300"
                      }`} />
                      <span className="text-xs font-black">{row.status}</span>
                      {row.allocation !== "-" && (
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">#{row.allocation}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-gray-900 text-end">{row.amount}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <FileText size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER - PAGINATION */}
        <div className="px-8 py-5 bg-gray-50/50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400">מציג 4 מתוך 142 מסמכים</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">הקודם</button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(p => (
                <button key={p} className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black ${p === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">הבא</button>
          </div>
        </div>

      </div>

    </div>
  );
}
