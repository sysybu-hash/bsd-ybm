"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Bot,
  X,
  Send,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type Tab = "chat" | "finance";
type Role = "user" | "ai";
type ChatMessage = { role: Role; content: string };

type Props = { orgId: string };

export default function DashboardUnifiedAi({ orgId }: Props) {
  const { t, dir, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", content: t("aiBubble.initialGreeting") },
  ]);
  const [sending, setSending] = useState(false);
  const [fQuery, setFQuery] = useState("");
  const [fAnswer, setFAnswer] = useState("");
  const [fLoading, setFLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated" && Boolean(session?.user);

  const primary = "var(--primary-color, #2563eb)";

  useEffect(() => {
    setMessages([{ role: "ai", content: t("aiBubble.initialGreeting") }]);
  }, [locale, t]);

  useEffect(() => {
    if (!open || tab !== "chat") return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, tab, sending]);

  const askFinance = async () => {
    if (!fQuery.trim()) return;
    setFLoading(true);
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fQuery, orgId }),
      });
      const data = (await res.json()) as { answer?: string };
      setFAnswer(data.answer ?? "לא התקבלה תשובה מה-AI.");
    } catch {
      setFAnswer("מצטער, חלה שגיאה בגישה לנתונים.");
    } finally {
      setFLoading(false);
    }
  };

  const sendChat = async () => {
    const userMsg = input.trim();
    if (!userMsg || sending) return;
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(next);
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({
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
      setMessages((p) => [...p, { role: "ai", content: reply }]);
    } catch {
      setMessages((p) => [...p, { role: "ai", content: t("aiBubble.errorNetwork") }]);
    } finally {
      setSending(false);
    }
  };

  const title = useMemo(
    () => (tab === "chat" ? t("aiBubble.title") : "עוזר פיננסי"),
    [tab, t],
  );

  return (
    <div className="relative z-[2]" dir={dir}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("aiBubble.ariaClose") : "פתח עוזר AI"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-600 text-white shadow-xl shadow-indigo-600/35 ring-2 ring-white/90"
      >
        {open ? <X size={26} aria-hidden /> : <Brain size={26} aria-hidden />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="absolute bottom-[calc(100%+0.75rem)] start-1/2 z-[220] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2"
          >
            <div
              className={`overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-2xl ${
                tab === "chat" ? "" : ""
              }`}
            >
              <div
                className="flex items-center justify-between gap-2 px-3 py-2 text-white"
                style={{
                  background: `linear-gradient(90deg, ${primary}, #4f46e5)`,
                }}
              >
                <div className="flex min-w-0 items-center gap-2 text-xs font-black">
                  <Sparkles size={16} className="shrink-0 opacity-90" aria-hidden />
                  <span className="truncate">{title}</span>
                </div>
                <div className="flex shrink-0 gap-1 rounded-xl bg-white/20 p-0.5">
                  <button
                    type="button"
                    onClick={() => setTab("chat")}
                    className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${
                      tab === "chat" ? "bg-white text-gray-900" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    צ׳אט
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("finance")}
                    className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${
                      tab === "finance" ? "bg-white text-gray-900" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    כספים
                  </button>
                </div>
              </div>

              {tab === "chat" ? (
                <>
                  <div
                    ref={scrollRef}
                    className="h-56 space-y-2 overflow-y-auto bg-gray-50 p-3 text-sm"
                  >
                    {messages.map((m, i) => (
                      <div
                        key={`${i}-${m.content.slice(0, 8)}`}
                        className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs font-medium leading-relaxed ${
                            m.role === "user"
                              ? "rounded-br-sm bg-indigo-600 text-white"
                              : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {sending ? (
                      <div className="flex justify-end text-xs text-gray-400">
                        <Loader2 className="animate-spin" size={14} />
                      </div>
                    ) : null}
                  </div>
                  {loggedIn ? (
                    <div className="border-t border-gray-100 px-2 py-1 text-center">
                      <Link
                        href="/dashboard/ai"
                        onClick={() => setOpen(false)}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        {t("aiBubble.centerLink")}
                      </Link>
                    </div>
                  ) : null}
                  <div className="flex gap-2 border-t border-gray-200 bg-white p-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void sendChat();
                        }
                      }}
                      disabled={sending}
                      placeholder={t("aiBubble.placeholder")}
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-900 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void sendChat()}
                      className="rounded-xl bg-indigo-600 p-2 text-white disabled:opacity-50"
                      aria-label={t("aiBubble.ariaSend")}
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-white">
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-indigo-50/50 px-3 py-2 text-xs font-bold text-indigo-900">
                    <Bot size={14} aria-hidden />
                    שאלות על הוצאות, הכנסות ומסמכים
                  </div>
                  <div className="h-44 overflow-y-auto p-3 text-xs text-gray-700">
                    {fAnswer ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{fAnswer}</p>
                    ) : (
                      <p className="italic text-gray-500">
                        לדוגמה: &quot;כמה הוצאנו החודש על חשמל?&quot;
                      </p>
                    )}
                    {fLoading ? (
                      <Loader2 className="mt-2 animate-spin text-indigo-600" size={18} />
                    ) : null}
                  </div>
                  <div className="flex gap-2 border-t border-gray-200 p-2">
                    <input
                      value={fQuery}
                      onChange={(e) => setFQuery(e.target.value)}
                      placeholder="שאל את ה-AI..."
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      disabled={fLoading}
                      onClick={() => void askFinance()}
                      className="rounded-xl bg-indigo-600 px-3 py-2 text-white disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
