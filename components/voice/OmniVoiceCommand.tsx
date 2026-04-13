"use client";

import { useState } from "react";
import { Loader2, Mic, MicOff, Sparkles } from "lucide-react";

export default function OmniVoiceCommand() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        setTranscript('תייצר לחשבונית של דני ברקוביץ׳ הצעת מחיר על סך 4,000 ש"ח למחר');
        setIsProcessing(false);
        setTimeout(() => {
          setShowPopup(false);
          setTranscript(null);
        }, 4000);
      }, 1500);
      return;
    }

    setTranscript(null);
    setIsRecording(true);
    setShowPopup(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleRecording}
        className={`fixed bottom-6 left-6 z-[999] flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isRecording
            ? "animate-pulse bg-red-500 text-white shadow-red-500/50"
            : "bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-blue-500/30 ring-2 ring-white"
        }`}
        aria-label="פקודות קוליות AI"
      >
        {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
        {!isRecording ? (
          <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border-2 border-dashed border-white/40" />
        ) : null}
      </button>

      <div
        className={`fixed bottom-24 left-6 z-[998] w-80 transform overflow-hidden rounded-3xl border border-gray-100 bg-white/90 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
          showPopup
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-1" />
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div
              className={`rounded-xl p-2 text-white ${
                isRecording
                  ? "bg-red-500"
                  : isProcessing
                    ? "bg-amber-500"
                    : "bg-indigo-600"
              }`}
            >
              {isProcessing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
            </div>
            <div>
              <h4 className="leading-none font-black text-gray-900">
                הפקת פקודה קולית
              </h4>
              <p className="mt-1 text-xs font-bold text-gray-500">
                {isRecording
                  ? "מקשיב לפקודה שלך..."
                  : isProcessing
                    ? "מפענח ומעבד היגיון..."
                    : "ממתין לפעולה"}
              </p>
            </div>
          </div>

          {isRecording ? (
            <div className="flex h-12 items-center justify-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                <div
                  key={bar}
                  className="w-2 animate-pulse rounded-full bg-blue-500"
                  style={{
                    height: `${Math.random() * 30 + 10}px`,
                    animationDelay: `${bar * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : null}

          {transcript ? (
            <div className="relative rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <span className="absolute -right-2 -top-3 text-3xl font-serif text-indigo-200">
                &quot;
              </span>
              <p className="text-sm font-medium leading-relaxed text-indigo-900">
                {transcript}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-indigo-100 pt-3">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  בוצע בהצלחה
                </span>
                <span className="text-[10px] text-gray-400">מופעל על ידי Groq + Gemini</span>
              </div>
            </div>
          ) : null}

          {!isRecording && !transcript && !isProcessing ? (
            <div className="py-4 text-center">
              <p className="text-sm font-medium text-gray-400">
                &quot;צור הצעת מחיר לדוד...&quot;
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
