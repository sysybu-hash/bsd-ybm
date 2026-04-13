"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  AudioLines,
  BrainCircuit,
  Loader2,
  Mic,
  MicOff,
  Play,
  ScanSearch,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
} from "lucide-react";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import { appNavItems } from "@/components/app-shell/app-nav";
import type { IndustryProfile } from "@/lib/professions/runtime";

const MultiEngineScanner = dynamic(() => import("@/components/MultiEngineScanner"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-[color:var(--v2-line)] bg-white/80">
      <div className="flex items-center gap-3 text-sm font-black text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        טוען את לוח הסריקה המתקדם...
      </div>
    </div>
  ),
});

type DockPanel = "accessibility" | "assistant" | "voice" | "scanner" | null;
type AssistantSource = "system" | "text" | "voice";
type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source: AssistantSource;
};

type WorkspaceUtilityDockProps = {
  orgId?: string | null;
  industryProfile: IndustryProfile;
  userName: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

function createMessage(
  role: AssistantMessage["role"],
  content: string,
  source: AssistantSource,
): AssistantMessage {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id: `${role}-${random}`,
    role,
    content,
    source,
  };
}

function isRouteActive(pathname: string, href: string) {
  const current = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  if (target === "/app") return current === "/app";
  return current === target || current.startsWith(`${target}/`);
}

function resolveSectionMeta(pathname: string, industryProfile: IndustryProfile) {
  const current = appNavItems.find((item) => isRouteActive(pathname, item.href)) ?? appNavItems[0];

  if (current.href === "/app/clients") {
    return {
      ...current,
      label: industryProfile.clientsLabel,
      summary: `ניהול ${industryProfile.clientsLabel.toLowerCase()} וחיבור ישיר אל ${industryProfile.documentsLabel.toLowerCase()}.`,
    };
  }

  if (current.href === "/app/documents") {
    return {
      ...current,
      label: industryProfile.documentsLabel,
      summary: `סריקה, בקרה והפקה של ${industryProfile.recordsLabel.toLowerCase()} עבור ${industryProfile.industryLabel}.`,
    };
  }

  return current;
}

function buildWelcomeMessage(userName: string, industryProfile: IndustryProfile, sectionLabel: string) {
  return `שלום ${userName.split(" ")[0] || "לך"}, אני שכבת ה-AI החדשה של BSD-YBM. כרגע אנחנו ב-${sectionLabel}, עם התאמה ל-${industryProfile.industryLabel}. אני יכול לעזור לך בניתוח ${industryProfile.documentsLabel.toLowerCase()}, ניסוח משימות, תשובות קוליות והפעלה מהירה של לוח הסריקה.`;
}

