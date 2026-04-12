"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Brain,
  Bot,
  X,
  Send,
  Sparkles,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [fQuery, setFQuery] = useState("");
  const [fAnswer, setFAnswer] = useState("");
  const [fLoading, setFLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated" && Boolean(session?.user);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
          recognitionRef.current.lang = locale === "he" ? "he-IL" : "en-US";
          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            if (tab === "chat") setInput(transcript);
            else setFQuery(transcript);
            setIsListening(false);
          };
          recognitionRef.current.onerror = () => setIsListening(false);
          recognitionRef.current.onend = () => setIsListening(false);
        }
      }
    }
  }, [locale, tab]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string, index: number) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (isSpeaking === index) {
        window.speechSynthesis.cancel();
        setIsSpeaking(null);
      } else {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = locale === "he" ? "he-IL" : "en-US";
        ut.onend = () => setIsSpeaking(null);
        window.speechSynthesis.speak(ut);
        setIsSpeaking(index);
      }
    }
  };

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
    if (userMsg === "" || sending) return;
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
          : (data.error ?? "שגיאת תקשורת");
      setMessages((p) => [...p, { role: "ai", content: reply }]);
    } catch {
      setMessages((p) => [...p, { role: "ai", content: "שגיאת רשת" }]);
    } finally {
      setSending(false);
    }
  };

  const title = useMemo(
    () => (tab === "chat" ? t("aiBubble.title") : t("dashboard.finance")),
    [tab, t],
  );

  return (
    <div className="relative" dir={dir}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative group/aibtn flex h-14 w-14 items-center justify-center rounded-[1.5rem] transition-all duration-500 shadow-xl overflow-hidden ${
           open ? "bg-[var(--primary-brand,#4f46e5)] text-white scale-110 ring-4 ring-[var(--primary-brand)]/20 shadow-[0_0_30px_var(--primary-brand)]" : "bg-white/50 text-slate-500 hover:bg-white hover:text-[var(--primary-brand)] hover:shadow-2xl hover:scale-105"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-brand)]/20 to-transparent pointer-events-none opacity-0 group-hover/aibtn:opacity-100 transition-opacity" />
        {open ? <X size={24} /> : <Brain size={24} className="group-hover/aibtn:rotate-12 transition-transform" />}
      </button>

      {open && (
        <div className="absolute top-0 left-16 w-80 z-[220] animate-in fade-in slide-in-from-left-6 duration-500">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-black text-gray-900">
                <Sparkles size={14} className="text-indigo-500" />
                <span>{title}</span>
              </div>
              <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-0.5 shadow-sm">
                <button
                  onClick={() => setTab("chat")}
                  className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                    tab === "chat" ? "bg-[var(--primary-brand,#4f46e5)] text-white" : "text-gray-400"
                  }`}
                >
                  CHAT
                </button>
                <button
                  onClick={() => setTab("finance")}
                  className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                    tab === "finance" ? "bg-[var(--primary-brand,#4f46e5)] text-white" : "text-gray-400"
                  }`}
                >
                  FINANCE
                </button>
              </div>
            </div>

            {tab === "chat" ? (
              <>
                <div
                  ref={scrollRef}
                  className="h-64 space-y-4 overflow-y-auto bg-gray-50/50 p-4 text-sm"
                >
                  {messages.map((m, i) => (
                    <div
                      key={`msg-${i}`}
                      className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] relative ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-200 bg-white text-slate-700"
                        }`}
                      >
                        {m.content}
                        {m.role === "ai" && (
                          <button 
                            onClick={() => speak(m.content, i)}
                            className="ml-2 text-slate-400"
                          >
                            {isSpeaking === i ? <VolumeX size={12} /> : <Volume2 size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {sending && <div className="text-[10px] text-slate-400 animate-pulse">מהרהר...</div>}
                </div>
                <div className="flex gap-2 border-t border-gray-200 bg-white p-2">
                  <button
                    onClick={toggleListening}
                    className={`p-2 rounded-xl ${isListening ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="..."
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[11px] outline-none"
                  />
                  <button
                    onClick={() => sendChat()}
                    disabled={sending || !input.trim()}
                    className="p-2 rounded-xl bg-[var(--primary-brand,#4f46e5)] text-white disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 bg-white min-h-[160px]">
                <div className="text-xs text-gray-600 whitespace-pre-wrap">
                  {fAnswer || "שאל שאלה פיננסית..."}
                  {fLoading && <Loader2 className="animate-spin text-indigo-400" size={14} />}
                </div>
                <div className="flex gap-2 mt-4">
                  <input
                    value={fQuery}
                    onChange={(e) => setFQuery(e.target.value)}
                    className="flex-1 border rounded-xl px-3 py-2 text-[11px]"
                    placeholder="שאל את ה-AI..."
                  />
                  <button
                    onClick={askFinance}
                    className="bg-[var(--primary-brand,#4f46e5)] text-white px-3 py-2 rounded-xl text-[11px]"
                  >
                    שלח
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
