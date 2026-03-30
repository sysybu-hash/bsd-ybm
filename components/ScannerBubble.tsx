"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X } from "lucide-react";
import MultiEngineScanner from "@/components/MultiEngineScanner";

type Variant = "dark" | "light";

/**
 * כפתור צף → מסך סריקה מלא (לא פופאפ קטן) — סגירה רק ב־X, בלי לחיצת רקע,
 * כדי למנוע פתיחה/סגירה חוזרת בטעות.
 * dock: ללא מעטפת fixed — לשימוש ב־DashboardBottomDock
 */
export default function ScannerBubble({
  variant = "light",
  dock = false,
}: {
  variant?: Variant;
  dock?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  void variant;

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const overlayBg = "bg-slate-100/95 backdrop-blur-md";
  const headerBorder = "border-slate-200 bg-white/90";

  const wrapClass = dock
    ? "relative z-[2] inline-block"
    : "fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-4 z-[100] sm:bottom-8 sm:right-8";

  return (
    <div className={wrapClass} dir="rtl">
      {!isOpen ? (
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-label="פתח מסך סריקה מלא"
          className="bg-[var(--primary-color)] p-5 rounded-full shadow-2xl shadow-blue-600/40 relative overflow-hidden group text-white"
        >
          <Layers size={28} />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none" />
        </motion.button>
      ) : null}

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="scan-fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="סריקת מסמכים רב־מנועית"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[200] flex flex-col ${overlayBg}`}
          >
            <header
              className={`shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b ${headerBorder}`}
            >
              <h2 className="text-lg font-black text-slate-900">
                סריקה רב־מנועית — חלון קבוע
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl transition-colors bg-slate-100 text-slate-800 hover:bg-slate-200"
                aria-label="סגור מסך סריקה"
              >
                <X size={22} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
              <div className="max-w-5xl mx-auto w-full p-4 pb-16 md:p-6 md:pb-20">
                <MultiEngineScanner variant="light" fillHeight compactHeader />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
