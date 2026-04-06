"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";

const WEEK = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

/** לוח שנה חודשי פשוט — בסיס לסנכרון Google Calendar */
export default function TenantCalendarMini() {
  const { year, month, label, cells } = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay(); // ראשון = 0
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    const label = d.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
    return { year: y, month: m, label, cells };
  }, []);

  const today = new Date();
  const isToday = (day: number | null) =>
    day != null &&
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-4 shadow-sm" dir="rtl">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-white/75">
        <CalendarDays size={18} className="text-indigo-400" aria-hidden />
        {label}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-white/35">
        {WEEK.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`flex h-8 items-center justify-center rounded-lg font-medium ${
              day == null
                ? "text-transparent"
                : isToday(day)
                  ? "bg-indigo-600 text-white font-black"
                  : "text-white/65 hover:bg-white/[0.03]"
            }`}
          >
            {day ?? "·"}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] font-medium text-white/35">
        סנכרון אירועים מול Google Calendar יופעל לאחר חיבור OAuth בהגדרות Google של הארגון.
      </p>
    </div>
  );
}
