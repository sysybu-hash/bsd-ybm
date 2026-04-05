"use client";

import { Smile, Frown, Meh, AlertCircle } from "lucide-react";

export default function SentimentBadge({
  score,
}: {
  score: "happy" | "neutral" | "angry";
}) {
  const config = {
    happy: {
      icon: Smile,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      text: "לקוח מרוצה",
    },
    neutral: {
      icon: Meh,
      color: "text-gray-400",
      bg: "bg-gray-50",
      text: "סטטוס רגיל",
    },
    angry: {
      icon: Frown,
      color: "text-rose-500",
      bg: "bg-rose-50",
      text: "בסיכון גבוה",
    },
  };

  const { icon: Icon, color, bg, text } = config[score];

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-transparent shadow-sm ${bg} ${color} transition-all hover:scale-105`}
      dir="rtl"
    >
      <Icon size={16} aria-hidden />
      <span className="text-xs font-black italic">{text}</span>
      {score === "angry" ? (
        <AlertCircle size={14} className="animate-bounce" aria-hidden />
      ) : null}
    </div>
  );
}
