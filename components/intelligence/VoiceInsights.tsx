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
      className="rounded-2xl border border-gray-200 bg-white p-8 font-sans text-gray-900 shadow-sm"
      dir="rtl"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-indigo-500/15 rounded-2xl border border-indigo-500/20">
          <BrainCircuit className="text-indigo-400" size={24} aria-hidden />
        </div>
        <div>
          <h4 className="font-black text-xl italic text-gray-900 tracking-tighter">
            Voice Insights Live
          </h4>
          <p className="text-gray-400 text-xs">
            שאל את BSD Intelligence על הפיננסיים והלקוחות שלך
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center mb-8">
          {isProcessing ? (
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center animate-pulse border border-gray-200">
              <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
          ) : (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              className={`flex h-20 w-20 items-center justify-center rounded-full text-white transition-all ${
                isRecording
                  ? "scale-110 bg-rose-600 shadow-lg shadow-rose-200"
                  : "bg-indigo-600 shadow-sm hover:bg-indigo-700"
              }`}
              aria-label={isRecording ? "הפסק הקלטה" : "התחל הקלטה"}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          )}
        </div>

        {response ? (
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 text-sm text-gray-600 leading-relaxed animate-in fade-in">
            {response}
          </div>
        ) : null}
      </div>
    </div>
  );
}
