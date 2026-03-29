"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, BookOpen, ArrowLeft } from "lucide-react";

export default function AiBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated" && Boolean(session?.user);

  return (
    <div className="fixed bottom-8 end-8 z-[110]" dir="rtl">
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "סגור עוזר AI" : "פתח עוזר AI"}
        className="bg-slate-950 text-white p-5 rounded-full shadow-2xl shadow-slate-950/30 relative group overflow-hidden"
      >
        <span className="relative z-10 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="x"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <X size={28} />
              </motion.span>
            ) : (
              <motion.span
                key="brain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Brain size={28} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none z-0" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 end-0 w-[min(420px,calc(100vw-2rem))] bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 font-sans"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Brain className="text-blue-500" size={24} />
              </div>
              <div>
                <h4 className="font-black text-xl italic text-slate-950">עוזר AI פיננסי - BSD</h4>
                <p className="text-slate-400 text-xs">שאלות, סריקות וצ׳אט — במרכז AI בדשבורד</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 border border-slate-100 flex items-start gap-3">
                <BookOpen size={24} className="text-blue-400 shrink-0" />
                <span>
                  איך אני יכול לעזור? למשל: &quot;איך סורקים חשבונית?&quot; או שאלות על המנוי — הכי מלא זה
                  במרכז ה-AI אחרי התחברות.
                </span>
              </div>
            </div>

            {loggedIn ? (
              <Link
                href="/dashboard/ai"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/25 hover:opacity-95 transition-opacity"
              >
                <ArrowLeft size={20} />
                פתיחת מרכז AI
              </Link>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-colors"
                >
                  התחברות לשיחה מלאה
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm font-bold text-blue-600 hover:underline"
                >
                  אין חשבון? הרשמה
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
