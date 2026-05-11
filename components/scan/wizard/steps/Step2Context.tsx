"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import type { ScanWizardProfile } from "@/lib/professions/scan-wizard";

type Props = {
  profile: ScanWizardProfile;
  projectLabel: string;
  clientLabel: string;
  userInstruction: string;
  onProject: (value: string) => void;
  onClient: (value: string) => void;
  onInstruction: (value: string) => void;
};

/**
 * Step 2 — הקשר (פרויקט / לקוח / הנחיה ל-AI).
 * תמיכה בקלט קולי בעברית דרך Web Speech API (lang="he-IL"). נופל בחן
 * אם הדפדפן לא תומך — מחביא את הכפתור ולא מציג שגיאה.
 */
export default function Step2Context({
  profile,
  projectLabel,
  clientLabel,
  userInstruction,
  onProject,
  onClient,
  onInstruction,
}: Props) {
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "unsupported">(() => {
    if (typeof window === "undefined") return "idle";
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    return w.SpeechRecognition || w.webkitSpeechRecognition ? "idle" : "unsupported";
  });

  const projectField = profile.contextFields.find((f) => f.key === "project");
  const clientField = profile.contextFields.find((f) => f.key === "client");
  const instructionField = profile.contextFields.find((f) => f.key === "instruction");

  const startVoice = () => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition: SpeechRecognitionLike = new Ctor();
    recognition.lang = "he-IL";
    recognition.interimResults = false;
    recognition.continuous = false;
    setVoiceState("listening");
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onInstruction(userInstruction ? `${userInstruction} ${transcript}`.trim() : transcript);
      }
    };
    recognition.onerror = () => setVoiceState("idle");
    recognition.onend = () => setVoiceState("idle");
    try {
      recognition.start();
    } catch {
      setVoiceState("idle");
    }
  };

  return (
    <div className="grid gap-5">
      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--scanw-muted)]">
          שיוך ל-{profile.tradeLabel ?? profile.industryLabel}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {projectField ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-black text-[color:var(--scanw-ink)]">{projectField.label}</span>
              <input
                type="text"
                value={projectLabel}
                onChange={(e) => onProject(e.target.value)}
                placeholder={projectField.placeholder}
                className="rounded-xl border border-[color:var(--scanw-line)] bg-white/80 px-3 py-2.5 text-sm font-semibold text-[color:var(--scanw-ink)] outline-none transition-all duration-200 focus:border-[color:var(--scanw-accent)] focus:bg-white focus:ring-2 focus:ring-[color:var(--scanw-accent-muted)]"
              />
            </label>
          ) : null}
          {clientField ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-black text-[color:var(--scanw-ink)]">{clientField.label}</span>
              <input
                type="text"
                value={clientLabel}
                onChange={(e) => onClient(e.target.value)}
                placeholder={clientField.placeholder}
                className="rounded-xl border border-[color:var(--scanw-line)] bg-white/80 px-3 py-2.5 text-sm font-semibold text-[color:var(--scanw-ink)] outline-none transition-all duration-200 focus:border-[color:var(--scanw-accent)] focus:bg-white focus:ring-2 focus:ring-[color:var(--scanw-accent-muted)]"
              />
            </label>
          ) : null}
        </div>
      </section>

      {instructionField ? (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--scanw-muted)]">
              הנחיה ל-AI
            </h2>
            {voiceState !== "unsupported" ? (
              <button
                type="button"
                onClick={startVoice}
                disabled={voiceState === "listening"}
                className={[
                  "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-black transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
                  voiceState === "listening"
                    ? "bg-rose-500 text-white"
                    : "bg-[color:var(--scanw-accent)] text-white hover:brightness-110",
                ].join(" ")}
                aria-label={voiceState === "listening" ? "מקליט..." : "הכתב הנחיה בקול"}
              >
                {voiceState === "listening" ? <MicOff className="h-3.5 w-3.5" aria-hidden /> : <Mic className="h-3.5 w-3.5" aria-hidden />}
                {voiceState === "listening" ? "מקליט..." : "הכתבה קולית"}
              </button>
            ) : null}
          </div>
          <textarea
            value={userInstruction}
            onChange={(e) => onInstruction(e.target.value)}
            placeholder={instructionField.placeholder}
            rows={3}
            className="w-full resize-none rounded-2xl border border-[color:var(--scanw-line)] bg-white/80 px-3 py-2.5 text-sm font-semibold text-[color:var(--scanw-ink)] outline-none transition-all duration-200 focus:border-[color:var(--scanw-accent)] focus:bg-white focus:ring-2 focus:ring-[color:var(--scanw-accent-muted)]"
          />
          {profile.instructionExamples.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.instructionExamples.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  onClick={() =>
                    onInstruction(userInstruction ? `${userInstruction} ${example.text}`.trim() : example.text)
                  }
                  className="rounded-full border border-[color:var(--scanw-line)] bg-white/80 px-3 py-1 text-[11px] font-black text-[color:var(--scanw-muted)] transition-all duration-200 hover:border-[color:var(--scanw-accent-muted)] hover:text-[color:var(--scanw-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--scanw-accent-muted)] active:scale-[0.98]"
                >
                  + {example.text}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

// טיפוסים מינימליים ל-Web Speech API (אין declaration רשמי ב-Next.js)
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionEventLike = {
  results?: Array<Array<{ transcript: string }>>;
};
