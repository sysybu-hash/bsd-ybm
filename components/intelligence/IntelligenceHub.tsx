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
import RechartsBounded from "@/components/RechartsBounded";
import { useI18n } from "@/components/I18nProvider";

const forecastData = [
  { day: "01/04", balance: 52000, type: "actual" as const },
  { day: "05/04", balance: 48000, type: "actual" as const },
  { day: "10/04", balance: 65000, type: "forecast" as const },
  { day: "14/04", balance: 18000, type: "forecast" as const },
  { day: "20/04", balance: 45000, type: "forecast" as const },
  { day: "30/04", balance: 72000, type: "forecast" as const },
];

export default function IntelligenceHub() {
  const { dir } = useI18n();
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

  const primaryColor = "var(--primary-color, #4f46e5)";

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900 md:p-8" dir={dir}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1
            className="text-4xl font-black italic tracking-tighter"
            style={{ color: primaryColor }}
          >
            Mission Control <span className="text-gray-900">.</span>
          </h1>
          <p className="text-gray-500 font-medium">
            BSD Intelligence Hub — ניהול אוטונומי מלא
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            מערכת ריפוי עצמי פעילה (Self-Healing)
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700">
            <ShieldAlert size={14} aria-hidden />
            AI Guardian: נחסמה חשבונית כפולה
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card-avenue bg-white p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
              <h3 className="text-xl font-black italic flex items-center gap-2">
                <BrainCircuit style={{ color: primaryColor }} /> חיזוי תזרים וסימולציה
              </h3>
              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50"
              >
                {isSimulating ? 'בטל סימולציה' : 'הפעל מצב "מה אם?"'}
              </button>
            </div>

            <RechartsBounded height={300}>
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
            </RechartsBounded>
            {isSimulating ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-xs italic text-indigo-700"
              >
                הדמיה: הוספת הוצאה של ₪15,000 ב-14/04 תגרום לירידה מתחת לקו האדום.
              </motion.div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="font-black italic mb-4 flex items-center gap-2">
                <Target className="text-indigo-500" aria-hidden /> רווחיות פרויקטים חי
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1 uppercase">
                    BSD App Development
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: "82%" }} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic">
                  ה-AI זיהה חריגה של 5% בשעות הפיתוח החודש.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="font-black italic mb-4 flex items-center gap-2">
                <FileSearch className="text-indigo-500" aria-hidden /> לוביסט AI — חיסכון
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                נמצאו עמלות בנק חריגות (1.2%). ה-AI ניסח מכתב דרישה להפחתה ל-0.4%.
              </p>
              <button
                type="button"
                className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
              >
                שלח מכתב דרישה לבנק
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-gray-900 shadow-sm">
            <div className="relative z-10">
              <h3 className="text-xl font-black italic mb-6 flex items-center gap-2">
                <Mic
                  size={20}
                  className={isRecording ? "text-rose-500 animate-pulse" : "text-indigo-600"}
                />{" "}
                Voice Insights
              </h3>
              <button
                type="button"
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-black text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                {isRecording ? "מקשיב לך..." : "לחץ ודבר עם המערכת"}
              </button>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
              <BrainCircuit size={120} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h4 className="font-black italic mb-6 flex items-center gap-2">
              <MessageSquareHeart className="text-rose-400" aria-hidden /> שירות וגבייה
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-bold">לקוח: אקווה סטאר</p>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    לקוח מרוצה
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-white p-2 text-indigo-600 transition-colors hover:bg-indigo-50"
                  aria-label="ווטסאפ"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-bold text-rose-700">
                  חוב של ₪12,000 — לשלוח תזכורת?
                </p>
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-rose-600 px-3 py-1 text-[10px] font-black italic text-white transition-colors hover:bg-rose-700"
                >
                  שלח עכשיו
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-8 text-gray-900 shadow-sm">
            <h4 className="mb-6 flex items-center gap-2 font-black italic text-indigo-900">
              <Zap className="text-indigo-500" aria-hidden /> Business Pulse
            </h4>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-gray-600">
                  יעד הכנסות חודשי: ₪100K
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full border border-indigo-100 bg-white p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    className="h-full rounded-full bg-indigo-600"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVaultOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white py-3 text-xs font-black text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
              >
                <Lock size={14} /> כספת רואה חשבון: 14 מסמכים מוכנים
              </button>
              <button
                type="button"
                onClick={() => {
                  setDailyOpen(true);
                  void loadDaily();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                תובנה פיננסית יומית (מילת היום)
              </button>
            </div>
          </div>
        </div>
      </div>

      {vaultOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-900/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-title"
          onClick={() => setVaultOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 id="vault-title" className="text-lg font-black flex items-center gap-2">
                <Lock className="text-indigo-600" size={22} /> כספת מסמכים לרואה חשבון
              </h3>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-gray-100"
                aria-label="סגור"
                onClick={() => setVaultOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              רשימת פריטים מוכנים לשיתוף (דוגמה): חשבוניות חודשיות, דוח מע״מ, התאמות בנק.
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-gray-700">
              <li>חשבוניות ספקים — 8 קבצים</li>
              <li>דוח ריכוז עוסק — PDF</li>
              <li>דוח AI סיכום הוצאות</li>
            </ul>
            <button
              type="button"
              onClick={() => setVaultOpen(false)}
              className="btn-primary mt-6 w-full py-3"
            >
              סגור
            </button>
          </div>
        </div>
      ) : null}

      {dailyOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-900/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-title"
          onClick={() => setDailyOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 id="daily-title" className="text-lg font-black text-indigo-700">
                תובנה פיננסית יומית
              </h3>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-gray-100"
                aria-label="סגור"
                onClick={() => setDailyOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            {dailyMeta ? (
              <p className="text-xs text-gray-500 mb-2">עודכן: {dailyMeta}</p>
            ) : null}
            {dailyLoading ? (
              <div className="flex items-center gap-2 text-gray-600 py-8 justify-center">
                <Loader2 className="animate-spin" size={28} />
                טוען…
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">{dailyText}</p>
            )}
            <button
              type="button"
              onClick={() => setDailyOpen(false)}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700"
            >
              סגור
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
