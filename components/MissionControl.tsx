"use client";

import { useState, useCallback, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Zap, Clock, Send, ShieldCheck, RefreshCw } from "lucide-react";

const SYSTEMS = ["API", "Database", "תשלומים (PayPal)", "AI Engine"] as const;

export default function MissionControl() {
  const [repairTime, setRepairTime] = useState("02:00");
  const [timeSaved, setTimeSaved] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; content: string }[]
  >([
    {
      role: "ai",
      content:
        "שלום, זוהי בקרת משימות כללית. כאן תוכלו לעקוב אחרי סטטוס מערכות ולהכין הערות תפעול (ממשק עתידי — ללא חיבור ישיר ל־Git).",
    },
  ]);
  const [liveStatuses, setLiveStatuses] = useState<
    { name: string; ok: boolean; detail: string }[]
  >([]);
  const [liveAt, setLiveAt] = useState<string>("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/system-health", { cache: "no-store" });
        const data = (await res.json()) as {
          checkedAt?: string;
          statuses?: { name: string; ok: boolean; detail: string }[];
        };
        if (!alive) return;
        if (Array.isArray(data.statuses)) setLiveStatuses(data.statuses);
        if (typeof data.checkedAt === "string") setLiveAt(data.checkedAt);
      } catch {
        if (!alive) return;
        setLiveStatuses([
          { name: "API", ok: false, detail: "שגיאת תקשורת" },
          { name: "Database", ok: false, detail: "לא זמין" },
          { name: "תשלומים (PayPal)", ok: false, detail: "לא זמין" },
          { name: "AI Engine", ok: false, detail: "לא זמין" },
        ]);
      }
    };
    void load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const sendMessage = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", content: t }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          content:
            "הודעה נקלטה. חיבור לזרימת קוד אוטומטית לא מופעל בסביבה זו — השתמשו ב־Cursor או ב־CI לשינויים בפועל.",
        },
      ]);
    }, 400);
  }, [input]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] p-4 md:p-8 text-slate-900 font-sans" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {(liveStatuses.length
          ? liveStatuses
          : SYSTEMS.map((s) => ({ name: s, ok: true, detail: "בודק..." }))).map((sys) => (
          <motion.div
            key={sys.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm"
          >
            <div>
              <span className="font-bold">{sys.name}</span>
              <p className="text-[10px] text-slate-500">{sys.detail}</p>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                sys.ok
                  ? "bg-emerald-500 shadow-[0_0_12px_#10b981]"
                  : "bg-rose-500 shadow-[0_0_12px_#ef4444]"
              }`}
              title={sys.name}
            />
          </motion.div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 mb-6">
        סטטוס חי מתעדכן כל 15 שניות{liveAt ? ` · בדיקה אחרונה: ${new Date(liveAt).toLocaleTimeString("he-IL")}` : ""}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden min-h-[480px] max-h-[min(70vh,640px)] border border-white/5">
          <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center text-white gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                <Zap size={20} aria-hidden />
              </div>
              <span className="font-black italic">BSD AI — לוג תפעול</span>
            </div>
            <span className="text-xs text-slate-500">תצוגה מקומית בלבד</span>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.content.slice(0, 12)}`}
                className={`flex ${m.role === "ai" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === "ai"
                      ? "bg-white/10 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={onSubmit}
            className="p-6 bg-white/5 border-t border-white/10 flex gap-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="הערות תפעול, בדיקות, משימות..."
              className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              aria-label="הודעה לבקרה"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 transition-all shrink-0"
              aria-label="שלח"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 italic">
              <Clock className="text-blue-500" aria-hidden />
              תזמון בדיקות (הדגמה)
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              שעה לתזכורת בדיקות או סריקות מתוזמנות במערכת (Cron פעיל בפרויקט — ניתן לחבר
              לכאן בהמשך).
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl gap-3 flex-wrap">
                <span className="font-bold text-sm">שעה מועדפת</span>
                <input
                  type="time"
                  value={repairTime}
                  onChange={(e) => setRepairTime(e.target.value)}
                  className="bg-white border border-slate-200 p-2 rounded-lg font-bold"
                />
              </div>
              <button
                type="button"
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all"
                onClick={() => {
                  setTimeSaved(true);
                  setTimeout(() => setTimeSaved(false), 3000);
                }}
              >
                <RefreshCw size={18} aria-hidden />
                שמור שעת תזכורת
              </button>
              {timeSaved && (
                <p className="text-center text-sm text-emerald-600 font-medium">
                  נשמר מקומית: {repairTime}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <ShieldCheck
              className="absolute top-[-10px] left-[-10px] text-white/10 pointer-events-none"
              size={150}
              aria-hidden
            />
            <h3 className="text-xl font-black mb-2 italic">מצב אבטחה</h3>
            <p className="text-blue-100 text-xs leading-relaxed">
              שינויי קוד ופריסה צריכים לעבור Build וסקירה לפני ייצור. דף זה למנהלי על בלבד.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
