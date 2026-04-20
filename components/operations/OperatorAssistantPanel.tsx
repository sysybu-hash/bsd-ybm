"use client";

import Link from "next/link";
import { Bot, CheckCircle2 } from "lucide-react";

export default function OperatorAssistantPanel() {
  return (
    <div className="space-y-5" dir="rtl">
      <section className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_55%,_#ffffff_100%)] px-6 py-7 md:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white px-3 py-1 text-xs font-black text-teal-300">
            <Bot size={13} />
            Operator Agent
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">עוזר תפעולי</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            העוזר התפעולי אוחד לבועת ה-AI הראשית ב-dock. משם מקבלים הקשר מלא של כספים, לקוחות, מסמכים ומסך נוכחי.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[28px] border border-gray-200 bg-white p-4">
              <p className="text-sm font-black text-gray-900">שאלות מהירות</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <QuickBtn label="תן סטטוס מערכת" />
                <QuickBtn label="מה מצב המנוי שלי" />
                <QuickBtn label="תן רשימת משתמשים" />
                <QuickBtn label="חשבוניות ממתינות" />
              </div>
            </div>
            <div className="rounded-[28px] border border-emerald-500/25 bg-emerald-500/15 p-4">
              <p className="text-sm font-black text-emerald-900">איך להשתמש נכון</p>
              <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                <li>כתוב בקשה אחת ברורה בכל פעם מתוך הבועה המאוחדת.</li>
                <li>לפעולות רגישות תישאר שכבת אישור מפורשת.</li>
                <li>השאילתה נשלחת עם הקשר המסך הנוכחי והנתונים המסחריים.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-5 text-sm leading-7 text-gray-600">
          נקודת הכניסה לשיחה תפעולית נשארת בממשק האחוד של `WorkspaceUtilityDock`. המסך הזה נשאר כהסבר מעבר כדי לא לייצר שתי חוויות AI שונות במקביל.
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href="/app" className="rounded-2xl bg-teal-600 px-4 py-3 text-sm font-bold text-white">
            חזרה למרחב העבודה
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-800">
            <CheckCircle2 size={14} />
            פעולות רגישות ימשיכו לדרוש אישור מפורש.
          </span>
        </div>
      </section>
    </div>
  );
}

function QuickBtn({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}
