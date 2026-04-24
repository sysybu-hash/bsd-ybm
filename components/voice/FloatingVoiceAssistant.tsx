"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, Loader2, Mic, MicOff, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSpeechServices } from "@/hooks/useSpeechServices";

function assistantText(m: UIMessage | undefined): string {
  if (!m?.parts?.length) return "";
  return m.parts
    .map((p) => (p.type === "text" || p.type === "reasoning" ? p.text : ""))
    .filter(Boolean)
    .join("\n");
}

export default function FloatingVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  const sendMessageRef = useRef<((o: { text: string }) => void) | null>(null);
  const speakRef = useRef<(text: string) => void>(() => {});

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/omni-voice",
      }),
    [],
  );

  const handleTranscript = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    void sendMessageRef.current?.({ text: t });
  }, []);

  const {
    isListening,
    isSpeaking,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    speak,
  } = useSpeechServices(handleTranscript);

  speakRef.current = speak;

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport,
    onFinish: ({ message }) => {
      const text = assistantText(message);
      if (text.trim()) speakRef.current(text);
    },
  });

  sendMessageRef.current = sendMessage;

  const busy = status === "submitted" || status === "streaming";

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]!.role === "assistant") return messages[i];
    }
    return undefined;
  }, [messages]);

  const displayText = isListening
    ? transcript || "דבר אלי..."
    : busy
      ? ""
      : assistantText(lastAssistant);

  return (
    <div className="pointer-events-none fixed bottom-6 end-6 z-[100] flex flex-col items-end gap-4 font-sans">
      {isOpen ? (
        <div className="pointer-events-auto w-[min(100vw-2rem,350px)] rounded-3xl border border-white/10 bg-[color:var(--ink-900)] p-6 text-white shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              stopListening();
              window.speechSynthesis.cancel();
            }}
            className="absolute start-3 top-3 text-white/50 transition hover:text-white"
            aria-label="סגור"
          >
            <X size={18} />
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div
              className={`rounded-xl p-2.5 ${
                isListening
                  ? "animate-pulse bg-rose-500"
                  : isSpeaking
                    ? "bg-violet-600"
                    : "bg-white/15"
              }`}
            >
              {isListening ? <Mic size={20} aria-hidden /> : <Bot size={20} aria-hidden />}
            </div>
            <div>
              <h4 className="text-sm font-bold">עוזר קולי BSD-YBM</h4>
              <p className="text-xs text-white/55">
                {isListening
                  ? "מקשיב…"
                  : busy
                    ? "מעבד…"
                    : isSpeaking
                      ? "מדבר…"
                      : "מחובר"}
              </p>
            </div>
          </div>

          <div className="min-h-[60px] max-h-[150px] overflow-y-auto text-sm leading-relaxed text-white/85">
            {isListening ? <p className="italic text-white/50">{displayText}</p> : null}
            {!isListening && busy ? (
              <div className="flex justify-center pt-4">
                <Loader2 className="h-6 w-6 animate-spin text-violet-300" aria-hidden />
              </div>
            ) : null}
            {!isListening && !busy && lastAssistant ? (
              <p className="whitespace-pre-wrap">{displayText}</p>
            ) : null}
            {speechError ? <p className="text-rose-300">{speechError}</p> : null}
            {error ? <p className="text-rose-300">{error.message}</p> : null}
          </div>

          {(isListening || isSpeaking) && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400 opacity-90 blur-[1px]" />
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          clearError();
          if (!isOpen) setIsOpen(true);
          if (isListening) {
            stopListening();
          } else {
            startListening();
          }
        }}
        className={`pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-105 ${
          isListening
            ? "bg-rose-500 ring-4 ring-rose-200/50"
            : isSpeaking
              ? "bg-[color:var(--ink-900)] ring-4 ring-violet-300/40"
              : "bg-[color:var(--ink-900)] hover:bg-black/80"
        }`}
        aria-pressed={isListening}
        aria-label={isListening ? "עצור האזנה" : "התחל האזנה קולית"}
      >
        {busy ? <Loader2 className="h-7 w-7 animate-spin" aria-hidden /> : null}
        {!busy && isListening ? <MicOff className="h-7 w-7" aria-hidden /> : null}
        {!busy && !isListening ? <Mic className="h-7 w-7" aria-hidden /> : null}
      </button>
    </div>
  );
}
