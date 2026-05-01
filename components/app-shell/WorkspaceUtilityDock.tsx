"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BrainCircuit,
  Loader2,
  Mic,
  MicOff,
  ScanSearch,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import AssistantMessageBubble from "@/components/ai/AssistantMessageBubble";
import { useI18n } from "@/components/I18nProvider";
import { useSpeechServices } from "@/hooks/useSpeechServices";
import { buildAppNavCollection, type AppRouteId } from "@/components/app-shell/app-nav";
import type { IndustryProfile } from "@/lib/professions/runtime";
import type { MessageTree } from "@/lib/i18n/keys";
import type { TFunction } from "@/lib/i18n/translate";
import { resolveActiveAppNavItem } from "@/lib/app-shell-active-nav";

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
    <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-slate-200/10 bg-white/80">
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

type DockPanel = "accessibility" | "assistant" | "scanner" | null;
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

function resolveSectionMeta(
  pathname: string,
  industryProfile: IndustryProfile,
  t: TFunction,
  hiddenPrimaryRouteIds?: ReadonlySet<AppRouteId>,
) {
  const nav = buildAppNavCollection(industryProfile, t, { hiddenPrimaryRouteIds });
  const current = resolveActiveAppNavItem(pathname, nav);

  if (current.href === "/app/crm") {
    return {
      ...current,
      label: industryProfile.clientsLabel,
      summary: t("workspaceDock.sectionMeta.clientsSummary", {
        clients: industryProfile.clientsLabel.toLowerCase(),
        documents: industryProfile.documentsLabel.toLowerCase(),
      }),
    };
  }

  if (current.href === "/app/erp") {
    const erpLabel = industryProfile.financeNavLabel ?? industryProfile.documentsLabel;
    return {
      ...current,
      label: erpLabel,
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
      className={`group relative flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border transition ${
        active
          ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent)] text-white shadow-sm"
          : "border-slate-200/90 bg-white/95 text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
      }`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4 transition group-hover:scale-105" strokeWidth={2} aria-hidden />
    </button>
  );
}

export default function WorkspaceUtilityDock({
  orgId,
  industryProfile,
  userName,
  hiddenPrimaryRouteIds,
}: WorkspaceUtilityDockProps) {
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);
  const { t, messages: localeMessages, dir } = useI18n();
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
      case "/app":
        return readStringArray(localeMessages, "workspaceDock.quickPrompts.inbox");
      case "/app/crm":
        return [
          t("workspaceDock.quickPrompts.clients.0", { clients: industryProfile.clientsLabel }),
          t("workspaceDock.quickPrompts.clients.1"),
          t("workspaceDock.quickPrompts.clients.2"),
        ];
      case "/app/erp":
        return [
          t("workspaceDock.quickPrompts.documents.0", { records: industryProfile.recordsLabel }),
          professionTemplate
            ? t("workspaceDock.quickPrompts.documents.withTemplate", { template: professionTemplate })
            : t("workspaceDock.quickPrompts.documents.noTemplate"),
          t("workspaceDock.quickPrompts.documents.2"),
        ];
      case "/app/settings/billing":
        return readStringArray(localeMessages, "workspaceDock.quickPrompts.billing");
      case "/app/operations":
        return readStringArray(localeMessages, "workspaceDock.quickPrompts.operations");
      case "/app/settings/overview":
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
  const sendVoiceMessageRef = useRef<((text: string) => void) | null>(null);
  const speakRef = useRef<(text: string) => void>(() => {});
  const [chatMessages, setChatMessages] = useState<AssistantMessage[]>([
    createMessage("assistant", welcomeMessage, "system"),
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [liveSessionState, setLiveSessionState] = useState<"idle" | "arming" | "ready" | "fallback">("idle");
  const [liveModelLabel, setLiveModelLabel] = useState("Gemini Live");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setChatMessages((current) => {
      if (current.length === 1 && current[0]?.source === "system") {
        return [createMessage("assistant", welcomeMessage, "system")];
      }
      return current;
    });
  }, [welcomeMessage]);

  const sendAssistantMessage = useCallback(
    async (rawMessage: string, source: Exclude<AssistantSource, "system"> = "text") => {
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
              provider: source === "voice" ? "gemini" : undefined,
              sectionLabel: currentSection.label,
              sectionSummary: currentSection.summary,
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
        if (source === "voice" && reply.trim()) {
          speakRef.current(reply);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t("workspaceDock.errors.generic");
        setChatMessages((current) => [...current, createMessage("assistant", message, source)]);
        if (source === "voice") {
          speakRef.current(message);
        }
      } finally {
        setSending(false);
      }
    },
    [currentSection.label, currentSection.summary, industryProfile, orgId, sending, t],
  );

  sendVoiceMessageRef.current = (text: string) => {
    setOpenPanel("assistant");
    void sendAssistantMessage(text, "voice");
  };

  const {
    isListening,
    isSpeaking,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    speak,
  } = useSpeechServices((text) => {
    sendVoiceMessageRef.current?.(text);
  });
  speakRef.current = speak;

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  }, []);

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

  const submitInput = useCallback(() => {
    const draft = input.trim();
    if (!draft) return;
    setInput("");
    void sendAssistantMessage(draft, "text");
  }, [input, sendAssistantMessage]);

  const prepareGeminiLiveSession = useCallback(async () => {
    if (!orgId || liveSessionState === "ready" || liveSessionState === "arming") return;
    setLiveSessionState("arming");
    try {
      const response = await fetch("/api/ai/gemini-live/session", { method: "POST" });
      const data = (await response.json()) as { model?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Gemini Live session failed");
      }
      setLiveModelLabel(data.model ?? "Gemini Live");
      setLiveSessionState("ready");
    } catch (error) {
      console.warn("Gemini Live token fallback:", error);
      setLiveModelLabel("Browser speech + Gemini");
      setLiveSessionState("fallback");
    }
  }, [liveSessionState, orgId]);

  const toggleVoiceInput = useCallback(() => {
    setOpenPanel("assistant");
    if (isListening) {
      stopListening();
    } else {
      void prepareGeminiLiveSession();
      startListening();
    }
  }, [isListening, prepareGeminiLiveSession, startListening, stopListening]);

  const scannerButtonDisabled = !orgId;

  /**
   * בועות: תמיד צמודות לדופן הימני **הפיזי** של ה-viewport (לא לוגי start),
   * כדי שלא יזוזו עם מיכלי תוכן ולא יישארו “באמצע” המסך. אינן גוללות — position: fixed על document.body.
   */
  const workspaceDockFabPosition =
    "fixed z-[9900] top-1/2 -translate-y-1/2 left-[max(0.75rem,env(safe-area-inset-left,0px))] lg:left-[max(1rem,env(safe-area-inset-left,0px))]";

  /** פאנלים קומפקטיים: ממוקמים משמאל לעמודת הבועות (~3.5rem) */
  const compactPanelClassName =
    "fixed z-[9800] inset-x-3 bottom-[calc(7.1rem+env(safe-area-inset-bottom,0px))] flex max-h-[min(72dvh,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/10 bg-white/94 shadow-xl backdrop-blur-xl backdrop-saturate-150 lg:inset-x-auto lg:bottom-auto lg:top-1/2 lg:w-[min(100vw-2rem,26rem)] lg:max-w-[calc(100%-2rem)] lg:-translate-y-1/2 lg:bg-white/88 lg:left-[max(1rem,calc(env(safe-area-inset-left,0px)+1rem+3.5rem))]";

  const desktopDock = (
    <div className={`${workspaceDockFabPosition} hidden flex-col gap-2 lg:flex`}>
      <div className="rounded-2xl border border-slate-200/10 bg-white/88 p-1.5 shadow-xl backdrop-blur-xl backdrop-saturate-150 ring-1 ring-black/5">
        <div className="flex flex-col gap-1">
          <DockButton
            active={openPanel === "accessibility"}
            icon={Accessibility}
            label={t("workspaceDock.dock.accessibility")}
            onClick={() => setOpenPanel((current) => (current === "accessibility" ? null : "accessibility"))}
          />
          <DockButton
            active={openPanel === "scanner"}
            icon={ScanSearch}
            label={t("workspaceDock.dock.scanner")}
            onClick={() => setOpenPanel((current) => (current === "scanner" ? null : "scanner"))}
          />
          <DockButton
            active={openPanel === "assistant" || isListening || isSpeaking}
            icon={isListening ? MicOff : BrainCircuit}
            label={isListening ? "עצור האזנה קולית" : t("workspaceDock.dock.assistant")}
            onClick={() => setOpenPanel((current) => (current === "assistant" ? null : "assistant"))}
          />
        </div>
      </div>
    </div>
  );

  const mobileDock = (
    <div className="fixed z-[9900] lg:hidden bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2">
      <div className="flex gap-1 rounded-2xl border border-slate-200/10 bg-white/94 p-1.5 shadow-xl backdrop-blur-xl backdrop-saturate-150 ring-1 ring-black/5">
        <DockButton
          active={openPanel === "accessibility"}
          icon={Accessibility}
          label={t("workspaceDock.dock.accessibility")}
          onClick={() => setOpenPanel((current) => (current === "accessibility" ? null : "accessibility"))}
        />
        <DockButton
          active={openPanel === "scanner"}
          icon={ScanSearch}
          label={t("workspaceDock.dock.scanner")}
          onClick={() => setOpenPanel((current) => (current === "scanner" ? null : "scanner"))}
        />
        <DockButton
          active={openPanel === "assistant" || isListening || isSpeaking}
          icon={isListening ? MicOff : BrainCircuit}
          label={isListening ? "עצור האזנה קולית" : t("workspaceDock.dock.assistant")}
          onClick={() => setOpenPanel((current) => (current === "assistant" ? null : "assistant"))}
        />
      </div>
    </div>
  );

  const dockLayer = (
    <>
      {desktopDock}
      {mobileDock}

      {openPanel && openPanel !== "scanner" ? (
        <div
          className="fixed inset-0 z-[9700] bg-slate-950/20 backdrop-blur-[2px]"
          onClick={() => setOpenPanel(null)}
        />
      ) : null}

      {openPanel === "accessibility" ? (
        <div className={compactPanelClassName}>
          <AccessibilityMenu panelOnly onClose={() => setOpenPanel(null)} />
        </div>
      ) : null}

      {openPanel === "assistant" ? (
        <section className={compactPanelClassName} dir={dir} aria-label={t("workspaceDock.assistant.panelAria")}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/10 px-5 py-4">
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

            <div className="rounded-2xl border border-[color:var(--axis-ai-border)] bg-[color:var(--axis-ai-soft)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--axis-ai)]">
                    Gemini Live voice
                  </p>
                  <p className="mt-1 text-sm font-bold text-[color:var(--ink-800)]">
                    {isListening
                      ? transcript || "מקשיב עכשיו..."
                      : isSpeaking
                        ? "מקריא תשובה קולית..."
                        : liveSessionState === "arming"
                          ? "מכין חיבור Gemini Live מאובטח..."
                          : liveSessionState === "ready"
                            ? `${liveModelLabel} מוכן לדיבור`
                            : liveSessionState === "fallback"
                              ? "דיבור פעיל במצב תאימות דפדפן"
                              : "הקול מאוחד בתוך עוזר ה-AI"}
                  </p>
                  {speechError ? <p className="mt-1 text-xs font-semibold text-rose-600">{speechError}</p> : null}
                </div>
                <div className="flex gap-2">
                  {isSpeaking ? (
                    <button type="button" onClick={stopSpeaking} className="bento-btn bento-btn--secondary">
                      עצור קול
                      <Volume2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    disabled={sending}
                    className={`bento-btn ${isListening ? "bento-btn--secondary" : "bento-btn--primary"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {isListening ? "עצור האזנה" : "התחל דיבור"}
                    {isListening ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
              </div>
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
              className="max-h-[min(36dvh,22rem)] space-y-3 overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-4 lg:max-h-[min(45vh,22rem)]"
            >
              {chatMessages.map((message) => (
                <AssistantMessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  source={message.source}
                  showSpeak={message.role === "assistant" && message.source !== "system"}
                  isSpeaking={isSpeaking}
                  onSpeakToggle={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      speak(message.content);
                    }
                  }}
                  readLabel="הקרא"
                  stopLabel="עצור"
                  voiceBadgeLabel="קולי"
                />
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
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        submitInput();
                      }
                    }}
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

      {openPanel === "scanner" ? (
        <section
          className="fixed inset-0 z-[9950] flex flex-col bg-slate-950/80 backdrop-blur-md"
          dir={dir}
          aria-label={t("workspaceDock.scanner.panelAria")}
        >
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_75%_10%,rgba(59,130,246,0.28),transparent_34%),radial-gradient(circle_at_20%_85%,rgba(20,184,166,0.22),transparent_30%)]"
            aria-hidden
          />
          {/* שורת סגירה בזרימת המסמך — לא חופפת לכפתורי ניקוי/איפוס בכותרת הסורק (בעברית כפתור הסגירה בצד ההתחלה של השורה = ימין) */}
          <div className="relative z-[2] flex shrink-0 justify-start px-3 pt-3 sm:px-4 sm:pt-4">
            <button
              type="button"
              onClick={() => setOpenPanel(null)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/95 text-slate-800 shadow-lg shadow-slate-950/25 transition hover:bg-white hover:text-slate-950 sm:h-12 sm:w-12"
              aria-label={t("workspaceDock.scanner.closeAria")}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-3 sm:px-4 sm:pb-4">
            {scannerButtonDisabled ? (
              <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-8 text-center">
                <div className="max-w-md">
                  <p className="text-lg font-black text-slate-900">{t("workspaceDock.scanner.needOrgTitle")}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{t("workspaceDock.scanner.needOrgBody")}</p>
                </div>
              </div>
            ) : (
              <MultiEngineScanner industry={industryProfile.id} compactHeader dockWizard />
            )}
          </div>
        </section>
      ) : null}
    </>
  );

  if (typeof document === "undefined" || !portalReady) {
    return null;
  }
  return createPortal(
    <div className="dashboard-design-shell workspace-portal-scope" dir={dir}>
      {dockLayer}
    </div>,
    document.body,
  );
}
