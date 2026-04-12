"use client";

import { useState } from "react";
import Link from "next/link";

type HealthStatus = "online" | "warning" | "error" | "pending";

interface StatusIndicator {
  id: string;
  label: string;
  status: HealthStatus;
  description: string;
  actionUrl: string;
}

export default function AdminSystemHealth() {
  const [indicators] = useState<StatusIndicator[]>([
    { id: "engines", label: "מנועי AI", status: "online", description: "מערכת תקינה", actionUrl: "/dashboard/ai" },
    { id: "approvals", label: "ממתינים", status: "online", description: "אין ממתינים", actionUrl: "/dashboard/admin?section=subscriptions" },
    { id: "billing", label: "סליקה", status: "online", description: "מערכת תקינה", actionUrl: "/dashboard/admin" },
    { id: "security", label: "אבטחה", status: "online", description: "מוגן", actionUrl: "/dashboard/admin" }
  ]);

  const getStatusColor = (s: HealthStatus) => {
    switch (s) {
      case "online": return "bg-emerald-500 shadow-emerald-500/50";
      case "warning": return "bg-amber-500 shadow-amber-500/50";
      case "error": return "bg-rose-500 shadow-rose-500/50";
      case "pending": return "bg-blue-500 shadow-blue-500/50";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="flex items-start gap-4 p-2" dir="rtl">
      {indicators.map((ind) => (
        <Link 
          key={ind.id} 
          href={ind.actionUrl}
          className="relative flex flex-col items-center group transition-all hover:scale-105"
          title={ind.description}
        >
          <div className="relative mb-2">
            <div className={`h-3 w-3 rounded-full ${getStatusColor(ind.status)} transition-colors duration-500 ring-2 ring-white ring-offset-1`} />
            <div className={`absolute inset-0 rounded-full ${getStatusColor(ind.status)} animate-ping opacity-20`} />
          </div>
          <div className="text-center opacity-80 group-hover:opacity-100">
            <p className="text-[10px] font-black leading-none text-slate-900">{ind.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
