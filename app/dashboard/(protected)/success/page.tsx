"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#818cf8", "#e0e7ff"],
    });
  }, []);

  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in"
      dir="rtl"
    >
      <div className="bg-indigo-100 p-4 rounded-full mb-6 relative">
        <CheckCircle2 size={80} className="text-indigo-600" />
        <Sparkles className="absolute -top-2 -right-2 text-indigo-400 animate-pulse" size={32} />
      </div>

      <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent italic">
        ברוך הבא למסלול PRO!
      </h1>

      <p className="text-gray-600 text-lg mb-10 max-w-md">
        התשלום עובד בהצלחה. בנק הסריקות שלך עודכן ב-100 קרדיטים חדשים והגישה לכל כלי ה-AI של
        BSD-YBM פתוחה עבורך.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          type="button"
          onClick={() => router.push("/dashboard/erp")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20"
        >
          התחל לסרוק עכשיו <ArrowRight size={20} />
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          חזרה לדשבורד
        </button>
      </div>
    </div>
  );
}
