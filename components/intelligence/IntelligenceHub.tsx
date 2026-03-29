"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Mic,
  ShieldAlert,
  MessageSquareHeart,
  MessageCircle,
  Target,
  FileSearch,
  Zap,
  Lock,
  X,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const forecastData = [
  { day: "01/04", balance: 52000, type: "actual" as const },
  { day: "05/04", balance: 48000, type: "actual" as const },
  { day: "10/04", balance: 65000, type: "forecast" as const },
  { day: "14/04", balance: 18000, type: "forecast" as const },
  { day: "20/04", balance: 45000, type: "forecast" as const },
  { day: "30/04", balance: 72000, type: "forecast" as const },
];

export default function IntelligenceHub() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [dailyText, setDailyText] = useState<string | null>(null);
  const [dailyMeta, setDailyMeta] = useState<string | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  const loadDaily = async () => {
    setDailyLoading(true);
    setDailyText(null);
    setDailyMeta(null);
    try {
      const r = await fetch("/api/org/insights/daily");
      const j = (await r.json()) as { content?: string; error?: string; updatedAt?: string | null };
      setDailyText(j.content ?? j.error ?? "אין תוכן");
      if (j.updatedAt) setDailyMeta(new Date(j.updatedAt).toLocaleString("he-IL"));
    } catch {
      setDailyText("שגיאת רשת");
    } finally {
      setDailyLoading(false);
    }
  };

  const primaryColor = "var(--primary-color, #3b82f6)";

  return (
    <div
      className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900"
      dir="rtl"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1
            className="text-4xl font-black italic tracking-tighter"
            style={{ color: primaryColor }}
          >
            Mission Control <span className="text-slate-900">.</span>
          </h1>
          <p className="text-slate-500 font-medium">
            BSD Intelligence Hub — ניהול אוטונומי מלא
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 text-xs font-bold shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            מערכת ריפוי עצמי פעילה (Self-Healing)
          </div>
          <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-2xl border border-rose-100 text-xs font-bold shadow-sm">
            <ShieldAlert size={14} aria-hidden />
            AI Guardian: נחסמה חשבונית כפולה
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
              <h3 className="text-xl font-black italic flex items-center gap-2">
                <BrainCircuit style={{ color: primaryColor }} /> חיזוי תזרים וסימולציה
              </h3>
              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                className="bg-slate-100 hover:bg-slate-200 p-2 px-4 rounded-xl text-xs font-bold transition-all"
              >
                {isSimulating ? 'בטל סימולציה' : 'הפעל מצב "מה אם?"'}
              </button>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={primaryColor}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={primaryColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "20px",
                      border: "none",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={primaryColor}
                    strokeWidth={4}
                    fill="url(#colorPrimary)"
                  />
                  <ReferenceLine
                    y={20000}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {isSimulating ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-700 italic"
              >
                הדמיה: הוספת הוצאה של ₪15,000 ב-14/04 תגרום לירידה מתחת לקו האדום.
              </motion.div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg">
              <h4 className="font-black italic mb-4 flex items-center gap-2">
                <Target className="text-purple-500" aria-hidden /> רווחיות פרויקטים חי
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1 uppercase">
                    BSD App Development
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: "82%" }} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  ה-AI זיהה חריגה של 5% בשעות הפיתוח החודש.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg">
              <h4 className="font-black italic mb-4 flex items-center gap-2">
                <FileSearch className="text-amber-500" aria-hidden /> לוביסט AI — חיסכון
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                נמצאו עמלות בנק חריגות (1.2%). ה-AI ניסח מכתב דרישה להפחתה ל-0.4%.
              </p>
              <button
                type="button"
                className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
              >
                שלח מכתב דרישה לבנק
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black italic mb-6 flex items-center gap-2">
                <Mic
                  size={20}
                  className={isRecording ? "text-rose-500 animate-pulse" : "text-blue-400"}
                />{" "}
                Voice Insights
              </h3>
              <button
                type="button"
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
              >
                {isRecording ? "מקשיב לך..." : "לחץ ודבר עם המערכת"}
              </button>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
              <BrainCircuit size={120} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
            <h4 className="font-black italic mb-6 flex items-center gap-2">
              <MessageSquareHeart className="text-rose-400" aria-hidden /> שירות וגבייה
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold">לקוח: אקווה סטאר</p>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    לקוח מרוצה
                  </div>
                </div>
                <button
                  type="button"
                  className="bg-white border border-slate-200 p-2 rounded-xl text-blue-600 hover:bg-blue-50"
                  aria-label="ווטסאפ"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl gap-2">
                <p className="text-xs font-bold text-rose-700">
                  חוב של ₪12,000 — לשלוח תזכורת?
                </p>
                <button
                  type="button"
                  className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[10px] font-black italic shrink-0"
                >
                  שלח עכשיו
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[3rem] text-white shadow-xl">
            <h4 className="font-black italic mb-6 flex items-center gap-2">
              <Zap className="text-yellow-300" aria-hidden /> Business Pulse
            </h4>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-2 uppercase opacity-80">
                  יעד הכנסות חודשי: ₪100K
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    className="h-full bg-white rounded-full shadow-[0_0_10px_white]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVaultOpen(true)}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 backdrop-blur-md"
              >
                <Lock size={14} /> כספת רואה חשבון: 14 מסמכים מוכנים
              </button>
              <button
                type="button"
                onClick={() => {
                  setDailyOpen(true);
                  void loadDaily();
                }}
                className="w-full bg-white text-blue-800 hover:bg-blue-50 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg"
              >
                תובנה פיננסית יומית (מילת היום)
              </button>
            </div>
          </div>
        </div>
      </div>

      {vaultOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-title"
          onClick={() => setVaultOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 id="vault-title" className="text-lg font-black flex items-center gap-2">
                <Lock className="text-blue-600" size={22} /> כספת מסמכים לרואה חשבון
              </h3>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-slate-100"
                aria-label="סגור"
                onClick={() => setVaultOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              רשימת פריטים מוכנים לשיתוף (דוגמה): חשבוניות חודשיות, דוח מע״מ, התאמות בנק.
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-slate-700">
              <li>חשבוניות ספקים — 8 קבצים</li>
              <li>דוח ריכוז עוסק — PDF</li>
              <li>דוח AI סיכום הוצאות</li>
            </ul>
            <button
              type="button"
              onClick={() => setVaultOpen(false)}
              className="mt-6 w-full py-3 rounded-2xl bg-blue-600 text-white font-bold"
            >
              סגור
            </button>
          </div>
        </div>
      ) : null}

      {dailyOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-title"
          onClick={() => setDailyOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-900 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 id="daily-title" className="text-lg font-black text-blue-700">
                תובנה פיננסית יומית
              </h3>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-slate-100"
                aria-label="סגור"
                onClick={() => setDailyOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            {dailyMeta ? (
              <p className="text-xs text-slate-500 mb-2">עודכן: {dailyMeta}</p>
            ) : null}
            {dailyLoading ? (
              <div className="flex items-center gap-2 text-slate-600 py-8 justify-center">
                <Loader2 className="animate-spin" size={28} />
                טוען…
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{dailyText}</p>
            )}
            <button
              type="button"
              onClick={() => setDailyOpen(false)}
              className="mt-6 w-full py-3 rounded-2xl bg-slate-900 text-white font-bold"
            >
              סגור
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