function DockButton({
  active,
  icon: Icon,
  label,
  onClick,
  pulse = false,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
        active
          ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent)] text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.55)]"
          : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
      }`}
      aria-label={label}
      title={label}
    >
      {pulse ? (
        <span className="absolute inset-0 rounded-2xl border border-[color:var(--v2-accent)] animate-ping" />
      ) : null}
      <Icon className="h-5 w-5 transition group-hover:scale-110" aria-hidden />
    </button>
  );
}

export default function WorkspaceUtilityDock({
  orgId,
  industryProfile,
  userName,
}: WorkspaceUtilityDockProps) {
  const pathname = usePathname() ?? "/app";
  const currentSection = useMemo(
    () => resolveSectionMeta(pathname, industryProfile),
    [industryProfile, pathname],
  );
  const welcomeMessage = useMemo(
    () => buildWelcomeMessage(userName, industryProfile, currentSection.label),
    [currentSection.label, industryProfile, userName],
  );
  const quickPrompts = useMemo(() => {
    const professionTemplate = industryProfile.templates[0]?.label;

    switch (currentSection.href) {
      case "/app/inbox":
        return [
          "סכם לי מה דחוף לטיפול היום.",
          "בנה לי סדר עבודה ל-30 הדקות הקרובות.",
          "איפה יש צוואר בקבוק בתיבת העבודה?",
        ];
      case "/app/clients":
        return [
          `מי מתוך ${industryProfile.clientsLabel} דורש מעקב מיידי?`,
          "נסח לי הודעת המשך ללקוח שלא ענה.",
          "איזה לקוחות תקועים בלי מסמך סופי?",
        ];
      case "/app/documents":
        return [
          `איזה ${industryProfile.recordsLabel} הכי חשוב לסרוק עכשיו?`,
          professionTemplate ? `הכן לי מסגרת ל-${professionTemplate}.` : "איזה מסמך כדאי להפיק עכשיו?",
          "בדוק לי אילו מסמכים חסרים תיוק.",
        ];
      case "/app/billing":
        return [
          "איזה תשלומים נמצאים בסיכון השבוע?",
          "איפה יש מסמכים פתוחים בלי גבייה?",
          "תן לי תמונת תזרים קצרה.",
        ];
      case "/app/operations":
        return [
          "איפה יש עומס תפעולי כרגע?",
          "איזו משימה כדאי לאוטומט קודם?",
          "תן לי מצב קצר על קצב הביצוע.",
        ];
      case "/app/settings":
        return [
          "מה כדאי להגדיר מחדש למקצוע שלי?",
          "בדוק אם התפריטים שלי מתאימים למקצוע.",
          "איך לחזק את שכבת ה-AI עבור הצוות?",
        ];
      default:
        return [
          "תן לי תמונת מצב קצרה על העסק.",
          `מה כדאי לשפר במסך ${currentSection.label}?`,
          "הכן לי תוכנית עבודה ליום הזה.",
        ];
    }
  }, [currentSection.href, currentSection.label, industryProfile]);

  const [openPanel, setOpenPanel] = useState<DockPanel>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    createMessage("assistant", welcomeMessage, "system"),
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [autoSendVoice, setAutoSendVoice] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [lastAssistantReply, setLastAssistantReply] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.source === "system") {
        return [createMessage("assistant", welcomeMessage, "system")];
      }
      return current;
    });
  }, [welcomeMessage]);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  }, []);

  const speakMessage = useCallback(
    (text: string, messageId: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      if (speakingMessageId === messageId) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = document.documentElement.lang === "he" ? "he-IL" : "en-US";
      utterance.onend = () => setSpeakingMessageId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingMessageId(messageId);
    },
    [speakingMessageId],
  );

  const sendAssistantMessage = useCallback(
    async (rawMessage: string, source: Extract<AssistantSource, "text" | "voice"> = "text") => {
      const trimmed = rawMessage.trim();
      if (!trimmed || sending) return;

      const userMessage = createMessage("user", trimmed, source);
      setMessages((current) => [...current, userMessage]);
      setSending(true);

      try {
        let reply = "";

        if (orgId) {
          const contextualMessage = [
            `מסך נוכחי: ${currentSection.label}.`,
            `תיאור קצר: ${currentSection.summary}`,
            `מקצוע: ${industryProfile.industryLabel}.`,
            `מונחים עיקריים: ${industryProfile.clientsLabel}, ${industryProfile.documentsLabel}, ${industryProfile.recordsLabel}.`,
            `תבניות מקצועיות: ${industryProfile.templates.map((template) => template.label).slice(0, 5).join(", ")}.`,
            `בקשת משתמש: ${trimmed}`,
          ].join(" ");

          const response = await fetch("/api/ai-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orgId,
              message: contextualMessage,
            }),
          });
          const data = (await response.json()) as { answer?: string; error?: string };

          if (!response.ok) {
            throw new Error(data.error ?? "שכבת ה-AI לא הצליחה להשיב כרגע.");
          }

          reply = data.answer?.trim() || "לא התקבלה תשובה שימושית מה-AI.";
        } else {
          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                {
                  role: "user",
                  content: `אני במסך ${currentSection.label}. המקצוע שלי הוא ${industryProfile.industryLabel}. ${trimmed}`,
                },
              ],
            }),
          });
          const data = (await response.json()) as { text?: string; error?: string };

          if (!response.ok) {
            throw new Error(data.error ?? "שכבת ה-AI לא הצליחה להשיב כרגע.");
          }

          reply = data.text?.trim() || "לא התקבלה תשובה שימושית מה-AI.";
        }

        const assistantMessage = createMessage("assistant", reply, source);
        setMessages((current) => [...current, assistantMessage]);
        setLastAssistantReply(reply);

        if (autoSpeak && source === "voice") {
          speakMessage(reply, assistantMessage.id);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "אירעה שגיאה בשכבת ה-AI.";
        setMessages((current) => [...current, createMessage("assistant", message, source)]);
        setLastAssistantReply(message);
      } finally {
        setSending(false);
      }
    },
    [
      autoSpeak,
      currentSection.label,
      currentSection.summary,
      industryProfile,
      orgId,
      sending,
      speakMessage,
    ],
  );

  useEffect(() => {
    const browserWindow = window as SpeechWindow;
    const RecognitionCtor =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang === "he" ? "he-IL" : "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      setVoiceDraft(transcript);

      const hasFinalResult = Array.from(event.results).some((result) => result.isFinal);
      if (hasFinalResult && autoSendVoice && transcript) {
        void sendAssistantMessage(transcript, "voice");
        setVoiceDraft("");
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [autoSendVoice, sendAssistantMessage]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, openPanel, sending]);

  useEffect(() => {
    if (!openPanel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPanel]);

  useEffect(() => {
    if (openPanel !== "voice" && isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [isListening, openPanel]);

  const toggleVoiceCapture = useCallback(() => {
    if (!voiceSupported) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } finally {
        setIsListening(false);
      }
      return;
    }

    try {
      recognitionRef.current?.start();
      setVoiceDraft("");
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [isListening, voiceSupported]);

  const submitInput = useCallback(() => {
    const draft = input.trim();
    if (!draft) return;
    setInput("");
    void sendAssistantMessage(draft, "text");
  }, [input, sendAssistantMessage]);

  const submitVoiceDraft = useCallback(() => {
    const draft = voiceDraft.trim();
    if (!draft) return;
    setVoiceDraft("");
    void sendAssistantMessage(draft, "voice");
  }, [sendAssistantMessage, voiceDraft]);

  const scannerButtonDisabled = !orgId;
  const messageCount = messages.filter((message) => message.role === "assistant").length;

  const compactPanelClassName =
    "fixed bottom-24 left-4 z-[255] w-[min(100vw-2rem,26rem)] rounded-[30px] border border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/98 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.55)] backdrop-blur-xl lg:bottom-6 lg:left-24";

  const desktopDock = (
    <div className="fixed bottom-6 left-6 z-[260] hidden flex-col gap-3 lg:flex">
      <div className="rounded-[28px] border border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/96 p-2 shadow-[0_28px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="flex flex-col gap-2">
          <DockButton
            active={openPanel === "accessibility"}
            icon={Accessibility}
            label="סרגל גישות"
            onClick={() => setOpenPanel((current) => (current === "accessibility" ? null : "accessibility"))}
          />
          <DockButton
            active={openPanel === "assistant"}
            icon={Sparkles}
            label="עוזר AI"
            onClick={() => setOpenPanel((current) => (current === "assistant" ? null : "assistant"))}
            pulse={messageCount <= 1}
          />
          <DockButton
            active={openPanel === "voice"}
            icon={isListening ? MicOff : Mic}
            label="פקודות קוליות"
            onClick={() => setOpenPanel((current) => (current === "voice" ? null : "voice"))}
          />
          <DockButton
            active={openPanel === "scanner"}
            icon={ScanSearch}
            label="לוח סריקה מתקדם"
            onClick={() => setOpenPanel((current) => (current === "scanner" ? null : "scanner"))}
          />
        </div>
      </div>
    </div>
  );

  const mobileDock = (
    <div className="fixed inset-x-3 bottom-3 z-[260] lg:hidden">
      <div className="grid grid-cols-4 gap-2 rounded-[28px] border border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/96 p-2 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        <DockButton
          active={openPanel === "accessibility"}
          icon={Accessibility}
          label="סרגל גישות"
          onClick={() => setOpenPanel((current) => (current === "accessibility" ? null : "accessibility"))}
        />
        <DockButton
          active={openPanel === "assistant"}
          icon={Sparkles}
          label="עוזר AI"
          onClick={() => setOpenPanel((current) => (current === "assistant" ? null : "assistant"))}
        />
        <DockButton
          active={openPanel === "voice"}
          icon={isListening ? MicOff : Mic}
          label="פקודות קוליות"
          onClick={() => setOpenPanel((current) => (current === "voice" ? null : "voice"))}
        />
        <DockButton
          active={openPanel === "scanner"}
          icon={ScanSearch}
          label="לוח סריקה מתקדם"
          onClick={() => setOpenPanel((current) => (current === "scanner" ? null : "scanner"))}
        />
      </div>
    </div>
  );

  return (
    <>
      {desktopDock}
      {mobileDock}

      {openPanel && openPanel !== "scanner" ? (
        <div className="fixed inset-0 z-[250] bg-slate-950/20 backdrop-blur-[2px]" onClick={() => setOpenPanel(null)} />
      ) : null}

      {openPanel === "accessibility" ? (
        <div className={compactPanelClassName}>
          <AccessibilityMenu panelOnly onClose={() => setOpenPanel(null)} />
        </div>
      ) : null}

      {openPanel === "assistant" ? (
        <section className={compactPanelClassName} dir="rtl" aria-label="עוזר AI">
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--v2-line)] px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <BrainCircuit className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">בועת AI חדשה</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    מחוברת ל-{currentSection.label} ול-{industryProfile.industryLabel}.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenPanel(null)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="סגירת עוזר AI"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                הקשר נוכחי
              </p>
              <p className="mt-2 text-sm font-black text-slate-900">{currentSection.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{currentSection.summary}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput("");
                    void sendAssistantMessage(prompt, "text");
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-[color:var(--v2-accent)] hover:text-[color:var(--v2-accent)]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div
              ref={messagesRef}
              className="max-h-[min(45vh,22rem)] space-y-3 overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-[color:var(--v2-accent)] text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.role === "assistant" ? (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => speakMessage(message.content, message.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          {speakingMessageId === message.id ? (
                            <VolumeX className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {speakingMessageId === message.id ? "עצור" : "הקרא"}
                        </button>
                        {message.source === "voice" ? (
                          <span className="rounded-full bg-[color:var(--v2-accent-soft)] px-2 py-1 text-[11px] font-black text-[color:var(--v2-accent)]">
                            תגובת קול
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {sending ? (
                <div className="flex justify-end">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ה-AI עובד על תשובה...
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-3">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenPanel("voice")}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                  aria-label="מעבר לפקודות קוליות"
                >
                  <Mic className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setOpenPanel("scanner")}
                  disabled={scannerButtonDisabled}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="פתיחת לוח הסריקה"
                >
                  <ScanSearch className="h-4 w-4" aria-hidden />
                </button>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">הודעה לעוזר ה-AI</span>
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    rows={3}
                    placeholder="כתוב כאן מה צריך: ניתוח, ניסוח, תשובה, סדר עבודה או פתיחת תהליך..."
                    className="min-h-[84px] w-full resize-none rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--v2-accent)] focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500">
                  מבוסס על מסך נוכחי, מקצוע ונתוני הארגון שלך.
                </p>
                <button
                  type="button"
                  onClick={submitInput}
                  disabled={sending || input.trim().length === 0}
                  className="v2-button v2-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <WandSparkles className="h-4 w-4" aria-hidden />
                  שלח ל-AI
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {openPanel === "voice" ? (
        <section className={compactPanelClassName} dir="rtl" aria-label="חוויית דיבור מלאה">
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--v2-line)] px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <AudioLines className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">חוויית דיבור מלאה</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    הקלטה, תמלול, שליחה ל-AI והקראת תשובות חזרה.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenPanel(null)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="סגירת חוויית הדיבור"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {voiceSupported ? "המיקרופון מוכן לעבודה" : "הדפדפן לא תומך בתמלול קולי"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {voiceSupported
                      ? "השתמש בהקלטה חיה, ערוך את התמלול, ושלח ישירות ל-AI."
                      : "אפשר עדיין להדביק טקסט ידנית ולהשתמש בהקראת תשובות."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleVoiceCapture}
                  disabled={!voiceSupported}
                  className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-xl transition ${
                    isListening
                      ? "bg-rose-500 shadow-rose-500/30"
                      : "bg-[color:var(--v2-accent)] shadow-[0_20px_40px_-18px_rgba(193,89,47,0.48)]"
                  } disabled:cursor-not-allowed disabled:bg-slate-300`}
                  aria-label={isListening ? "עצירת הקלטה" : "התחלת הקלטה"}
                >
                  {isListening ? <Square className="h-5 w-5" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAutoSendVoice((current) => !current)}
                  className={`rounded-2xl border px-3 py-3 text-right transition ${
                    autoSendVoice
                      ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="block text-sm font-black">שליחה אוטומטית</span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    כשמסתיים תמלול, הוא נשלח מיד ל-AI.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (speakingMessageId) {
                      stopSpeaking();
                      return;
                    }
                    if (lastAssistantReply) {
                      speakMessage(lastAssistantReply, "last-reply");
                    }
                  }}
                  className={`rounded-2xl border px-3 py-3 text-right transition ${
                    autoSpeak
                      ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="block text-sm font-black">הקראת תשובות</span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    קרא בקול את התשובה האחרונה או עצור הקראה.
                  </span>
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(event) => setAutoSpeak(event.target.checked)}
                    className="rounded border-slate-300 text-[color:var(--v2-accent)] focus:ring-[color:var(--v2-accent)]"
                  />
                  הפעל הקראת תשובות אוטומטית כשפקודת קול נשלחת.
                </label>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">תמלול חי</p>
                  <p className="mt-1 text-xs text-slate-500">
                    אפשר לערוך את הטקסט לפני שליחה.
                  </p>
                </div>
                {isListening ? (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                    מקליט עכשיו
                  </span>
                ) : null}
              </div>

              <textarea
                value={voiceDraft}
                onChange={(event) => setVoiceDraft(event.target.value)}
                rows={5}
                placeholder="הקלטה תופיע כאן... למשל: פתח את המסמכים שלי, בדוק מה דחוף בטיפול, או הכן לי אישור מקצועי."
                className="mt-4 min-h-[140px] w-full resize-none rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--v2-accent)] focus:bg-white"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={`voice-${prompt}`}
                    type="button"
                    onClick={() => setVoiceDraft(prompt)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-[color:var(--v2-accent)] hover:text-[color:var(--v2-accent)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setVoiceDraft("")}
                  className="v2-button v2-button-secondary"
                >
                  נקה
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenPanel("assistant")}
                    className="v2-button v2-button-secondary"
                  >
                    עבור לבועת AI
                  </button>
                  <button
                    type="button"
                    onClick={submitVoiceDraft}
                    disabled={sending || voiceDraft.trim().length === 0}
                    className="v2-button v2-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" aria-hidden />
                    שלח כפקודת קול
                  </button>
                </div>
              </div>
            </div>

            {lastAssistantReply ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">תשובה אחרונה של ה-AI</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{lastAssistantReply}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speakingMessageId === "last-reply"
                        ? stopSpeaking()
                        : speakMessage(lastAssistantReply, "last-reply")
                    }
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    aria-label="הקראת תשובה אחרונה"
                  >
                    {speakingMessageId === "last-reply" ? (
                      <VolumeX className="h-4 w-4" aria-hidden />
                    ) : (
                      <Volume2 className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {openPanel === "scanner" ? (
        <section
          className="fixed inset-0 z-[270] bg-slate-950/35 p-3 backdrop-blur-sm sm:p-5"
          dir="rtl"
          aria-label="לוח סריקה מתקדם"
        >
          <div className="flex h-full flex-col rounded-[32px] border border-white/40 bg-[color:var(--v2-surface)]/98 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.7)]">
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--v2-line)] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                    <ScanSearch className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">לוח סריקה מתקדם</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      מסונכרן עם {industryProfile.industryLabel}, זמין מכל `/app`, וממשיך ישר למסמכים ולגבייה.
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[color:var(--v2-accent-soft)] px-3 py-1 text-xs font-black text-[color:var(--v2-accent)]">
                    {industryProfile.documentsLabel}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {currentSection.label}
                  </span>
                  {industryProfile.templates.slice(0, 2).map((template) => (
                    <span
                      key={template.id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
                    >
                      {template.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/app/documents"
                  onClick={() => setOpenPanel(null)}
                  className="v2-button v2-button-secondary"
                >
                  למסמכים
                </Link>
                <button
                  type="button"
                  onClick={() => setOpenPanel(null)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="סגירת לוח הסריקה"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4 sm:py-4">
              {scannerButtonDisabled ? (
                <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-8 text-center">
                  <div className="max-w-md">
                    <p className="text-lg font-black text-slate-900">לוח הסריקה זמין אחרי חיבור לארגון</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      צריך מזהה ארגון פעיל כדי לחבר את הסריקה ל-AI, למסמכים ולהפקה.
                    </p>
                  </div>
                </div>
              ) : (
                <MultiEngineScanner industry={industryProfile.id} compactHeader />
              )}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
