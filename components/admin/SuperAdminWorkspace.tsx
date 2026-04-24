"use client";

import { useState } from "react";
import { Activity, Database, Radio, ShieldAlert, Terminal, Users, Loader2 } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

export type SystemHealthKpis = {
  dbStatus: "ok" | "error";
  aiEngineStatus: "ok" | "degraded" | "offline";
  meckanoApiStatus: "ok" | "error";
  activeSessions: number;
};

export type SuperAdminLogRow = {
  id: string;
  action: string;
  user: string;
  time: string;
  status: "success" | "warning" | "error";
};

type SuperAdminWorkspaceProps = {
  health: SystemHealthKpis;
  recentLogs: SuperAdminLogRow[];
};

export function SuperAdminWorkspace({ health, recentLogs }: SuperAdminWorkspaceProps) {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [bcMsg, setBcMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const sendBroadcast = async () => {
    const body = broadcastMessage.trim();
    if (!body) {
      setBcMsg({ type: "err", text: "הזינו הודעה." });
      return;
    }
    setBcMsg(null);
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "הודעה מהפלטפורמה",
          body,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { count?: number; error?: string };
      if (!res.ok) {
        setBcMsg({ type: "err", text: data.error || "השידור נכשל" });
        return;
      }
      setBcMsg({ type: "ok", text: `נשלח ל־${data.count ?? 0} משתמשים פעילים.` });
      setBroadcastMessage("");
    } catch {
      setBcMsg({ type: "err", text: "שגיאת רשת" });
    } finally {
      setSending(false);
    }
  };

  const aiLabel =
    health.aiEngineStatus === "ok"
      ? "תקין (זמינות מלאה)"
      : health.aiEngineStatus === "degraded"
        ? "עומס / חלקי"
        : "לא זמין";

  return (
    <div className="mx-auto max-w-7xl space-y-8 rounded-t-xl border-t-4 border-red-600 bg-slate-50/50 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-red-100 p-3 text-red-600">
          <ShieldAlert size={28} aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ניהול פלטפורמה (Steel Lock)</h1>
          <p className="mt-1 font-medium text-red-600">אזור רגיש: פעולות כאן משפיעות על כלל הארגונים במערכת</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <DashboardCard className="border-l-4 border-l-slate-800" title="מסד נתונים (Prisma)">
          <div className="flex items-center justify-between">
            <div
              className={`text-2xl font-bold ${
                health.dbStatus === "ok" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {health.dbStatus === "ok" ? "מחובר ויציב" : "שגיאת חיבור"}
            </div>
            <Database className="text-slate-400" size={24} aria-hidden />
          </div>
        </DashboardCard>

        <DashboardCard className="border-l-4 border-l-brand" title="מנועי AI (Tri-Engine)">
          <div className="flex items-center justify-between">
            <div
              className={`text-2xl font-bold ${
                health.aiEngineStatus === "ok" ? "text-emerald-600" : "text-amber-500"
              }`}
            >
              {aiLabel}
            </div>
            <Activity className="text-slate-400" size={24} aria-hidden />
          </div>
        </DashboardCard>

        <DashboardCard className="border-l-4 border-l-blue-500" title="סשנים פעילים">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-slate-900">
              {health.activeSessions} <span className="text-sm font-normal text-slate-500">סשנים</span>
            </div>
            <Users className="text-slate-400" size={24} aria-hidden />
          </div>
        </DashboardCard>

        <DashboardCard className="bg-slate-900 text-white" title="שידור התראה גלובלית">
          <div className="mt-2 space-y-3">
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="הודעה לכלל המשתמשים..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white outline-none focus:border-red-500"
            />
            <button
              type="button"
              onClick={() => void sendBroadcast()}
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Radio size={16} aria-hidden />}
              שידור
            </button>
            {bcMsg ? (
              <p
                className={
                  bcMsg.type === "ok" ? "text-center text-xs text-emerald-400" : "text-center text-xs text-red-300"
                }
              >
                {bcMsg.text}
              </p>
            ) : null}
          </div>
        </DashboardCard>
      </div>

      <p className="text-xs text-slate-500">
        Meckano (סטטוס): {health.meckanoApiStatus === "ok" ? "אינטגרציה — בדקו בהגדרות ארגונים" : "תקלה"}
      </p>

      <DashboardCard title="לוג פעילות (ActivityLog)" actionIcon={<Terminal size={20} />}>
        <div className="overflow-x-auto rounded-xl bg-slate-950 p-4">
          <table className="w-full text-start font-mono text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-2 pe-4 font-medium">זמן</th>
                <th className="pb-2 font-medium">פעולה</th>
                <th className="pb-2 font-medium">משתמש / ארגון</th>
                <th className="pb-2 font-medium">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    אין רשומות
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 transition-colors hover:bg-slate-900">
                    <td className="py-2 pe-4">{log.time}</td>
                    <td className="py-2 text-brand-light">{log.action}</td>
                    <td className="py-2">{log.user}</td>
                    <td className="py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          log.status === "success"
                            ? "bg-emerald-900 text-emerald-400"
                            : log.status === "warning"
                              ? "bg-amber-900 text-amber-400"
                              : "bg-red-900 text-red-400"
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
