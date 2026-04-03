import Link from "next/link";
import type { ReactNode } from "react";
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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-4">
          <HelpStep
            icon={<CreditCard size={18} className="text-rose-600" />}
            step="1"
            title="בדיקת מנוי ותשלום"
            description="לפני כל דבר אחר, ודא שיש חבילה פעילה ונתיב תשלום תקין."
            primaryHref="/dashboard/billing"
            primaryLabel="פתח מנוי"
            secondaryHref="/dashboard/billing?tab=control"
            secondaryLabel="בקרת מנויים"
          />
          <HelpStep
            icon={<Settings size={18} className="text-blue-600" />}
            step="2"
            title="השלמת הגדרות העסק"
            description="עדכן פרטי עסק, מס, כתובת ואינטגרציות בסיסיות."
            primaryHref="/dashboard/settings"
            primaryLabel="פתח הגדרות"
            secondaryHref="/dashboard/settings?tab=billing"
            secondaryLabel="חיבורי תשלום"
          />
          <HelpStep
            icon={<Users size={18} className="text-violet-600" />}
            step="3"
            title="ניהול צוות והרשאות"
            description="הזמן משתמשים, אשר בקשות והקצה תפקידים."
            primaryHref="/dashboard/settings?tab=account"
            primaryLabel="פתח משתמשים"
            secondaryHref="/dashboard/admin?section=subscriptions"
            secondaryLabel="אישורים"
          />
          <HelpStep
            icon={<Shield size={18} className="text-emerald-600" />}
            step="4"
            title="מעבר לעבודה שוטפת"
            description="אחרי שהבסיס מוכן, חזור למסך הבית או פתח את מרכז העבודה לפי הצורך."
            primaryHref="/dashboard"
            primaryLabel="חזרה לבית"
            secondaryHref="/dashboard/control-center"
            secondaryLabel="מרכז עבודה"
          />
        </div>
      </section>
    </div>
  );
}

function HelpStep({
  icon,
  step,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: ReactNode;
  step: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white shadow-sm">{icon}</div>
        <div>
          <p className="text-xs font-bold text-slate-500">שלב {step}</p>
          <h2 className="mt-1 text-lg font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={primaryHref} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">{primaryLabel}</Link>
        <Link href={secondaryHref} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{secondaryLabel}</Link>
      </div>
    </article>
  );
}
