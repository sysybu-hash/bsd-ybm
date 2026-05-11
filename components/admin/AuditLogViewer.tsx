"use client";

import { useCallback, useState, useEffect } from "react";
import {
  User as UserIcon,
  Activity,
  Calendar,
  Search,
  ShieldCheck,
  Trash2,
  Loader2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
const formatDate = (d: string) =>
  new Date(d).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

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
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const fetchLogs = useCallback(async (clearNotice = true) => {
    setLoading(true);
    if (clearNotice) setNotice(null);
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error("Failed to fetch logs", e);
      setNotice("לא הצלחתי לטעון את יומן הפעולות.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const clearLogs = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setNotice("לחץ שוב על ניקוי לוג כדי לאשר מחיקה.");
      return;
    }

    setClearing(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/logs", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setNotice(data?.error || "ניקוי הלוג נכשל.");
        return;
      }
      setFilter("");
      setConfirmClear(false);
      await fetchLogs(false);
      setNotice(`הלוג נוקה. נמחקו ${data.deleted ?? 0} רשומות, ונשמרה רשומת ביקורת חדשה.`);
    } catch (error) {
      console.error("Failed to clear logs", error);
      setNotice("ניקוי הלוג נכשל בגלל שגיאת רשת.");
    } finally {
      setClearing(false);
    }
  };

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
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">יומן פעילויות (Audit Log)</h2>
            <p className="text-sm font-medium text-slate-500">מעקב שקוף אחרי כל שינוי שבוצע בארגון</p>
          </div>
        </div>
        
        <div className="flex w-full flex-col gap-2 md:max-w-2xl md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="חפש לפי פעולה, משתמש או אימייל..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={clearLogs}
            disabled={loading || clearing || logs.length === 0}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
              confirmClear
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            {clearing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
            {confirmClear ? "אישור ניקוי" : "נקה לוג"}
          </button>
          <button
            type="button"
            onClick={() => void fetchLogs()}
            disabled={loading || clearing}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            רענן
          </button>
        </div>
      </div>

      {notice ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          <span>{notice}</span>
        </div>
      ) : null}

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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
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
                        {formatDate(log.createdAt)}
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
