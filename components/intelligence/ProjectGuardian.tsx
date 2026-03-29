"use client";

import { ShieldCheck } from "lucide-react";

export default function ProjectGuardian() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <h4 className="font-black italic mb-4">רווחיות פרויקט חי</h4>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: "75%" }} />
        </div>
        <p className="mt-2 text-xs font-bold text-emerald-600">
          רווח נקי משוער: 25%
        </p>
      </div>

      <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
        <h4 className="font-black italic text-rose-900 mb-2 flex items-center gap-2">
          <ShieldCheck size={20} aria-hidden /> AI Guardian
        </h4>
        <p className="text-rose-700 text-xs">
          נמצאה חריגה: ספק &apos;חשמל ישיר&apos; שלח חשבונית כפולה החודש. המערכת
          חסמה את התשלום.
        </p>
      </div>
    </div>
  );
}
