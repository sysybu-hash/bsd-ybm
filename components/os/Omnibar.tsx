"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  animate,
  useReducedMotion,
} from "framer-motion";
import { Mic, Send, Sparkles, Square, Waves } from "lucide-react";

const VOICE_VISUALIZER_KEYS = Array.from({ length: 18 }, (_, index) => `singularity-omnibar-voice-viz-${index}`);

export type OmnibarProps = Readonly<{
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  voiceActive: boolean;
  onVoiceToggle: () => void;
  /** מצב עיבוד — מציג הילה ופעימה עדינה */
  busy?: boolean;
  placeholder?: string;
  /** טקסט עזר מתחת לשדה */
  footnote?: string;
}>;

/**
 * שורת פקודה צפה — ליבת אינטראקציה עם Singularity (טקסט + מצב קולי מדומה).
 */
export default function Omnibar({
  value,
  onChange,
  onSubmit,
  voiceActive,
  onVoiceToggle,
  busy = false,
  placeholder = "תאר משימה, ישות או פקודה — Singularity יבנה את הממשק בזמן אמת…",
  footnote,
}: OmnibarProps) {
  const reduceMotion = useReducedMotion();
  const inputId = useId();
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const [focused, setFocused] = useState(false);

  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(38% 55% at ${mx}% ${my}%, rgba(56,189,248,0.35), transparent 62%)`;

  useEffect(() => {
    if (reduceMotion || !focused) return;
    const controls = animate(
      mx,
      [42, 58, 48, 52, 50],
      { duration: 10, repeat: Infinity, ease: "easeInOut" },
    );
    const controlsY = animate(
      my,
      [46, 54, 50, 48, 50],
      { duration: 11, repeat: Infinity, ease: "easeInOut" },
    );
    return () => {
      controls.stop();
      controlsY.stop();
    };
  }, [focused, mx, my, reduceMotion]);

  const resizeArea = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizeArea();
  }, [value, resizeArea]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && value.trim()) onSubmit();
    }
  };

  const expanded = focused || value.length > 0 || voiceActive;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[5000] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <motion.div
        layout
        initial={false}
        animate={{
          scale: expanded ? 1 : 0.985,
          y: expanded ? 0 : 2,
        }}
        transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.55 }}
        className="pointer-events-auto w-full max-w-3xl"
      >
        <div className="relative">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-[1.6rem] opacity-90 blur-2xl"
            animate={{
              opacity: busy ? [0.55, 0.85, 0.55] : focused ? 0.65 : 0.35,
              scale: busy ? [1, 1.02, 1] : 1,
            }}
            transition={{
              duration: busy ? 1.6 : 0.45,
              repeat: busy ? Infinity : 0,
              ease: "easeInOut",
            }}
            style={{
              background:
                "radial-gradient(55% 70% at 50% 0%, rgba(56,189,248,0.45), transparent 70%), radial-gradient(60% 60% at 90% 100%, rgba(168,85,247,0.35), transparent 65%)",
            }}
          />

          <motion.div
            layout
            className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.16] bg-zinc-950/55 shadow-[0_28px_100px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/[0.08]"
            animate={{
              boxShadow: focused
                ? "0 0 0 1px rgba(56,189,248,0.35), 0 28px 100px -40px rgba(0,0,0,0.95)"
                : "0 0 0 0px rgba(56,189,248,0), 0 28px 100px -40px rgba(0,0,0,0.95)",
            }}
            transition={{ duration: 0.28 }}
          >
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: spotlight, opacity: focused ? 1 : 0.45 }}
              transition={{ duration: 0.35 }}
            />
            <div className="pointer-events-none absolute inset-px rounded-[1.28rem] bg-gradient-to-b from-white/[0.08] to-transparent" />

            <div className="relative flex items-end gap-2 px-2.5 py-2.5 sm:px-3 sm:py-3">
              <motion.button
                type="button"
                layout
                onClick={onVoiceToggle}
                aria-pressed={voiceActive}
                aria-label={voiceActive ? "כבה מצב האזנה קולית" : "הפעל מצב האזנה קולית (הדגמה)"}
                className={[
                  "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition-colors sm:h-12 sm:w-12",
                  voiceActive
                    ? "bg-cyan-400/20 text-cyan-50 ring-cyan-300/40"
                    : "bg-white/[0.06] text-white/80 ring-white/10 hover:bg-white/10",
                ].join(" ")}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.03 }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {voiceActive ? (
                    <motion.span
                      key="live"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="relative flex h-8 w-8 items-center justify-center">
                        <motion.span
                          className="absolute inset-0 rounded-full bg-cyan-400/25"
                          animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <Waves className="relative h-5 w-5" aria-hidden />
                      </span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className="flex items-center justify-center"
                    >
                      <Mic className="h-5 w-5" aria-hidden />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1.5 px-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-200/80" aria-hidden />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Singularity · Omnibar
                  </span>
                </div>
                <label htmlFor={inputId} className="sr-only">
                  פקודה או שיחה
                </label>
                <textarea
                  id={inputId}
                  ref={areaRef}
                  dir="auto"
                  rows={1}
                  value={value}
                  disabled={busy}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={placeholder}
                  className={[
                    "max-h-40 min-h-[2.75rem] w-full resize-none rounded-2xl border border-white/[0.08]",
                    "bg-black/35 px-3 py-2.5 text-[15px] leading-relaxed text-white shadow-inner shadow-black/40",
                    "placeholder:text-white/35",
                    "outline-none transition-[box-shadow,border-color]",
                    "focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-400/25",
                  ].join(" ")}
                />
                {footnote ? (
                  <p className="mt-1.5 px-1 text-xs leading-snug text-white/45">{footnote}</p>
                ) : null}
              </div>

              <motion.button
                type="button"
                layout
                disabled={busy || !value.trim()}
                onClick={onSubmit}
                aria-label="שלח"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: value.trim() && !busy ? 1.04 : 1 }}
                className={[
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition sm:h-12 sm:w-12",
                  value.trim() && !busy
                    ? "bg-gradient-to-br from-cyan-400/90 to-sky-500/90 text-zinc-950 ring-cyan-200/40 shadow-lg shadow-cyan-500/20"
                    : "cursor-not-allowed bg-white/[0.06] text-white/35 ring-white/10",
                ].join(" ")}
              >
                {busy ? <Square className="h-4 w-4 fill-current opacity-80" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              </motion.button>
            </div>

            <AnimatePresence>
              {voiceActive ? (
                <motion.div
                  key="voice"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="border-t border-white/[0.08] bg-black/25"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex flex-1 items-end gap-0.5 overflow-hidden rounded-xl bg-white/[0.04] px-2 py-2 ring-1 ring-white/10">
                      {VOICE_VISUALIZER_KEYS.map((vid, i) => (
                        <motion.span
                          key={vid}
                          className="w-1 rounded-full bg-gradient-to-t from-cyan-500/20 to-cyan-200/90"
                          animate={{
                            height: [10, 22 + (i % 5) * 4, 12, 26, 10],
                            opacity: [0.35, 1, 0.5, 0.95, 0.35],
                          }}
                          transition={{
                            duration: 1.1 + i * 0.03,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.04,
                          }}
                        />
                      ))}
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="text-xs font-semibold text-cyan-100/90">מצב האזנה</p>
                      <p className="text-[11px] text-white/45">הדגמה — ללא העברת אודיו</p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
