import Link from "next/link";
import { Archive, HardDrive, Cloud } from "lucide-react";

/**
 * הסבר למשתמש: מסמכים ישנים מהמחשב → סריקת AI מרובת קבצים; ענן → הגדרות נפרדות.
 */
export default function ErpHistoricalImportCallout() {
  return (
    <section
      className="rounded-2xl border border-emerald-500/25/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/40 p-6 shadow-sm md:p-8"
      dir="rtl"
      aria-labelledby="erp-archive-title"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
          <Archive size={28} strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 space-y-3">
          <h2 id="erp-archive-title" className="text-xl font-black text-gray-900 tracking-tight">
            מסמכים ישנים מהמחשב — &quot;להתחיל מחדש&quot; עם הארכיון
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            אם יש לכם תיקיות עם חשבוניות / קבלות סרוקות מהעבודה השוטפת, אפשר{" "}
            <strong>לגרור כמה קבצים בבת אחת</strong> לאזור הסריקה למטה. המערכת מפענחת כל קובץ,
            שומרת אותו ברשימת המסמכים ב־ERP, ומצטרף לגרפים ולסיכומים — בלי לאבד את ההיסטוריה
            כשעוברים לעבודה במערכת.
          </p>
          <div className="text-sm text-gray-500 space-y-3">
            <p className="flex flex-wrap items-start gap-2">
              <HardDrive size={18} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden />
              <span>
                <strong>מהמחשב:</strong> בסורק ה־AI למטה — בוחרים מספר קבצים או גוררים תיקייה של
                סריקות; כל קובץ נשמר ב־ERP אחרי פענוח.
              </span>
            </p>
            <p className="flex flex-wrap items-start gap-2">
              <Cloud size={18} className="text-sky-600 shrink-0 mt-0.5" aria-hidden />
              <span>
                <strong>ענן (Drive, OneDrive…):</strong> לחיבור וגיבוי שוטף —{" "}
                <Link
                    href="/app/settings?tab=cloud"
                  className="font-bold text-indigo-300 underline underline-offset-2"
                >
                  הגדרות › גיבוי ענן
                </Link>
                .
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
