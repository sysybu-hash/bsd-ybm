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
      className="bg-white text-slate-900 p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/40 font-sans"
      dir="rtl"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
          <BrainCircuit className="text-blue-600" size={24} aria-hidden />
        </div>
        <div>
          <h4 className="font-black text-xl italic text-slate-900 tracking-tighter">
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
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center animate-pulse border border-slate-200">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all text-white ${
                isRecording
                  ? "bg-rose-600 shadow-2xl shadow-rose-600/40 scale-110"
                  : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25"
              }`}
              aria-label={isRecording ? "הפסק הקלטה" : "התחל הקלטה"}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          )}
        </div>

        {response ? (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed animate-in fade-in">
            {response}
          </div>
        ) : null}
      </div>
    </div>
  );
}
