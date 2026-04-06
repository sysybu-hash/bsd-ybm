import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpenCheck, CreditCard, Settings, Shield, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DashboardHelpPage() {
  return (
    <div className="space-y-5" dir="rtl">
      <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-6 py-7 md:px-8">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-500" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-[11px] font-bold text-indigo-400">
          <BookOpenCheck size={11} />
          מדריך תפעול מובנה
        </span>
        <h1 className="mt-3 text-2xl font-black text-gray-900">איך לתפעול את האתר בפשטות</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
          אם אינך טכני, עבוד לפי הרצף הזה. כל שלב כולל קישור ישיר לעמוד המתאים.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="space-y-3">
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
            icon={<Settings size={18} className="text-indigo-600" />}
            step="2"
            title="השלמת הגדרות העסק"
            description="עדכן פרטי עסק, מס, כתובת ואינטגרציות בסיסיות."
            primaryHref="/dashboard/settings"
            primaryLabel="פתח הגדרות"
            secondaryHref="/dashboard/settings?tab=billing"
            secondaryLabel="חיבורי תשלום"
          />
          <HelpStep
            icon={<Users size={18} className="text-indigo-600" />}
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
  const STEP_COLORS = ["indigo", "blue", "indigo", "emerald"];
  const color = STEP_COLORS[(Number(step) - 1) % STEP_COLORS.length];
  const bg: Record<string, string> = {
    indigo: "border-indigo-500/25 bg-indigo-500/[0.07]",
    blue: "border-indigo-500/25 bg-indigo-500/[0.07]",
    emerald: "border-emerald-500/25 bg-emerald-500/[0.07]",
  };
  const numBg: Record<string, string> = {
    indigo: "bg-indigo-500 text-white",
    blue: "bg-indigo-500 text-white",
    emerald: "bg-emerald-500 text-white",
  };
  const btnPrimary: Record<string, string> = {
    indigo: "bg-indigo-500 hover:bg-indigo-400",
    blue: "bg-indigo-500 hover:bg-indigo-400",
    emerald: "bg-emerald-500 hover:bg-emerald-400",
  };
  return (
    <article className={`flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between ${bg[color]}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base font-black shadow-sm ${numBg[color]}`}>{step}</div>
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-100 shadow-sm">{icon}</div>
            <h2 className="text-base font-black text-gray-900">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={primaryHref} className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors ${btnPrimary[color]}`}>{primaryLabel}</Link>
        <Link href={secondaryHref} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">{secondaryLabel}</Link>
      </div>
    </article>
  );
}
