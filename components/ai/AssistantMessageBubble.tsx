"use client";

import { Volume2, VolumeX } from "lucide-react";

type Props = {
  role: "user" | "assistant";
  content: string;
  source?: "system" | "text" | "voice";
  showSpeak?: boolean;
  isSpeaking?: boolean;
  onSpeakToggle?: () => void;
  readLabel?: string;
  stopLabel?: string;
  voiceBadgeLabel?: string;
};

export default function AssistantMessageBubble({
  role,
  content,
  source,
  showSpeak = false,
  isSpeaking = false,
  onSpeakToggle,
  readLabel,
  stopLabel,
  voiceBadgeLabel,
}: Props) {
  return (
    <div className={`flex ${role === "user" ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-[var(--shadow-xs)] ${
          role === "user"
            ? "bg-[color:var(--ink-900)] text-white"
            : "border border-[color:var(--axis-ai-border)] bg-[color:var(--tile-lavender-bg)] text-[color:var(--ink-700)]"
        }`}
      >
        <p>{content}</p>
        {role === "assistant" ? (
          <div className="mt-3 flex items-center gap-2">
            {showSpeak && onSpeakToggle ? (
              <button
                type="button"
                onClick={onSpeakToggle}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--axis-ai-border)] bg-white px-2 py-1 text-[11px] font-black text-[color:var(--axis-ai-ink)] transition hover:border-[color:var(--axis-ai)] hover:text-[color:var(--axis-ai)]"
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5" aria-hidden /> : <Volume2 className="h-3.5 w-3.5" aria-hidden />}
                {isSpeaking ? stopLabel : readLabel}
              </button>
            ) : null}
            {source === "voice" && voiceBadgeLabel ? (
              <span className="rounded-full bg-[color:var(--axis-ai-soft)] px-2 py-1 text-[11px] font-black text-[color:var(--axis-ai)]">
                {voiceBadgeLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
