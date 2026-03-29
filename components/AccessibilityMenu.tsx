"use client";

import { useState, useEffect } from "react";
import { Accessibility, X, Palette, Type, Contrast, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const colors = [
  { name: "BSD Blue", value: "#3b82f6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Golden", value: "#f59e0b" },
  { name: "Ruby", value: "#ef4444" },
];

const FONT_KEY = "bsd-font-large";
const CONTRAST_KEY = "bsd-high-contrast";

function normalizeHex(raw: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw : "#3b82f6";
}

export default function AccessibilityMenu() {
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

  const updateTheme = (color: string) => {
    setActiveColor(color);
    document.documentElement.style.setProperty("--primary-color", color);
    document.documentElement.style.setProperty("--heading-color", color);
    localStorage.setItem("bsd-theme-color", color);
    localStorage.setItem("user-theme-color", color);
    window.dispatchEvent(new Event("bsd-theme-change"));
  };

  const activeRing =
    "bg-[var(--primary-color)]/15 text-slate-900 border border-[var(--primary-color)]/30";
  const inactiveToggle = "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200";

  return (
    <div className="fixed bottom-24 left-6 z-[100]" dir="rtl" role="region" aria-label="התאמות נגישות">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="fab"
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            aria-label="פתח התאמה אישית ונגישות"
            className="bg-white backdrop-blur-md border border-slate-200 p-4 rounded-full hover:scale-110 transition-all shadow-lg shadow-slate-200/80 group"
          >
            <Accessibility
              size={24}
              className="text-[var(--primary-color)] group-hover:text-[var(--primary-color)] transition-colors"
            />
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="glass-card-light p-6 rounded-[2.5rem] w-72 text-slate-900"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2 text-sm text-slate-900">
                <Palette size={16} aria-hidden /> התאמה אישית
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-900 p-1 rounded-lg"
                aria-label="סגור"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-3">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    aria-label={`צבע ${c.name}`}
                    aria-pressed={activeColor === c.value}
                    onClick={() => updateTheme(c.value)}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    style={{ backgroundColor: c.value }}
                  >
                    {activeColor === c.value && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFontLarge((v) => !v)}
                  className={`w-full flex justify-between items-center p-3 rounded-2xl text-xs transition-colors ${
                    fontLarge ? activeRing : inactiveToggle
                  }`}
                >
                  <span>{fontLarge ? "גודל גופן רגיל" : "הגדלת גופן"}</span>
                  <Type size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setHighContrast((v) => !v)}
                  className={`w-full flex justify-between items-center p-3 rounded-2xl text-xs transition-colors ${
                    highContrast ? activeRing : inactiveToggle
                  }`}
                >
                  <span>{highContrast ? "ניגודיות רגילה" : "ניגודיות גבוהה"}</span>
                  <Contrast size={14} aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
