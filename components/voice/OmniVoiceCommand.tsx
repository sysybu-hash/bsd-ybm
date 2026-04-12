"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Loader2, PlayCircle, StopCircle, Waves } from "lucide-react";

export default function OmniVoiceCommand() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  
  // Fake recognition for now (would be connected to Groq Whisper/WebSpeechAPI in production)
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      // Simulate fake processing 
      setTimeout(() => {
         setTranscript("תייצר לחשבונית של דני ברקוביץ׳ הצעת מחיר על סך 4,000 שקלים למחר");
         setIsProcessing(false);
         // Auto-hide popup after 4 secs
         setTimeout(() => {
            setShowPopup(false);
            setTranscript(null);
         }, 4000);
      }, 1500);
    } else {
      setTranscript(null);
      setIsRecording(true);
      setShowPopup(true);
    }
  };

  return (
    <>
      {/* Floating Microphone Button */}
      <button 
         onClick={toggleRecording}
         className={`fixed bottom-6 left-6 z-[999] flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isRecording ? "bg-red-500 animate-pulse text-white shadow-red-500/50" : "bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-blue-500/30 ring-2 ring-white"
         }`}
         aria-label="פקודות קוליות AI"
      >
         {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
         {/* Orbiting effect */}
         {!isRecording && (
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 animate-[spin_10s_linear_infinite]" />
         )}
      </button>

      {/* Popover Interface */}
      <div className={`fixed bottom-24 left-6 z-[998] w-80 overflow-hidden rounded-3xl border border-gray-100 bg-white/90 shadow-2xl backdrop-blur-xl transition-all duration-500 transform ${showPopup ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}>
         <div className="p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
         <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
               <div className={`p-2 rounded-xl text-white ${isRecording ? "bg-red-500" : isProcessing ? "bg-amber-500" : "bg-indigo-600"}`}>
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
               </div>
               <div>
                 <h4 className="font-black text-gray-900 leading-none">הפקת פקודה קולית</h4>
                 <p className="text-xs text-gray-500 font-bold mt-1">
                   {isRecording ? "מקשיב לפקודה שלך..." : isProcessing ? "מפענח ומעבד היגיון..." : "ממתין לפעולה"}
                 </p>
               </div>
            </div>

            {isRecording && (
               <div className="flex justify-center items-center gap-1 h-12">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <div 
                      key={bar} 
                      className="w-2 bg-blue-500 rounded-full animate-pulse" 
                      style={{ height: `${Math.random() * 30 + 10}px`, animationDelay: `${bar * 0.1}s` }}
                    />
                  ))}
               </div>
            )}

            {transcript && (
               <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 relative">
                  <span className="absolute -top-3 -right-2 text-3xl font-serif text-indigo-200">"</span>
                  <p className="font-medium text-indigo-900 text-sm leading-relaxed">{transcript}</p>
                  <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-100 px-2 py-0.5 rounded">בוצע בהצלחה</span>
                     <span className="text-[10px] text-gray-400">מופעל ע״י Groq + Gemini</span>
                  </div>
               </div>
            )}
            
            {!isRecording && !transcript && !isProcessing && (
               <div className="text-center py-4">
                  <p className="text-sm font-medium text-gray-400">"צור הצעת מחיר לדוד..."</p>
               </div>
            )}
         </div>
      </div>
    </>
  );
}
