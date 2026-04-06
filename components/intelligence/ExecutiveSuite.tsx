"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingCart,
  PenTool,
  Map,
  Clock,
  ShieldCheck,
  GraduationCap,
  ArrowUpRight,
  Globe2,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

export default function ExecutiveSuite() {
  const { dir } = useI18n();
  const primaryColor = "var(--primary-color, #4f46e5)";

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-gray-900 md:p-10" dir={dir}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-avenue mb-12 flex flex-col gap-4 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-sm">
            <Clock size={24} aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-black italic">סיכום יום BSD Intelligence</h2>
            <p className="text-sm text-gray-400 font-medium">
              היום נכנסו ₪12,400. יש 4 חוזים שממתינים לחתימה דיגיטלית.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-xs font-black uppercase tracking-tighter text-indigo-400 hover:underline self-start sm:self-center"
        >
          לדוח המלא
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-8">
          <div className="card-avenue bg-white p-6 shadow-sm">
            <div className="flex justify-between mb-6">
              <div className="rounded-2xl bg-indigo-500/15 p-3">
                  <TrendingUp style={{ color: primaryColor }} size={24} />
              </div>
              <span className="flex items-center gap-1 text-xs font-black text-emerald-500">
                <ArrowUpRight size={14} /> 14%
              </span>
            </div>
            <h4 className="mb-1 text-[10px] font-black uppercase text-gray-400">
              שווי עסק מוערך
            </h4>
            <p className="text-4xl font-black italic tracking-tighter">₪1,250,000</p>
            <p className="mt-4 text-[10px] italic text-gray-400">
              מבוסס על רווח וצמיחה ב-CRM.
            </p>
          </div>

          <div className="card-avenue bg-gray-50 p-8">
            <h4 className="font-black italic mb-4 flex items-center gap-2 text-sm">
              <ShoppingCart size={18} aria-hidden /> עוזר רכש AI
            </h4>
            <div className="p-4 bg-white rounded-2xl border border-gray-200 text-xs space-y-2 shadow-sm">
              <p className="font-bold text-rose-500">מלאי &quot;נייר טיוטה&quot; נמוך!</p>
              <p className="text-gray-400">נמצא ספק זול ב-12% מ-OfficeDepot.</p>
              <button
                type="button"
                className="btn-primary mt-2 w-full rounded-lg py-2"
              >
                צור הזמנה
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="card-avenue min-h-[350px] bg-white p-8 shadow-sm">
            <h4 className="font-black italic mb-6 flex items-center gap-2">
              <Map className="text-emerald-500" aria-hidden /> פריסת לקוחות גאוגרפית (Heatmap)
            </h4>
            <div className="flex min-h-[220px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 font-bold italic text-gray-400">
              [הדמיית מפה אינטראקטיבית — פוקוס: מרכז הארץ]
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative overflow-hidden rounded-2xl bg-indigo-600 p-8 text-white shadow-sm">
              <Globe2
                className="absolute top-[-20px] left-[-20px] text-gray-200"
                size={120}
                aria-hidden
              />
              <h4 className="font-black italic mb-4">Marketing AI</h4>
              <p className="text-xs text-indigo-100 mb-6">
                ה-AI זיהה זינוק במכירות &quot;משק בית&quot;. רוצה לייצר קמפיין פייסבוק ממוקד?
              </p>
              <button
                type="button"
                className="rounded-xl bg-white px-6 py-2 text-xs font-black text-indigo-400 shadow-sm"
              >
                צור פוסטים
              </button>
            </div>

            <div className="card-avenue bg-white p-8 shadow-sm">
              <h4 className="font-black italic mb-4 flex items-center gap-2">
                <PenTool className="text-indigo-500" aria-hidden /> חתימה דיגיטלית
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl gap-2">
                  <span className="text-[10px] font-bold">חוזה שירות — אקווה</span>
                  <span className="text-[10px] text-indigo-500 font-black italic shrink-0">ממתין</span>
                </div>
                <button
                  type="button"
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-bold text-gray-400"
                >
                  שלח מסמך חדש
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card-avenue bg-white p-8 text-gray-900 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-6">
              סטטוס בנקים מאוחד
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-xs">בנק הפועלים (842)</span>
                <span className="text-xs font-bold">₪42,100</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-xs">כרטיס עסקי Platinum</span>
                <span className="text-xs font-bold text-rose-400">-₪8,400</span>
              </div>
            </div>
          </div>

          <div className="card-avenue border-emerald-500/25 bg-emerald-500/15 p-8">
            <h4 className="font-black italic text-emerald-900 mb-2 flex items-center gap-2">
              <ShieldCheck size={18} aria-hidden /> יועץ מס AI
            </h4>
            <p className="text-[10px] text-emerald-400 leading-relaxed font-medium">
              &quot;יוחנן, מצאתי ₪4,200 בהוצאות רכב שניתן להכיר בהן. להוסיף לדיווח הרבעוני?&quot;
            </p>
          </div>

          <div className="card-avenue bg-white p-8 text-center shadow-sm">
            <GraduationCap className="mx-auto text-indigo-500 mb-4" size={32} />
            <h4 className="text-sm font-black italic">איך קוראים דוח P&amp;L?</h4>
            <p className="text-[10px] text-gray-400 mb-4">מדריך קצר של 2 דקות מותאם לעסק שלך.</p>
            <button type="button" className="text-xs font-bold text-indigo-400">
              צפה עכשיו
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
