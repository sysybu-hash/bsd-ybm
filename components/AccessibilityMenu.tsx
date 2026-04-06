"use client";

import { useState, useEffect } from "react";
import { Accessibility, Palette, Type, Contrast, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** בועות צבע — 5 אפשרויות מוגדרות */
const colors = [
  { name: "כחול BSD", value: "#2563eb" },
  { name: "ירוק אזמרגד", value: "#10b981" },
  { name: "סגול מלכותי", value: "#7c3aed" },
  { name: "ים תיכוני", value: "#0891b2" },
  { name: "אדום עוצמה", value: "#dc2626" },
];

const FONT_KEY = "bsd-font-large";
const CONTRAST_KEY = "bsd-high-contrast";
const DEFAULT_COLOR = "#2563eb";

// רק צבעים שקיימים בפלטה המאושרת
const APPROVED_COLORS = new Set(colors.map((c) => c.value.toLowerCase()));

function normalizeHex(raw: string | null | undefined): string {
  const hex = /^#[0-9A-Fa-f]{6}$/.test(raw ?? "") ? (raw as string).toLowerCase() : "";
  return APPROVED_COLORS.has(hex) ? hex : DEFAULT_COLOR;
}

type Props = {
  /** בתוך שורת Dock בתחתית הדשבורד */
  dock?: boolean;
};

export default function AccessibilityMenu({ dock = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR);
  const [fontLarge, setFontLarge] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const saved =
      localStorage.getItem("bsd-theme-color") ||
      localStorage.getItem("user-theme-color") ||
      DEFAULT_COLOR;
    const color = normalizeHex(saved);
    setActiveColor(color);
    document.documentElement.style.setProperty("--primary-color", color);


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

    localStorage.setItem("bsd-theme-color", color);
    localStorage.setItem("user-theme-color", color);
    window.dispatchEvent(new Event("bsd-theme-change"));
  };

  const activeToggle =
    "bg-white/[0.05] text-white border border-white/[0.08] ring-1 ring-[var(--primary-color,#2563eb)]/20";
  const idleToggle =
    "bg-[#0a0b14] hover:bg-white/[0.03] text-white/65 border border-white/[0.08]";

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
        className="border border-white/[0.08] bg-[#0a0b14] p-3.5 rounded-full shadow-lg hover:bg-white/[0.03] transition-colors text-white/55"
      >
        <Accessibility size={22} style={{ color: "var(--primary-color, #4f46e5)" }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -12, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className={`absolute w-60 rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-5 shadow-lg shadow-gray-200/60 text-white ${
              dock
                ? "bottom-[calc(100%+0.75rem)] start-1/2 -translate-x-1/2"
                : "bottom-[4.5rem] start-0"
            }`}
          >
            {/* כותרת */}
            <h4 className="mb-4 flex items-center gap-2 text-sm font-black text-white/75">
              <Palette size={16} style={{ color: "var(--primary-color, #4f46e5)" }} aria-hidden />
              נראות וצבעים
            </h4>

            {/* בועות צבע */}
            <div className="mb-4 grid grid-cols-5 gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  aria-label={`צבע ${c.name}`}
                  aria-pressed={activeColor === c.value}
                  onClick={() => updateColor(c.value)}
                  className="relative h-8 w-8 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{
                    backgroundColor: c.value,
                    boxShadow:
                      activeColor === c.value
                        ? `0 0 0 3px white, 0 0 0 5px ${c.value}`
                        : undefined,
                  }}
                >
                  {activeColor === c.value ? (
                    <Check size={11} className="absolute inset-0 m-auto text-white drop-shadow" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="h-px bg-white/[0.05] mb-4" />

            {/* מתגים */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setHighContrast((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  highContrast ? activeToggle : idleToggle
                }`}
              >
                <span>{highContrast ? "ניגודיות רגילה" : "ניגודיות גבוהה"}</span>
                <Contrast size={14} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setFontLarge((v) => !v)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  fontLarge ? activeToggle : idleToggle
                }`}
              >
                <span>{fontLarge ? "גודל טקסט רגיל" : "הגדלת טקסט"}</span>
                <Type size={14} aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
