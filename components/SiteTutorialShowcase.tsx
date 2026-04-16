"use client";

import { useEffect, useState, useCallback, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Sparkles,
  LogIn,
  ScanLine,
  Bot,
} from "lucide-react";

type Scene = {
  id: string;
  title: string;
  subtitle: string;
  Visual: ComponentType;
};

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm text-right">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400/90" />
          <span className="w-3 h-3 rounded-full bg-teal-400/90" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/90" />
        </div>
        <div className="flex-1 text-center text-[10px] text-gray-400 font-mono truncate px-2">
          bsd-ybm.co.il
        </div>
      </div>
      <div className="p-4 min-h-[200px] bg-gray-50/80">{children}</div>
    </div>
  );
}

function SceneHome() {
  return (
    <BrowserChrome>
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black italic text-teal-700"
        >
          BSD-YBM<span className="text-[var(--primary-color,#3b82f6)]">.</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-gray-400"
        >
          דף נחיתה — גלילה לסקטורים, בחירת מסלול, כניסה לדשבורד
        </motion.p>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex gap-2 justify-end flex-wrap"
        >
          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
            AI
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-[10px] font-bold">
            ERP
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            CRM
          </span>
        </motion.div>
      </div>
    </BrowserChrome>
  );
}

function SceneLogin() {
  return (
    <BrowserChrome>
      <div className="flex flex-col items-center justify-center min-h-[180px] gap-4">
        <LogIn className="text-[var(--primary-color,#3b82f6)]" size={36} />
        <motion.button
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="px-6 py-2 rounded-2xl bg-white border-2 border-gray-200 text-xs font-bold text-gray-700 shadow-sm"
        >
          המשך עם Google
        </motion.button>
        <p className="text-[10px] text-gray-400 text-center max-w-[220px]">
          התחברות מאובטחת — המערכת תזהה את הארגון שלך
        </p>
      </div>
    </BrowserChrome>
  );
}

