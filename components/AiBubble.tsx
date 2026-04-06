"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Shield,
  BarChart3,
  Info,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type Role = "user" | "ai";

type ChatMessage = { role: Role; content: string };

export default function AiBubble() {
  const { t, dir, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", content: t("aiBubble.initialGreeting") },
  ]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated" && Boolean(session?.user);

  const primary = "var(--primary-color, #2563eb)";

  useEffect(() => {
    setMessages([{ role: "ai", content: t("aiBubble.initialGreeting") }]);
  }, [locale, t]);

  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isOpen, sending]);

  const quickActions = useMemo(
    () => [
      { label: t("aiBubble.qPersonalCompany"), icon: <Shield size={14} aria-hidden /> },
      { label: t("aiBubble.qErpSaves"), icon: <BarChart3 size={14} aria-hidden /> },
      { label: t("aiBubble.qRegister"), icon: <Info size={14} aria-hidden /> },
    ],
    [t],
  );

  const sendMessage = async (text: string) => {
    const userMsg = (text || input).trim();
    if (!userMsg || sending) return;

    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(nextMessages);
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      const reply =
        typeof data.text === "string" && data.text.length > 0
          ? data.text
          : data.error ?? t("aiBubble.errorGeneric");
      setMessages((prev) => [...prev, { role: "ai", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: t("aiBubble.errorNetwork") }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] end-4 z-[120] sm:bottom-8 sm:end-8"
      dir={dir}
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? t("aiBubble.ariaClose") : t("aiBubble.ariaOpen")}
        className="relative overflow-hidden rounded-full p-5 text-white shadow-lg shadow-indigo-900/20"
        style={{ backgroundColor: primary }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span key="x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <X size={28} aria-hidden />
            </motion.span>
          ) : (
            <motion.span key="brain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Brain size={28} aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-[4.75rem] end-0 flex h-[min(520px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-200/60"
            dir={dir}
          >
            <div
              className="p-5 text-white flex items-center justify-between gap-3 shrink-0"
              style={{ background: `linear-gradient(90deg, ${primary}, #4f46e5)` }}
            >
              <div className="flex items-center gap-3 font-black italic min-w-0">
                <span className="bg-white/20 p-2 rounded-xl shrink-0">
                  <Sparkles size={20} aria-hidden />
                </span>
                <span className="truncate">{t("aiBubble.title")}</span>
              </div>
              <ShieldCheck size={18} className="opacity-80 shrink-0" aria-hidden />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-white/[0.03]/80">
              {messages.map((m, i) => (
                <div
                  key={`${i}-${m.content.slice(0, 12)}`}
                  className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm font-medium leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-md shadow-sm"
                        : "bg-white text-gray-700 rounded-bl-md border border-gray-200 shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending ? (
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold px-3 py-2">
                    <Loader2 className="animate-spin" size={16} aria-hidden />
                    {t("aiBubble.writing")}
                  </div>
                </div>
              ) : null}
            </div>

            {loggedIn ? (
              <div className="px-4 pb-2 shrink-0 bg-white border-t border-gray-100">
                <Link
                  href="/dashboard/ai"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-xs font-bold text-indigo-400 hover:text-indigo-800 transition-colors py-1"
                >
                  {t("aiBubble.centerLink")}
                </Link>
              </div>
            ) : null}

            <div className="p-3 flex gap-2 overflow-x-auto border-t border-gray-200 shrink-0 bg-white">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={sending}
                  onClick={() => sendMessage(action.label)}
                  className="whitespace-nowrap bg-white/[0.03] hover:bg-gray-50 disabled:opacity-50 text-gray-600 text-xs px-3 py-2 rounded-full border border-gray-200 flex items-center gap-2 transition-all shrink-0"
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>

            <div className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void sendMessage("");
                  }
                }}
                disabled={sending}
                placeholder={t("aiBubble.placeholder")}
                className="flex-1 bg-white/[0.03] border border-gray-200 rounded-xl text-white placeholder:text-gray-400 outline-none text-sm px-3 py-2 disabled:opacity-60"
                aria-label={t("aiBubble.ariaMessage")}
              />
              <button
                type="button"
                disabled={sending}
                onClick={() => void sendMessage("")}
                className="p-2.5 rounded-xl text-white shrink-0 disabled:opacity-50 transition-transform hover:scale-105 shadow-md"
                style={{ backgroundColor: primary }}
                aria-label={t("aiBubble.ariaSend")}
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} aria-hidden />}
              </button>
            </div>

            {!loggedIn ? (
              <div className="flex gap-2 px-3 pb-3 pt-0 shrink-0 bg-white">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center text-xs font-black py-2.5 rounded-xl border border-gray-200 bg-white/[0.03] text-gray-700 hover:bg-gray-50"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center text-xs font-black py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {t("aiBubble.trial30")}
                </Link>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
