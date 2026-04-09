"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  User as UserIcon, 
  Activity, 
  Calendar, 
  Search,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

type LogEntry = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/admin/logs");
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e) {
        console.error("Failed to fetch logs", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.user.name?.toLowerCase().includes(filter.toLowerCase()) ||
    log.user.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">יומן פעילויות (Audit Log)</h2>
            <p className="text-sm font-medium text-slate-500">מעקב שקוף אחרי כל שינוי שבוצע בארגון</p>
          </div>
        </div>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="חפש לפי פעולה, משתמש או אימייל..."
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-slate-400 font-bold animate-pulse">
            טוען יומן אירועים...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center text-slate-400 font-bold">
            לא נמצאו פעילויות התואמות לחיפוש
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">משתמש</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">פעולה</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">פרטים</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">זמן</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <UserIcon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{log.user.name || "משתמש ללא שם"}</p>
                          <p className="text-[10px] text-slate-400">{log.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                        <Activity size={12} />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 max-w-xs truncate" title={log.details || ""}>
                        {log.details || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} />
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: he })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
