import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function MeckanoAccessDenied() {
  return (
    <div
      className="min-h-0 flex flex-1 flex-col items-center justify-center p-8 text-center"
      dir="rtl"
    >
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-rose-100 max-w-md flex flex-col items-center">
        <div className="bg-rose-50 text-rose-500 p-6 rounded-full mb-6">
          <ShieldX size={48} strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">אין הרשאת גישה</h1>
        <p className="text-slate-500 font-medium mb-6">
          מודול נוכחות ומקאנו מוגבל למשתמשים מורשים בלבד. אם נדרשה גישה — פנה למנהל המערכת.
        </p>
        <Link
          href="/dashboard"
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
        >
          חזור לדשבורד הראשי
        </Link>
      </div>
    </div>
  );
}
