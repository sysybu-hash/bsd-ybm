import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Bot, CreditCard, FileText, Settings, Users } from "lucide-react";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name?.trim() || "הצוות";

  return (
    <div className="space-y-6" dir="rtl">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_46%,#ecfeff_100%)] p-6 md:p-8">
          <p className="text-sm font-bold text-slate-500">מרכז הבית</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">מכאן מתחילים את יום העבודה, {userName}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            הורדתי את שכבות הכניסה למסלול אחד ברור: בחר פעולה ראשית, ורק אם צריך המשך תפעולי מתקדם המשך למרכז העבודה או לעוזר התפעולי.
          </p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          <QuickActionCard
            href="/dashboard/crm"
            icon={<Users size={18} />}
            title="לקוחות ופרויקטים"
            description="כניסה ישירה לעבודה יומיומית מול לקוחות, פרויקטים והצעות מחיר."
            tone="violet"
          />
          <QuickActionCard
            href="/dashboard/erp/invoice"
            icon={<FileText size={18} />}
            title="חשבוניות ומסמכים"
            description="יצירה והנפקה של מסמכי ERP בלי לעבור דרך כמה מרכזים בדרך."
            tone="emerald"
          />
          <QuickActionCard
            href="/dashboard/settings"
            icon={<Settings size={18} />}
            title="הגדרות העסק"
            description="ניהול פרטי עסק, תשלום, גיבויים והעדפות מערכת במקום אחד."
            tone="amber"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">אם צריך עזרה או תפעול מתקדם</h2>
          <p className="mt-2 text-sm text-slate-600">הכלים המתקדמים עדיין קיימים, אבל עכשיו הם מופרדים מהעבודה היומיומית כדי שלא יעמיסו על המסך הראשי.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/control-center" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50">
              <p className="text-sm font-black text-slate-900">מרכז עבודה</p>
              <p className="mt-1 text-sm text-slate-600">צ&apos;קליסט, משפך Wizard וקישורי תפעול מרוכזים.</p>
            </Link>
            <Link href="/dashboard/operator" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50">
              <p className="inline-flex items-center gap-2 text-sm font-black text-slate-900"><Bot size={16} className="text-indigo-600" />עוזר תפעולי</p>
              <p className="mt-1 text-sm text-slate-600">שאל את המערכת על סטטוס, מנוי, משתמשים וחשבוניות.</p>
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">פעולות קצרות</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link href="/dashboard/billing" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:bg-slate-50">
              <span className="inline-flex items-center gap-2"><CreditCard size={16} className="text-rose-600" />מנוי ותשלום</span>
              <span className="font-bold text-slate-400">פתח</span>
            </Link>
            <Link href="/dashboard/settings?tab=account" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:bg-slate-50">
              <span className="inline-flex items-center gap-2"><Users size={16} className="text-violet-600" />ניהול משתמשים</span>
              <span className="font-bold text-slate-400">פתח</span>
            </Link>
            <Link href="/dashboard/help" className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:bg-slate-50">
              <span className="inline-flex items-center gap-2"><Settings size={16} className="text-sky-600" />מדריך מקוצר</span>
              <span className="font-bold text-slate-400">פתח</span>
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "violet" | "emerald" | "amber";
}) {
  const toneMap = {
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <Link href={href} className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${toneMap[tone]}`}>
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-black text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}
