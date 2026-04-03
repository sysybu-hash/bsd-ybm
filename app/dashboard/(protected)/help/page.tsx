import Link from "next/link";
import { BookOpenCheck, CreditCard, Settings, Shield, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DashboardHelpPage() {
  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          <BookOpenCheck size={14} />
          מדריך תפעול מובנה
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">איך לתפעל את האתר בפשטות</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          אם אינך טכני, עבוד לפי הרצף הזה. כל שלב כולל קישור ישיר לעמוד המתאים.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-900">
            <CreditCard size={18} className="text-rose-600" />
            שלב 1: מנויים ותשלומים
          </h2>
          <p className="text-sm text-slate-600">בדוק שהמנוי פעיל ושיש נתיב תשלום תקין.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dashboard/billing" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">פתיחת מסך מנויים</Link>
            <Link href="/dashboard/billing?tab=control" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">בקרת מנויים</Link>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-900">
            <Settings size={18} className="text-blue-600" />
            שלב 2: הגדרות ארגון
          </h2>
          <p className="text-sm text-slate-600">עדכן שם עסק, מס, כתובת, וחיבורי שירותים חיצוניים.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dashboard/settings" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">הגדרות ראשיות</Link>
            <Link href="/dashboard/settings?tab=billing" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">חיבורי תשלום</Link>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-900">
            <Users size={18} className="text-violet-600" />
            שלב 3: משתמשים ותפקידים
          </h2>
          <p className="text-sm text-slate-600">הזמן עובדים, הקצה תפקידים, ואשר משתמשים ממתינים.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dashboard/settings?tab=account" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700">ניהול משתמשים</Link>
            <Link href="/dashboard/admin?section=subscriptions" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">אישורי הרשמה</Link>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-900">
            <Shield size={18} className="text-emerald-600" />
            שלב 4: בקרה שוטפת
          </h2>
          <p className="text-sm text-slate-600">בקר מצב מערכת ודוחות, ואז עבור לתפעול CRM/ERP שוטף.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dashboard/control-center" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">מרכז תפעול</Link>
            <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">דשבורד ראשי</Link>
          </div>
        </article>
      </section>
    </div>
  );
}
