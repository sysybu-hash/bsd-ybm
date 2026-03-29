"use client";

import { useState, useEffect } from "react";
import { Accessibility, Palette, Type, Contrast, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const colors = [
  { name: "כחול BSD", value: "#3b82f6" },
  { name: "ירוק אזמרגד", value: "#10b981" },
  { name: "סגול מלכותי", value: "#8b5cf6" },
  { name: "זהב עסקי", value: "#f59e0b" },
  { name: "אדום עוצמה", value: "#ef4444" },
];

const FONT_KEY = "bsd-font-large";
const CONTRAST_KEY = "bsd-high-contrast";

function normalizeHex(raw: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw : "#3b82f6";
}

type Props = {
  /** בתוך שורת Dock בתחתית הדשבורד — בלי position:fixed על המסך כולו */
  dock?: boolean;
};

export default function AccessibilityMenu({ dock = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeColor, setActiveColor] = useState("#3b82f6");
  const [fontLarge, setFontLarge] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const saved =
      localStorage.getItem("bsd-theme-color") || localStorage.getItem("user-theme-color") || "#3b82f6";
    const color = normalizeHex(saved);
    setActiveColor(color);
    document.documentElement.style.setProperty("--primary-color", color);
    document.documentElement.style.setProperty("--heading-color", color);

    setFontLarge(localStorage.getItem(FONT_KEY) === "1");
    setHighContrast(localStorage.getItem(CONTRAST_KEY) === "1");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("font-large", fontLarge);
    localStorage.setItem(FONT_KEY, fontLarge ? "1" : "0");
  }, [fontLarge]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem(CONTRAST_KEY, highContrast ? "1" : "0");
  }, [highContrast]);

  const updateColor = (color: string) => {
    setActiveColor(color);
    document.documentElement.style.setProperty("--primary-color", color);
    document.documentElement.style.setProperty("--heading-color", color);
    localStorage.setItem("bsd-theme-color", color);
    localStorage.setItem("user-theme-color", color);
    window.dispatchEvent(new Event("bsd-theme-change"));
  };

  const activeToggle = "bg-[var(--primary-color)]/15 text-slate-900 border border-[var(--primary-color)]/35";
  const idleToggle = "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-100";

  const rootClass = dock
    ? "relative z-[2]"
    : "fixed bottom-[max(5.5rem,env(safe-area-inset-bottom,0px))] start-6 z-[120] sm:bottom-24 sm:start-8";

  return (
    <div className={rootClass} dir="rtl" role="region" aria-label="התאמות נגישות">
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "סגור תפריט נגישות" : "פתח נגישות וצבעים"}
        className="bg-white border border-slate-200 text-slate-700 p-4 rounded-full shadow-xl hover:bg-slate-50 transition-colors"
      >
        <Accessibility size={24} className="text-[var(--primary-color,#3b82f6)]" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className={`absolute w-64 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-6 text-slate-900 ${
              dock
                ? "bottom-[calc(100%+0.5rem)] start-1/2 -translate-x-1/2"
                : "bottom-[4.5rem] start-0"
            }`}
          >
            <h4 className="font-black italic mb-4 flex items-center gap-2 text-slate-900">
              <Palette size={18} className="text-[var(--primary-color,#3b82f6)]" aria-hidden />
              נראות וצבעים
            </h4>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  aria-label={`צבע ${c.name}`}
                  aria-pressed={activeColor === c.value}
                  onClick={() => updateColor(c.value)}
                  className="relative w-8 h-8 rounded-full border-2 border-slate-200 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  style={{ backgroundColor: c.value }}
                >
                  {activeColor === c.value ? (
                    <Check size={12} className="absolute inset-0 m-auto text-white drop-shadow-md" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setHighContrast((v) => !v)}
                className={`w-full flex justify-between items-center p-3 rounded-xl text-xs font-bold transition-colors ${
                  highContrast ? activeToggle : idleToggle
                }`}
              >
                {highContrast ? "ניגודיות רגילה" : "ניגודיות גבוהה"}
                <Contrast size={14} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setFontLarge((v) => !v)}
                className={`w-full flex justify-between items-center p-3 rounded-xl text-xs font-bold transition-colors ${
                  fontLarge ? activeToggle : idleToggle
                }`}
              >
                {fontLarge ? "גודל טקסט רגיל" : "הגדלת טקסט"}
                <Type size={14} aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
