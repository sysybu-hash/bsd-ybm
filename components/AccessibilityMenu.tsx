"use client";

import { useState, useEffect } from "react";
import { Accessibility, X, Type, Contrast, MousePointer2, ZoomIn, Eye, Sparkles, Palette } from "lucide-react";

export default function AccessibilityMenu({ dock = false }: { dock?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontLarge, setFontLarge] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [bigCursor, setBigCursor] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [themeColor, setThemeColor] = useState("indigo");

  const THEME_OPTIONS = [
    { id: "indigo", color: "#4f46e5", label: "אינדיגו (ברירת מחדל)" },
    { id: "emerald", color: "#10b981", label: "ירוק אמרלד" },
    { id: "rose", color: "#f43f5e", label: "ורוד רוז" },
    { id: "amber", color: "#f59e0b", label: "ענבר מוזהב" },
    { id: "blue", color: "#2563eb", label: "כחול עסקי" },
    { id: "violet", color: "#8b5cf6", label: "סגול יוקרתי" },
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bsd-theme-color");
      if (stored) setThemeColor(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.toggle("font-large", fontLarge);
      root.classList.toggle("high-contrast", highContrast);
      root.classList.toggle("big-cursor", bigCursor);
      root.classList.toggle("grayscale", grayscale);
      
      // Update primary brand color variable
      const theme = THEME_OPTIONS.find(t => t.id === themeColor);
      if (theme) {
        root.style.setProperty("--primary-brand", theme.color);
        localStorage.setItem("bsd-theme-color", themeColor);
      }
    }
  }, [fontLarge, highContrast, bigCursor, grayscale, themeColor]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const OPTIONS = [
    { id: "font", label: "גופן גדול", icon: Type, active: fontLarge, setter: setFontLarge },
    { id: "contrast", label: "ניגודיות גבוהה", icon: Contrast, active: highContrast, setter: setHighContrast },
    { id: "cursor", label: "סמן ענק", icon: MousePointer2, active: bigCursor, setter: setBigCursor },
    { id: "color", label: "גווני אפור", icon: Eye, active: grayscale, setter: setGrayscale },
  ];

  const MenuContent = (
    <div className={`${dock ? "absolute top-0 right-14 w-[320px]" : "w-full max-w-sm"} rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-right-4 duration-300 z-[350]`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Accessibility size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-none">תפריט נגישות</h3>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">BSD-YBM פתרונות AI</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => opt.setter(!opt.active)}
            className={`w-full group flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
              opt.active 
                ? "border-[var(--primary-brand,#4f46e5)] bg-slate-50 text-slate-900" 
                : "border-slate-50 bg-slate-50/30 text-slate-600 hover:border-slate-200 hover:bg-slate-50/80"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                opt.active ? "bg-[var(--primary-brand,#4f46e5)] text-white shadow-md shadow-black/10" : "bg-white text-slate-400 shadow-sm"
              }`}>
                <opt.icon size={20} />
              </div>
              <span className="text-sm font-black italic">{opt.label}</span>
            </div>
            <div className={`h-4 w-4 rounded-full border-4 transition-all ${
              opt.active 
                ? "bg-[var(--primary-brand,#4f46e5)] border-white shadow-[0_0_12px_rgba(0,0,0,0.1)] scale-110" 
                : "bg-slate-200 border-white shadow-inner"
            }`} />
          </button>
        ))}
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
          <Palette size={14} /> סקאלת צבעי האתר
        </h4>
        <div className="grid grid-cols-6 gap-2">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setThemeColor(t.id)}
              title={t.label}
              className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                themeColor === t.id ? "border-slate-900 scale-125 shadow-lg" : "border-white"
              }`}
              style={{ backgroundColor: t.color }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            setFontLarge(false);
            setHighContrast(false);
            setBigCursor(false);
            setGrayscale(false);
          }}
          className="flex-1 py-3 text-xs font-black text-slate-400 hover:text-slate-900 transition-colors"
        >
          איפוס הגדרות
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95"
        >
          סגור תפריט
        </button>
      </div>
    </div>
  );

  if (dock) {
    return (
      <div className="relative" dir="rtl">
        <button
          onClick={toggleOpen}
          className={`group flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
            isOpen ? "bg-[var(--primary-brand,#4f46e5)] text-white shadow-lg shadow-black/10" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="תפריט נגישות"
        >
          <Accessibility size={20} className={isOpen ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
        </button>

        {isOpen && MenuContent}
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-8 z-[300]" dir="rtl">
      <button
        onClick={toggleOpen}
        className={`group h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-90 ${
          isOpen ? "bg-rose-500 rotate-90" : "bg-indigo-600"
        }`}
        style={{
          boxShadow: isOpen ? "0 20px 40px -10px rgba(244, 63, 94, 0.45)" : "0 20px 40px -10px rgba(79, 70, 229, 0.45)"
        }}
      >
        {isOpen ? <X size={28} /> : <Accessibility size={28} />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div onClick={(e) => e.stopPropagation()}>
            {MenuContent}
          </div>
        </div>
      )}
    </div>
  );
}
