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
    <div className="space-y-6 p-4 font-sans text-gray-900 md:p-6" dir={dir}>
      {/* ── Premium header ── */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-7 md:px-8">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-500" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-[11px] font-bold text-indigo-400">
              <BrainCircuit size={11} /> BSD Intelligence Hub
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900">
              Mission Control <span className="text-indigo-400">.</span>
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
              ניהול אוטונומי מלא — תחזיות, ניתוחים והמלצות בזמן אמת
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-400">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Self-Healing פעיל
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-400">
              <ShieldAlert size={13} aria-hidden />
              AI Guardian: חסם כפילות
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h3 className="text-base font-black flex items-center gap-2 text-gray-900">
                <BrainCircuit className="text-indigo-400" /> חיזוי תזרים וסימולציה
              </h3>
              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100"
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
                className="mt-5 rounded-xl border border-indigo-500/25 bg-indigo-500/15 p-4 text-xs text-indigo-400"
              >
                הדמיה: הוספת הוצאה של ₪15,000 ב-14/04 תגרום לירידה מתחת לקו האדום.
              </motion.div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h4 className="font-black mb-4 flex items-center gap-2 text-gray-900">
                <Target className="text-indigo-400" aria-hidden /> רווחיות פרויקטים חי
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1 uppercase text-gray-600">
                    BSD App Development
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: "82%" }} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 italic">
                  ה-AI זיהה חריגה של 5% בשעות הפיתוח החודש.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h4 className="font-black mb-4 flex items-center gap-2 text-gray-900">
                <FileSearch className="text-indigo-400" aria-hidden /> לוביסט AI — חיסכון
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                נמצאו עמלות בנק חריגות (1.2%). ה-AI ניסח מכתב דרישה להפחתה ל-0.4%.
              </p>
              <button
                type="button"
                className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:underline"
              >
                שלח מכתב דרישה לבנק
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6">
            <div className="relative z-10">
              <h3 className="text-base font-black mb-5 flex items-center gap-2 text-gray-900">
                <Mic
                  size={16}
                  className={isRecording ? "text-rose-400 animate-pulse" : "text-indigo-400"}
                />{" "}
                Voice Insights
              </h3>
              <button
                type="button"
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => setIsRecording(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-4 font-black text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-400"
              >
                {isRecording ? "מקשיב לך..." : "לחץ ודבר עם המערכת"}
              </button>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
              <BrainCircuit size={120} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h4 className="font-black mb-5 flex items-center gap-2 text-gray-900">
              <MessageSquareHeart className="text-rose-400" aria-hidden /> שירות וגבייה
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">לקוח: אקווה סטאר</p>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-black uppercase">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    לקוח מרוצה
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-indigo-400 transition-colors hover:bg-indigo-500/15"
                  aria-label="ווטסאפ"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/25 bg-rose-500/15 p-4">
                <p className="text-xs font-bold text-rose-400">
                  חוב של ₪12,000 — לשלוח תזכורת?
                </p>
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-rose-500/80 px-3 py-1 text-[10px] font-black italic text-white transition-colors hover:bg-rose-500"
                >
                  שלח עכשיו
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.07] p-6">
            <h4 className="mb-5 flex items-center gap-2 font-black text-indigo-300">
              <Zap className="text-indigo-400" aria-hidden /> Business Pulse
            </h4>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-gray-400">
                  יעד הכנסות חודשי: ₪100K
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full border border-gray-100 bg-gray-100 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "72%" }}
                    className="h-full rounded-full bg-indigo-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVaultOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-xs font-black text-indigo-400 transition-colors hover:bg-indigo-500/15"
              >
                <Lock size={14} /> כספת רואה חשבון: 14 מסמכים מוכנים
              </button>
              <button
                type="button"
                onClick={() => {
                  setDailyOpen(true);
                  void loadDaily();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-xs font-black text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-400"
              >
                תובנה פיננסית יומית (מילת היום)
              </button>
            </div>
          </div>
        </div>
      </div>

      {vaultOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-title"
          onClick={() => setVaultOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 id="vault-title" className="text-lg font-black flex items-center gap-2 text-gray-900">
                <Lock className="text-indigo-400" size={22} /> כספת מסמכים לרואה חשבון
              </h3>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
                aria-label="סגור"
                onClick={() => setVaultOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              רשימת פריטים מוכנים לשיתוף (דוגמה): חשבוניות חודשיות, דוח מע״מ, התאמות בנק.
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-gray-600">
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
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-title"
          onClick={() => setDailyOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 id="daily-title" className="text-lg font-black text-indigo-400">
                תובנה פיננסית יומית
              </h3>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
                aria-label="סגור"
                onClick={() => setDailyOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            {dailyMeta ? (
              <p className="text-xs text-gray-400 mb-2">עודכן: {dailyMeta}</p>
            ) : null}
            {dailyLoading ? (
              <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                <Loader2 className="animate-spin" size={28} />
                טוען…
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{dailyText}</p>
            )}
            <button
              type="button"
              onClick={() => setDailyOpen(false)}
              className="mt-6 w-full rounded-xl bg-indigo-500 py-3 font-bold text-white transition-colors hover:bg-indigo-400"
            >
              סגור
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
