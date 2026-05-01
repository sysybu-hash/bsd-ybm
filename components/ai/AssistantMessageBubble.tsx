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
  const isUser = role === "user";
  const isSystem = source === "system";

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${
          isUser
            ? "rounded-bl-md bg-slate-950 text-white"
            : isSystem
              ? "rounded-br-md border border-slate-200 bg-white text-slate-700"
              : "rounded-br-md border border-violet-200 bg-gradient-to-br from-violet-50 to-white text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {role === "assistant" && (showSpeak || (source === "voice" && voiceBadgeLabel)) ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {showSpeak && onSpeakToggle ? (
              <button
                type="button"
                onClick={onSpeakToggle}
                className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-black text-violet-700 transition hover:border-violet-400 hover:text-violet-900"
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5" aria-hidden /> : <Volume2 className="h-3.5 w-3.5" aria-hidden />}
                {isSpeaking ? stopLabel : readLabel}
              </button>
            ) : null}
            {source === "voice" && voiceBadgeLabel ? (
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700">
                {voiceBadgeLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
