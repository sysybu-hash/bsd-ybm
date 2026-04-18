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
import { useI18n } from "@/components/I18nProvider";
import { buildAppNavCollection, type AppRouteId } from "@/components/app-shell/app-nav";
import type { IndustryProfile } from "@/lib/professions/runtime";
import type { MessageTree } from "@/lib/i18n/keys";
import type { TFunction } from "@/lib/i18n/translate";

function readStringArray(messages: MessageTree, path: string): string[] {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") return [];
    cur = (cur as Record<string, unknown>)[p];
  }
  return Array.isArray(cur) ? (cur as string[]) : [];
}

function ScannerLoadingFallback() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-[color:var(--v2-line)] bg-white/80">
      <div className="flex items-center gap-3 text-sm font-black text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        {t("workspaceDock.loadingScanner")}
      </div>
    </div>
  );
}

const MultiEngineScanner = dynamic(() => import("@/components/MultiEngineScanner"), {
  ssr: false,
  loading: () => <ScannerLoadingFallback />,
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
  hiddenPrimaryRouteIds?: ReadonlySet<AppRouteId>;
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

function resolveSectionMeta(
  pathname: string,
  industryProfile: IndustryProfile,
  t: TFunction,
  hiddenPrimaryRouteIds?: ReadonlySet<AppRouteId>,
) {
  const nav = buildAppNavCollection(industryProfile, t, { hiddenPrimaryRouteIds });
  const current = nav.all.find((item) => isRouteActive(pathname, item.href)) ?? nav.primary[0];

  if (current.href === "/app/clients") {
    return {
      ...current,
      label: industryProfile.clientsLabel,
      summary: t("workspaceDock.sectionMeta.clientsSummary", {
        clients: industryProfile.clientsLabel.toLowerCase(),
        documents: industryProfile.documentsLabel.toLowerCase(),
      }),
    };
  }

  if (current.href === "/app/documents") {
    return {
      ...current,
      label: industryProfile.documentsLabel,
      summary: t("workspaceDock.sectionMeta.documentsSummary", {
        records: industryProfile.recordsLabel.toLowerCase(),
        industry: industryProfile.industryLabel.toLowerCase(),
      }),
    };
  }

  return current;
}

function buildWelcomeMessage(
  userName: string,
  industryProfile: IndustryProfile,
  sectionLabel: string,
  t: TFunction,
) {
  const first = userName.split(" ")[0] || t("workspaceDock.guestName");
  return t("workspaceDock.welcome", {
    name: first,
    section: sectionLabel,
    industry: industryProfile.industryLabel,
    documents: industryProfile.documentsLabel.toLowerCase(),
  });
}

function DockButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-12 w-12 touch-manipulation items-center justify-center rounded-2xl border transition ${
        active
          ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent)] text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.55)]"
          : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
      }`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5 transition group-hover:scale-110" aria-hidden />
    </button>
  );
}

export default function WorkspaceUtilityDock({
  orgId,
  industryProfile,
  userName,
  hiddenPrimaryRouteIds,
}: WorkspaceUtilityDockProps) {
  const { t, messages: localeMessages, locale, dir } = useI18n();
  const pathname = usePathname() ?? "/app";
  const currentSection = useMemo(
    () => resolveSectionMeta(pathname, industryProfile, t, hiddenPrimaryRouteIds),
    [hiddenPrimaryRouteIds, industryProfile, pathname, t],
  );
  const welcomeMessage = useMemo(
    () => buildWelcomeMessage(userName, industryProfile, currentSection.label, t),
    [currentSection.label, industryProfile, userName, t],
  );
  const quickPrompts = useMemo(() => {
    const professionTemplate = industryProfile.templates[0]?.label;

    switch (currentSection.href) {
      case "/app/inbox":
        return readStringArray(localeMessages, "workspaceDock.quickPrompts.inbox");
      case "/app/clients":
        return [
          t("workspaceDock.quickPrompts.clients.0", { clients: industryProfile.clientsLabel }),
          t("workspaceDock.quickPrompts.clients.1"),
          t("workspaceDock.quickPrompts.clients.2"),
        ];
      case "/app/documents":
        return [
          t("workspaceDock.quickPrompts.documents.0", { records: industryProfile.recordsLabel }),
          professionTemplate
            ? t("workspaceDock.quickPrompts.documents.withTemplate", { template: professionTemplate })
            : t("workspaceDock.quickPrompts.documents.noTemplate"),
          t("workspaceDock.quickPrompts.documents.2"),
        ];
      case "/app/billing":
        return readStringArray(localeMessages, "workspaceDock.quickPrompts.billing");
      case "/app/operations":
        return readStringArray(localeMessages, "workspaceDock.quickPrompts.operations");
      case "/app/settings":
        return readStringArray(localeMessages, "workspaceDock.quickPrompts.settings");
      default:
        return [
          t("workspaceDock.quickPrompts.default.0"),
          t("workspaceDock.quickPrompts.default.1", { section: currentSection.label }),
          t("workspaceDock.quickPrompts.default.2"),
        ];
    }
  }, [currentSection.href, currentSection.label, industryProfile, localeMessages, t]);

  const [openPanel, setOpenPanel] = useState<DockPanel>(null);
  const [chatMessages, setChatMessages] = useState<AssistantMessage[]>([
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
    setChatMessages((current) => {
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
      utterance.lang =
        locale === "he" ? "he-IL" : locale === "ru" ? "ru-RU" : "en-US";
      utterance.onend = () => setSpeakingMessageId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingMessageId(messageId);
    },
    [locale, speakingMessageId],
  );

  const sendAssistantMessage = useCallback(
    async (rawMessage: string, source: Extract<AssistantSource, "text" | "voice"> = "text") => {
      const trimmed = rawMessage.trim();
      if (!trimmed || sending) return;

      const userMessage = createMessage("user", trimmed, source);
      setChatMessages((current) => [...current, userMessage]);
      setSending(true);

      try {
        let reply = "";

        if (orgId) {
          const contextualMessage = t("workspaceDock.contextualOrgBlock", {
            section: currentSection.label,
            summary: currentSection.summary,
            industry: industryProfile.industryLabel,
            clients: industryProfile.clientsLabel,
            documents: industryProfile.documentsLabel,
            records: industryProfile.recordsLabel,
            templates: industryProfile.templates.map((template) => template.label).slice(0, 5).join(", "),
            request: trimmed,
          });

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
            throw new Error(data.error ?? t("workspaceDock.errors.aiLayerFailed"));
          }

          reply = data.answer?.trim() || t("workspaceDock.errors.noUsefulReply");
        } else {
          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                {
                  role: "user",
                  content: t("workspaceDock.contextualUserNoOrg", {
                    section: currentSection.label,
                    industry: industryProfile.industryLabel,
                    request: trimmed,
                  }),
                },
              ],
            }),
          });
          const data = (await response.json()) as { text?: string; error?: string };

          if (!response.ok) {
            throw new Error(data.error ?? t("workspaceDock.errors.aiLayerFailed"));
          }

          reply = data.text?.trim() || t("workspaceDock.errors.noUsefulReply");
        }

        const assistantMessage = createMessage("assistant", reply, source);
        setChatMessages((current) => [...current, assistantMessage]);
        setLastAssistantReply(reply);

        if (autoSpeak && source === "voice") {
          speakMessage(reply, assistantMessage.id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t("workspaceDock.errors.generic");
        setChatMessages((current) => [...current, createMessage("assistant", message, source)]);
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
      t,
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
  }, [chatMessages, openPanel, sending]);

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

  const compactPanelClassName =
    "fixed z-[255] flex max-h-[min(calc(100dvh-7rem),calc(100vh-7rem))] w-[min(100vw-2rem,26rem)] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[30px] border border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/98 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.55)] backdrop-blur-xl bottom-[max(6rem,env(safe-area-inset-bottom,0px))] left-[max(1rem,env(safe-area-inset-left,0px))] lg:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:left-[max(6rem,env(safe-area-inset-left,0px))] lg:max-h-[min(calc(100dvh-3rem),calc(100vh-3rem))]";

  const desktopDock = (
    <div className="fixed z-[260] hidden flex-col gap-3 lg:flex bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] left-[max(1.5rem,env(safe-area-inset-left,0px))]">
      <div className="rounded-[28px] border border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/96 p-2 shadow-[0_28px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="flex flex-col gap-2">
          <DockButton
            active={openPanel === "accessibility"}
            icon={Accessibility}
            label={t("workspaceDock.dock.accessibility")}
            onClick={() => setOpenPanel((current) => (current === "accessibility" ? null : "accessibility"))}
          />
          <DockButton
            active={openPanel === "assistant"}
            icon={Sparkles}
            label={t("workspaceDock.dock.assistant")}
            onClick={() => setOpenPanel((current) => (current === "assistant" ? null : "assistant"))}
          />
          <DockButton
            active={openPanel === "voice"}
            icon={isListening ? MicOff : Mic}
            label={t("workspaceDock.dock.voice")}
            onClick={() => setOpenPanel((current) => (current === "voice" ? null : "voice"))}
          />
          <DockButton
            active={openPanel === "scanner"}
            icon={ScanSearch}
            label={t("workspaceDock.dock.scanner")}
            onClick={() => setOpenPanel((current) => (current === "scanner" ? null : "scanner"))}
          />
        </div>
      </div>
    </div>
  );

  const mobileDock = (
    <div className="fixed z-[260] lg:hidden left-[max(0.75rem,env(safe-area-inset-left,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))] bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      <div className="grid grid-cols-4 gap-2 rounded-[28px] border border-[color:var(--v2-line)] bg-[color:var(--v2-surface)]/96 p-2 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        <DockButton
          active={openPanel === "accessibility"}
          icon={Accessibility}
          label={t("workspaceDock.dock.accessibility")}
          onClick={() => setOpenPanel((current) => (current === "accessibility" ? null : "accessibility"))}
        />
        <DockButton
          active={openPanel === "assistant"}
          icon={Sparkles}
          label={t("workspaceDock.dock.assistant")}
          onClick={() => setOpenPanel((current) => (current === "assistant" ? null : "assistant"))}
        />
        <DockButton
          active={openPanel === "voice"}
          icon={isListening ? MicOff : Mic}
          label={t("workspaceDock.dock.voice")}
          onClick={() => setOpenPanel((current) => (current === "voice" ? null : "voice"))}
        />
        <DockButton
          active={openPanel === "scanner"}
          icon={ScanSearch}
          label={t("workspaceDock.dock.scanner")}
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
        <section className={compactPanelClassName} dir={dir} aria-label={t("workspaceDock.assistant.panelAria")}>
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--v2-line)] px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <BrainCircuit className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">{t("workspaceDock.assistant.title")}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("workspaceDock.assistant.subtitle", {
                      section: currentSection.label,
                      industry: industryProfile.industryLabel,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenPanel(null)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label={t("workspaceDock.assistant.closeAria")}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                {t("workspaceDock.assistant.contextLabel")}
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
              {chatMessages.map((message) => (
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
                          {speakingMessageId === message.id
                            ? t("workspaceDock.assistant.readAloudStop")
                            : t("workspaceDock.assistant.readAloud")}
                        </button>
                        {message.source === "voice" ? (
                          <span className="rounded-full bg-[color:var(--v2-accent-soft)] px-2 py-1 text-[11px] font-black text-[color:var(--v2-accent)]">
                            {t("workspaceDock.assistant.voiceReplyBadge")}
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
                    {t("workspaceDock.assistant.thinking")}
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
                  aria-label={t("workspaceDock.assistant.goVoiceAria")}
                >
                  <Mic className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setOpenPanel("scanner")}
                  disabled={scannerButtonDisabled}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("workspaceDock.assistant.openScannerAria")}
                >
                  <ScanSearch className="h-4 w-4" aria-hidden />
                </button>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">{t("workspaceDock.assistant.messageLabel")}</span>
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    rows={3}
                    placeholder={t("workspaceDock.assistant.placeholder")}
                    className="min-h-[84px] w-full resize-none rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--v2-accent)] focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500">{t("workspaceDock.assistant.footerHint")}</p>
                <button
                  type="button"
                  onClick={submitInput}
                  disabled={sending || input.trim().length === 0}
                  className="v2-button v2-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <WandSparkles className="h-4 w-4" aria-hidden />
                  {t("workspaceDock.assistant.send")}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {openPanel === "voice" ? (
        <section className={compactPanelClassName} dir={dir} aria-label={t("workspaceDock.voice.panelAria")}>
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--v2-line)] px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <AudioLines className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">{t("workspaceDock.voice.title")}</h2>
                  <p className="mt-1 text-xs text-slate-500">{t("workspaceDock.voice.subtitle")}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenPanel(null)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label={t("workspaceDock.voice.closeAria")}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {voiceSupported ? t("workspaceDock.voice.micReady") : t("workspaceDock.voice.micUnsupported")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {voiceSupported ? t("workspaceDock.voice.micReadyHint") : t("workspaceDock.voice.micFallbackHint")}
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
                  aria-label={
                    isListening ? t("workspaceDock.voice.recordStopAria") : t("workspaceDock.voice.recordStartAria")
                  }
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
                  <span className="block text-sm font-black">{t("workspaceDock.voice.autoSendTitle")}</span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {t("workspaceDock.voice.autoSendHint")}
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
                  <span className="block text-sm font-black">{t("workspaceDock.voice.readRepliesTitle")}</span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {t("workspaceDock.voice.readRepliesHint")}
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
                  {t("workspaceDock.voice.autoSpeakHint")}
                </label>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{t("workspaceDock.voice.liveTitle")}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("workspaceDock.voice.liveHint")}</p>
                </div>
                {isListening ? (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                    {t("workspaceDock.voice.recordingNow")}
                  </span>
                ) : null}
              </div>

              <textarea
                value={voiceDraft}
                onChange={(event) => setVoiceDraft(event.target.value)}
                rows={5}
                placeholder={t("workspaceDock.voice.voicePlaceholder")}
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
                  {t("workspaceDock.voice.clear")}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenPanel("assistant")}
                    className="v2-button v2-button-secondary"
                  >
                    {t("workspaceDock.voice.goBubble")}
                  </button>
                  <button
                    type="button"
                    onClick={submitVoiceDraft}
                    disabled={sending || voiceDraft.trim().length === 0}
                    className="v2-button v2-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" aria-hidden />
                    {t("workspaceDock.voice.sendAsVoice")}
                  </button>
                </div>
              </div>
            </div>

            {lastAssistantReply ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{t("workspaceDock.voice.lastReplyTitle")}</p>
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
                    aria-label={t("workspaceDock.voice.readLastAria")}
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
          dir={dir}
          aria-label={t("workspaceDock.scanner.panelAria")}
        >
          <div className="flex h-full flex-col rounded-[32px] border border-white/40 bg-[color:var(--v2-surface)]/98 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.7)]">
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--v2-line)] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                    <ScanSearch className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{t("workspaceDock.scanner.title")}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {t("workspaceDock.scanner.subtitle", { industry: industryProfile.industryLabel })}
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
                  {t("workspaceDock.scanner.toDocuments")}
                </Link>
                <button
                  type="button"
                  onClick={() => setOpenPanel(null)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label={t("workspaceDock.scanner.closeAria")}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4 sm:py-4">
              {scannerButtonDisabled ? (
                <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-8 text-center">
                  <div className="max-w-md">
                    <p className="text-lg font-black text-slate-900">{t("workspaceDock.scanner.needOrgTitle")}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{t("workspaceDock.scanner.needOrgBody")}</p>
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
