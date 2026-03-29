"use client";

import { useState } from "react";
import { Mic, MicOff, BrainCircuit, Loader2 } from "lucide-react";

export default function VoiceInsights() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState("");

  const startRecording = async () => {
    setIsRecording(true);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setResponse(
        "יוחנן, החודש הוצאתם ₪12,300 על שיווק, שזה 5% פחות מחודש שעבר. הרווח הנקי עלה ב-18%.",
      );
    }, 2500);
  };

  return (
    <div
      className="bg-slate-950 text-white p-8 rounded-[3rem] border border-white/5 shadow-3xl shadow-slate-950/40 font-sans"
      dir="rtl"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
          <BrainCircuit className="text-blue-400" size={24} aria-hidden />
        </div>
        <div>
          <h4 className="font-black text-xl italic text-white tracking-tighter">
            Voice Insights Live
          </h4>
          <p className="text-slate-500 text-xs">
            שאל את BSD Intelligence על הפיננסיים והלקוחות שלך
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center mb-8">
          {isProcessing ? (
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-rose-600 shadow-2xl shadow-rose-600/50 scale-110"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
              aria-label={isRecording ? "הפסק הקלטה" : "התחל הקלטה"}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          )}
        </div>

        {response ? (
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-sm text-slate-300 leading-relaxed animate-in fade-in">
            {response}
          </div>
        ) : null}
      </div>
    </div>
  );
}
