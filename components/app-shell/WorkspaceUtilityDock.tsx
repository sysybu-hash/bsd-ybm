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
  Settings2,
  ScanSearch,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import AssistantMessageBubble from "@/components/ai/AssistantMessageBubble";
import ScanResultCardPortal from "@/components/app-shell/ScanResultCardPortal";
import {
  transcriptRequestsScanner,
  useGlobalScanTriggers,
} from "@/components/scan/hooks/useGlobalScanTriggers";
import { useI18n } from "@/components/I18nProvider";
import {
  DEFAULT_GEMINI_LIVE_VOICE_SETTINGS,
  useGeminiLiveAudio,
  type GeminiLiveVoiceSettings,
} from "@/hooks/useGeminiLiveAudio";
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

const ScanWizardShell = dynamic(() => import("@/components/scan/wizard/ScanWizardShell"), {
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

const GEMINI_LIVE_VOICE_SETTINGS_STORAGE_KEY = "bsd-ybm-gemini-live-voice-settings-v1";

const GEMINI_LIVE_VOICES: Array<{ id: GeminiLiveVoiceSettings["voiceName"]; label: string; description: string }> = [
  { id: "Kore", label: "Kore", description: "מאוזן וברור" },
  { id: "Puck", label: "Puck", description: "קליל ומהיר" },
  { id: "Charon", label: "Charon", description: "עמוק וסמכותי" },
  { id: "Fenrir", label: "Fenrir", description: "חד ואנרגטי" },
  { id: "Aoede", label: "Aoede", description: "רך ונעים" },
];

function normalizeVoiceSettings(value: unknown): GeminiLiveVoiceSettings {
  const raw = value && typeof value === "object" ? (value as Partial<GeminiLiveVoiceSettings>) : {};
  const voiceName = GEMINI_LIVE_VOICES.some((voice) => voice.id === raw.voiceName)
    ? raw.voiceName!
    : DEFAULT_GEMINI_LIVE_VOICE_SETTINGS.voiceName;

  return {
    voiceName,
    temperature:
      typeof raw.temperature === "number"
        ? Math.min(1.4, Math.max(0.2, raw.temperature))
        : DEFAULT_GEMINI_LIVE_VOICE_SETTINGS.temperature,
    silenceDurationMs:
      typeof raw.silenceDurationMs === "number"
        ? Math.min(3000, Math.max(500, raw.silenceDurationMs))
        : DEFAULT_GEMINI_LIVE_VOICE_SETTINGS.silenceDurationMs,
    prefixPaddingMs:
      typeof raw.prefixPaddingMs === "number"
        ? Math.min(1000, Math.max(100, raw.prefixPaddingMs))
        : DEFAULT_GEMINI_LIVE_VOICE_SETTINGS.prefixPaddingMs,
    inputTranscription:
      typeof raw.inputTranscription === "boolean"
        ? raw.inputTranscription
        : DEFAULT_GEMINI_LIVE_VOICE_SETTINGS.inputTranscription,
    outputTranscription:
      typeof raw.outputTranscription === "boolean"
        ? raw.outputTranscription
        : DEFAULT_GEMINI_LIVE_VOICE_SETTINGS.outputTranscription,
    responseMode: raw.responseMode === "audio_text" ? "audio_text" : DEFAULT_GEMINI_LIVE_VOICE_SETTINGS.responseMode,
  };
}

type WorkspaceUtilityDockProps = {
  orgId?: string | null;
  industryProfile: IndustryProfile;
  userName: string;
  hiddenPrimaryRouteIds?: ReadonlySet<AppRouteId>;
  geminiConfigured?: boolean;
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
  geminiConfigured = false,
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
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<GeminiLiveVoiceSettings>(DEFAULT_GEMINI_LIVE_VOICE_SETTINGS);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(GEMINI_LIVE_VOICE_SETTINGS_STORAGE_KEY);
      if (saved) {
        setVoiceSettings(normalizeVoiceSettings(JSON.parse(saved)));
      }
    } catch {
      setVoiceSettings(DEFAULT_GEMINI_LIVE_VOICE_SETTINGS);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(GEMINI_LIVE_VOICE_SETTINGS_STORAGE_KEY, JSON.stringify(voiceSettings));
    } catch {
      /* localStorage can be unavailable in private contexts */
    }
  }, [voiceSettings]);

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

  const liveSystemInstruction = useMemo(
    () =>
      [
        "אתה סייען AI קולי מקצועי של BSD-YBM.",
        "ענה בעברית טבעית, קצרה ומעשית.",
        `המשתמש נמצא באזור: ${currentSection.label}.`,
        `תחום הפעילות: ${industryProfile.industryLabel}.`,
        `תקציר אזור: ${currentSection.summary}.`,
        "אל תחשוף פרטי מערכת. אם צריך פעולה בתוך המערכת, הסבר למשתמש מה לבצע במסך.",
      ].join("\n"),
    [currentSection.label, currentSection.summary, industryProfile.industryLabel],
  );

  const geminiLive = useGeminiLiveAudio({
    enabled: Boolean(orgId),
    systemInstruction: liveSystemInstruction,
    settings: voiceSettings,
    onUserTranscript: (text, finished) => {
      setOpenPanel("assistant");
      if (!finished) return;
      setChatMessages((current) => [...current, createMessage("user", text, "voice")]);
      if (transcriptRequestsScanner(text)) {
        setOpenPanel("scanner");
      }
    },
    onModelTranscript: (text, finished) => {
      setOpenPanel("assistant");
      if (!finished) return;
      setChatMessages((current) => [...current, createMessage("assistant", text, "voice")]);
    },
    onError: (message) => {
      console.warn("Gemini Live fallback:", message);
    },
  });

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

  const toggleVoiceInput = useCallback(() => {
    setOpenPanel("assistant");
    if (geminiLive.isLiveActive) {
      geminiLive.stop();
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      void geminiLive.start().then((started) => {
        if (!started) {
          startListening();
        }
      });
    }
  }, [geminiLive, isListening, startListening, stopListening]);

  const updateVoiceSettings = useCallback((patch: Partial<GeminiLiveVoiceSettings>) => {
    setVoiceSettings((current) => normalizeVoiceSettings({ ...current, ...patch }));
  }, []);

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
  const assistantPanelClassName =
    "fixed z-[9920] inset-x-3 top-[max(0.75rem,env(safe-area-inset-top,0px))] bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] flex flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/96 shadow-[0_28px_90px_rgba(15,23,42,0.28)] backdrop-blur-2xl backdrop-saturate-150 lg:inset-x-auto lg:bottom-auto lg:top-1/2 lg:left-[max(1rem,calc(env(safe-area-inset-left,0px)+1rem+3.5rem))] lg:h-[min(86dvh,46rem)] lg:w-[min(100vw-2rem,31rem)] lg:-translate-y-1/2";

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
            active={openPanel === "assistant" || isListening || isSpeaking || geminiLive.isLiveActive}
            icon={isListening || geminiLive.isLiveActive ? MicOff : BrainCircuit}
            label={isListening || geminiLive.isLiveActive ? "עצור האזנה קולית" : t("workspaceDock.dock.assistant")}
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
          active={openPanel === "assistant" || isListening || isSpeaking || geminiLive.isLiveActive}
          icon={isListening || geminiLive.isLiveActive ? MicOff : BrainCircuit}
          label={isListening || geminiLive.isLiveActive ? "עצור האזנה קולית" : t("workspaceDock.dock.assistant")}
          onClick={() => setOpenPanel((current) => (current === "assistant" ? null : "assistant"))}
        />
      </div>
    </div>
  );

  const handleAskAiAboutScan = useCallback(
    (prompt: string) => {
      setOpenPanel("assistant");
      void sendAssistantMessage(prompt, "text");
    },
    [sendAssistantMessage],
  );

  const openScannerPanel = useCallback(() => setOpenPanel("scanner"), []);
  const { isDraggingOverWindow } = useGlobalScanTriggers({
    onOpenScanner: openScannerPanel,
    enabled: Boolean(orgId),
  });

  const dockLayer = (
    <>
      {desktopDock}
      {mobileDock}
      <ScanResultCardPortal onAskAi={handleAskAiAboutScan} />
      {isDraggingOverWindow ? (
        <div
          className="pointer-events-none fixed inset-0 z-[9990] flex items-center justify-center bg-violet-950/50 backdrop-blur-sm"
          aria-hidden
        >
          <div className="rounded-3xl border-4 border-dashed border-white/80 bg-white/10 px-10 py-8 text-center text-white shadow-2xl">
            <p className="text-3xl font-black">שחרר כדי לסרוק</p>
            <p className="mt-2 text-sm font-semibold opacity-90">AI יסנכרן ל-ERP, ל-CRM ויתריע על חריגות מחיר</p>
          </div>
        </div>
      ) : null}

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
        <section className={assistantPanelClassName} dir={dir} aria-label={t("workspaceDock.assistant.panelAria")}>
          <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                  <BrainCircuit className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-500">BSD-YBM AI</p>
                  <h2 className="truncate text-lg font-black text-slate-950">סייען עבודה חכם</h2>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {currentSection.label} · {industryProfile.industryLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                aria-label={t("workspaceDock.assistant.closeAria")}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="shrink-0 space-y-3 border-b border-slate-200/70 bg-gradient-to-b from-slate-50 to-white px-4 py-3 sm:px-5">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/90 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">Gemini Live Voice</p>
                  <button
                    type="button"
                    onClick={() => setVoiceSettingsOpen((current) => !current)}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-violet-700 transition ${
                      voiceSettingsOpen
                        ? "border-violet-300 bg-white shadow-sm"
                        : "border-transparent bg-violet-100 hover:border-violet-200 hover:bg-white"
                    }`}
                    aria-label="הגדרות קול"
                    title="הגדרות קול"
                  >
                    <Settings2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <p className="mt-1 truncate text-sm font-black text-slate-900">
                  {geminiLive.isLiveActive
                    ? geminiLive.lastTranscript || geminiLive.statusText
                    : isListening
                      ? transcript || "מקשיב עכשיו..."
                      : isSpeaking
                        ? "מקריא תשובה קולית..."
                        : geminiLive.state === "fallback"
                          ? "מצב תאימות פעיל"
                          : "מוכן לשיחה קולית חיה"}
                </p>
                {speechError ? <p className="mt-1 text-xs font-semibold text-rose-600">{speechError}</p> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                {isSpeaking ? (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300"
                    aria-label="עצור קול"
                  >
                    <Volume2 className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={sending}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isListening || geminiLive.isLiveActive
                      ? "border border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                      : "border border-violet-500 bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  {isListening || geminiLive.isLiveActive ? "עצור" : "דיבור חי"}
                  {isListening || geminiLive.isLiveActive ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>

            {voiceSettingsOpen ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">הגדרות דיבור</p>
                    <p className="text-xs font-semibold text-slate-500">סגנון, קול, רגישות ותמלול</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceSettings(DEFAULT_GEMINI_LIVE_VOICE_SETTINGS)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:bg-white"
                  >
                    איפוס
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {GEMINI_LIVE_VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => updateVoiceSettings({ voiceName: voice.id })}
                      className={`min-w-0 rounded-xl border px-2 py-2 text-center transition ${
                        voiceSettings.voiceName === voice.id
                          ? "border-violet-400 bg-violet-50 text-violet-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
                      }`}
                      title={voice.description}
                    >
                      <span className="block truncate text-xs font-black">{voice.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="flex items-center justify-between gap-3 text-xs font-black text-slate-600">
                      יצירתיות
                      <span className="text-violet-700">{voiceSettings.temperature.toFixed(1)}</span>
                    </span>
                    <input
                      type="range"
                      min="0.2"
                      max="1.4"
                      step="0.1"
                      value={voiceSettings.temperature}
                      onChange={(event) => updateVoiceSettings({ temperature: Number(event.target.value) })}
                      className="mt-2 w-full accent-violet-600"
                    />
                  </label>

                  <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="flex items-center justify-between gap-3 text-xs font-black text-slate-600">
                      עצירת דיבור
                      <span className="text-violet-700">{(voiceSettings.silenceDurationMs / 1000).toFixed(1)}s</span>
                    </span>
                    <input
                      type="range"
                      min="500"
                      max="3000"
                      step="100"
                      value={voiceSettings.silenceDurationMs}
                      onChange={(event) => updateVoiceSettings({ silenceDurationMs: Number(event.target.value) })}
                      className="mt-2 w-full accent-violet-600"
                    />
                  </label>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateVoiceSettings({ responseMode: voiceSettings.responseMode === "audio" ? "audio_text" : "audio" })}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                      voiceSettings.responseMode === "audio_text"
                        ? "border-violet-300 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    קול + טקסט
                  </button>
                  <button
                    type="button"
                    onClick={() => updateVoiceSettings({ outputTranscription: !voiceSettings.outputTranscription })}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                      voiceSettings.outputTranscription
                        ? "border-violet-300 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    תמלול תשובה
                  </button>
                  <button
                    type="button"
                    onClick={() => updateVoiceSettings({ inputTranscription: !voiceSettings.inputTranscription })}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                      voiceSettings.inputTranscription
                        ? "border-violet-300 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    תמלול משתמש
                  </button>
                  <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="flex items-center justify-between gap-3 text-xs font-black text-slate-600">
                      מקדים
                      <span className="text-violet-700">{voiceSettings.prefixPaddingMs}ms</span>
                    </span>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="50"
                      value={voiceSettings.prefixPaddingMs}
                      onChange={(event) => updateVoiceSettings({ prefixPaddingMs: Number(event.target.value) })}
                      className="mt-2 w-full accent-violet-600"
                    />
                  </label>
                </div>

                {geminiLive.isLiveActive ? (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                    שינוי ההגדרות יחול מהחיבור הקולי הבא.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput("");
                    void sendAssistantMessage(prompt, "text");
                  }}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-slate-50/70 px-4 py-4 sm:px-5">
            <div
              ref={messagesRef}
              className="h-full space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-inner"
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
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 sm:px-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
              <div className="flex items-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setOpenPanel("scanner")}
                  disabled={scannerButtonDisabled}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="max-h-28 min-h-[52px] w-full resize-none rounded-xl border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={submitInput}
                  disabled={sending || input.trim().length === 0}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  aria-label={t("workspaceDock.assistant.send")}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <WandSparkles className="h-4 w-4" aria-hidden />}
                </button>
              </div>

              <p className="px-2 pb-1 text-[11px] font-semibold text-slate-400">{t("workspaceDock.assistant.footerHint")}</p>
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
              <ScanWizardShell
                industryProfile={industryProfile}
                geminiConfigured={geminiConfigured}
                variant="dock"
              />
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