function SceneDashboard() {
  return (
    <BrowserChrome>
      <div className="flex gap-3 flex-row-reverse">
        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[38%] shrink-0 rounded-xl bg-white border border-gray-200 p-2 space-y-1"
        >
          <div className="text-[9px] font-black text-[var(--primary-color,#3b82f6)] mb-1">BSD-YBM</div>
          {[
            { Icon: LayoutDashboard, label: "דשבורד", active: true },
            { Icon: Users, label: "CRM" },
            { Icon: FileText, label: "ERP" },
            { Icon: Settings, label: "הגדרות" },
          ].map(({ Icon, label, active }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 flex-row-reverse text-[9px] p-1.5 rounded-lg ${
                active ? "bg-teal-500/15 text-teal-800 font-bold" : "text-gray-500"
              }`}
            >
              <Icon size={12} /> {label}
            </div>
          ))}
        </motion.aside>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex-1 rounded-xl bg-white border border-dashed border-gray-200 p-3 text-[10px] text-gray-400"
        >
          אזור תוכן — חיפוש ארכיון, תובנות AI, ווידג׳טים
        </motion.div>
      </div>
    </BrowserChrome>
  );
}

function SceneERP() {
  return (
    <BrowserChrome>
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-row-reverse text-[11px] font-bold text-gray-700">
          <ScanLine className="text-[var(--primary-color,#3b82f6)]" size={18} />
          סורק AI — העלאת חשבוניות
        </div>
        <motion.div
          animate={{ borderColor: ["#e2e8f0", "#93c5fd", "#e2e8f0"] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="rounded-2xl border-2 border-dashed p-6 text-center text-[10px] text-gray-400 bg-white"
        >
          גרור קבצים או לחץ להפעלת סריקה חכמה
        </motion.div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 0.4, ease: "easeInOut" }}
            style={{ transformOrigin: "100% 50%" }}
            className="h-full w-[85%] rounded-full bg-teal-500/15 ms-auto"
          />
        </div>
      </div>
    </BrowserChrome>
  );
}

function SceneCRM() {
  return (
    <BrowserChrome>
      <div className="text-[10px]">
        <div className="font-bold text-gray-700 mb-2 flex items-center gap-1 flex-row-reverse">
          <Users size={14} className="text-emerald-400" />
          טבלת לקוחות
        </div>
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
          {["לקוח א", "לקוח ב"].map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex justify-between items-center px-2 py-2 border-b border-gray-100 text-gray-600"
            >
              <span className="text-emerald-400 text-[9px] bg-emerald-500/15 px-1 rounded">פעיל</span>
              <span>{name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </BrowserChrome>
  );
}

function SceneAI() {
  return (
    <BrowserChrome>
      <div className="relative min-h-[160px]">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-0 left-0 w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center shadow-lg"
        >
          <Bot className="text-white" size={22} />
        </motion.div>
        <div className="me-14 rounded-2xl bg-white border border-gray-200 p-3 text-[9px] text-gray-500 leading-relaxed">
          עוזר פיננסי — שאלו על הוצאות, מסמכים ותובנות מהמסד שלך
        </div>
      </div>
    </BrowserChrome>
  );
}

const SCENES: Scene[] = [
  {
    id: "home",
    title: "דף הבית",
    subtitle: "חשיפה לפתרון AI + ERP + CRM, מסלולי מחיר וכניסה למערכת",
    Visual: SceneHome,
  },
  {
    id: "login",
    title: "התחברות",
    subtitle: "כניסה עם Google — זיהוי משתמש וארגון",
    Visual: SceneLogin,
  },
  {
    id: "dash",
    title: "דשבורד",
    subtitle: "תפריט צד: דשבורד, CRM, ERP, הגדרות והתנתקות",
    Visual: SceneDashboard,
  },
  {
    id: "erp",
    title: "ERP — סריקה",
    subtitle: "העלאת מסמכים, מנוע AI ופענוח נתונים למסד",
    Visual: SceneERP,
  },
  {
    id: "crm",
    title: "CRM",
    subtitle: "ניהול אנשי קשר, סטטוסים והצעות מחיר",
    Visual: SceneCRM,
  },
  {
    id: "ai",
    title: "עוזר AI",
    subtitle: "בועת הצ׳אט — שאלות פיננסיות על הנתונים שלך",
    Visual: SceneAI,
  },
];

type Props = {
  /** מצב קומפקטי לעמוד הבית */
  variant?: "page" | "embedded";
};

export default function SiteTutorialShowcase({ variant = "page" }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const embedded = variant === "embedded";

  const next = useCallback(() => setIndex((i) => (i + 1) % SCENES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SCENES.length) % SCENES.length), []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(next, embedded ? 5500 : 7000);
    return () => clearInterval(t);
  }, [playing, next, embedded]);

  const scene = SCENES[index];
  const Visual = scene.Visual;

  return (
    <div
      className={`w-full ${embedded ? "" : "max-w-3xl mx-auto py-8 px-4"}`}
      dir="rtl"
      aria-label="הדרכה מונפשת על פעולות האתר"
    >
      {!embedded && (
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/15 border border-teal-500/20 text-teal-800 text-xs font-bold mb-4"
          >
            <Sparkles size={16} /> הדרכה ויזואלית
          </motion.div>
          <h2 className="text-3xl font-black italic text-gray-900 mb-2">איך משתמשים ב-BSD-YBM</h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            סדרת שקפים מונפשת — מדגימה את זרימת העבודה מהדף הראשי ועד סריקת מסמכים ועוזר ה-AI
          </p>
        </div>
      )}

      <div
        className={`rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/90 shadow-sm ${
          embedded ? "p-4" : "p-6 md:p-8"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">{scene.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{scene.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse justify-end">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              aria-label={playing ? "השהה" : "נגן"}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              onClick={prev}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100"
              aria-label="שקף קודם"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100"
              aria-label="שקף הבא"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-4 flex-row-reverse justify-center">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-8 bg-[var(--primary-color,#3b82f6)]" : "w-2 bg-gray-100"
              }`}
              aria-label={`שקף ${i + 1}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
          >
            <Visual />
          </motion.div>
        </AnimatePresence>

        {!embedded && (
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
                href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-500/15 transition-colors"
            >
              כניסה לדשבורד
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50"
            >
              התחברות
            </Link>
          </div>
        )}
      </div>

      {!embedded && (
        <p className="text-center text-xs text-gray-400 mt-6 max-w-md mx-auto">
          זו הדרכה אינטראקטיבית מובנית באתר. ליצירת קובץ וידאו (MP4) — ניתן להקליט את המסך בזמן ניגון
          ההדרכה או לייצא מהעורך שבו אתה עורך סרטונים.
        </p>
      )}
    </div>
  );
}
