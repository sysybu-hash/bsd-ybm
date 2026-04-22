"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, ScanSearch, WandSparkles } from "lucide-react";
import AssistantMessageBubble from "@/components/ai/AssistantMessageBubble";
import { useI18n } from "@/components/I18nProvider";
import type { IndustryProfile } from "@/lib/professions/runtime";

type AssistantSource = "system" | "text" | "voice";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source: AssistantSource;
};

function createMessage(role: AssistantMessage["role"], content: string, source: AssistantSource): AssistantMessage {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return { id: `${role}-${random}`, role, content, source };
}

export type InlineWorkspaceAssistantProps = {
  orgId?: string | null;
  industryProfile: IndustryProfile;
  sectionLabel: string;
  sectionSummary: string;
  quickPrompts: string[];
  welcomeMessage: string;
  /** מצב תצוגה: dock = בתוך פאנל הצף; embed = אריח / מסך */
  variant?: "dock" | "embed";
  className?: string;
  onOpenVoice?: () => void;
  onOpenScanner?: () => void;
  scannerDisabled?: boolean;
  /** מזהה לשינוי הקשר (למשל pathname) — מאפס הודעות כשמשתנה */
  resetKey?: string;
};

/**
 * עוזר AI מבודד לכל הרכבה — state מקומי בלבד, בלי תלות בחלון AI מרכזי.
 * כל instance עונה באותו ממשק שבו הוא מוצג.
 */
export default function InlineWorkspaceAssistant({
  orgId,
  industryProfile,
  sectionLabel,
  sectionSummary,
  quickPrompts,
  welcomeMessage,
  variant = "embed",
  className = "",
  onOpenVoice,
  onOpenScanner,
  scannerDisabled = false,
  resetKey,
}: InlineWorkspaceAssistantProps) {
  const { t, locale, dir } = useI18n();
  const [chatMessages, setChatMessages] = useState<AssistantMessage[]>(() => [
    createMessage("assistant", welcomeMessage, "system"),
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setChatMessages((current) => {
      if (current.length === 1 && current[0]?.source === "system") {
        return [createMessage("assistant", welcomeMessage, "system")];
      }
      return current;
    });
  }, [welcomeMessage]);

  useEffect(() => {
    if (resetKey === undefined) return;
    setChatMessages([createMessage("assistant", welcomeMessage, "system")]);
    setInput("");
  }, [resetKey, welcomeMessage]);

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
      utterance.lang = locale === "he" ? "he-IL" : locale === "ru" ? "ru-RU" : "en-US";
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
            section: sectionLabel,
            summary: sectionSummary,
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
              sectionLabel,
              sectionSummary,
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
                    section: sectionLabel,
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
      } catch (error) {
        const message = error instanceof Error ? error.message : t("workspaceDock.errors.generic");
        setChatMessages((current) => [...current, createMessage("assistant", message, source)]);
      } finally {
        setSending(false);
      }
    },
    [industryProfile, orgId, sectionLabel, sectionSummary, sending, t],
  );

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [chatMessages, sending]);

  const submitInput = useCallback(() => {
    const draft = input.trim();
    if (!draft) return;
    setInput("");
    void sendAssistantMessage(draft, "text");
  }, [input, sendAssistantMessage]);

  const outer =
    variant === "embed"
      ? "rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] p-4 shadow-sm"
      : "";

  return (
    <div className={`${outer} ${className}`.trim()} dir={dir}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[color:var(--ink-400)]">
            {t("workspaceDock.assistant.contextLabel")}
          </p>
          <p className="mt-2 text-sm font-black text-[color:var(--ink-900)]">{sectionLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[color:var(--ink-500)]">{sectionSummary}</p>
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
              className="rounded-full border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-3 py-1.5 text-xs font-bold text-[color:var(--ink-600)] transition hover:border-[color:var(--axis-clients)] hover:text-[color:var(--axis-clients)]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div
          ref={messagesRef}
          className={`max-h-[min(45vh,22rem)] space-y-3 overflow-y-auto rounded-[24px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-4 ${
            variant === "embed" ? "min-h-[200px]" : ""
          }`}
        >
          {chatMessages.map((message) => (
            <AssistantMessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              source={message.source}
              showSpeak={message.role === "assistant"}
              isSpeaking={speakingMessageId === message.id}
              onSpeakToggle={() => speakMessage(message.content, message.id)}
              readLabel={t("workspaceDock.assistant.readAloud")}
              stopLabel={t("workspaceDock.assistant.readAloudStop")}
              voiceBadgeLabel={t("workspaceDock.assistant.voiceReplyBadge")}
            />
          ))}

          {sending ? (
            <div className="flex justify-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-3 py-2 text-xs font-black text-[color:var(--ink-500)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t("workspaceDock.assistant.thinking")}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-3">
          <div className="flex items-end gap-2">
            {onOpenVoice ? (
              <button
                type="button"
                onClick={onOpenVoice}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)] text-[color:var(--ink-600)] transition hover:border-[color:var(--line)] hover:bg-[color:var(--canvas-raised)] hover:text-[color:var(--ink-900)]"
                aria-label={t("workspaceDock.assistant.goVoiceAria")}
              >
                <Mic className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            {onOpenScanner ? (
              <button
                type="button"
                onClick={onOpenScanner}
                disabled={scannerDisabled}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)] text-[color:var(--ink-600)] transition hover:border-[color:var(--line)] hover:bg-[color:var(--canvas-raised)] hover:text-[color:var(--ink-900)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t("workspaceDock.assistant.openScannerAria")}
              >
                <ScanSearch className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t("workspaceDock.assistant.messageLabel")}</span>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                placeholder={t("workspaceDock.assistant.placeholder")}
                className="min-h-[84px] w-full resize-none rounded-[20px] border border-[color:var(--line-strong)] bg-[color:var(--canvas-sunken)] px-4 py-3 text-sm text-[color:var(--ink-900)] outline-none transition placeholder:text-[color:var(--ink-400)] focus:border-[color:var(--axis-clients)] focus:bg-[color:var(--canvas-raised)]"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-[color:var(--ink-500)]">{t("workspaceDock.assistant.footerHint")}</p>
            <button
              type="button"
              onClick={submitInput}
              disabled={sending || input.trim().length === 0}
              className="bento-btn bento-btn--primary"
            >
              <WandSparkles className="h-4 w-4" aria-hidden />
              {t("workspaceDock.assistant.send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
