import Link from "next/link";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Bot,
  Building2,
  CreditCard,
  FileSearch,
  Settings,
  Users,
  Workflow,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";

export const metadata = {
  title: "עזרה | BSD-YBM",
};

function HelpStep({
  step,
  title,
  description,
  href,
  label,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--ops-indigo)] text-sm font-black text-white">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--axis-ai-soft)] text-[color:var(--ops-indigo)]">
              {icon}
            </span>
            <h2 className="text-lg font-black text-[color:var(--ink-900)]">{title}</h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{description}</p>
          <Link href={href} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[color:var(--ink-900)] px-4 py-2 text-sm font-black text-white">
            {label}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function AppHelpPage() {
  const session = await getServerSession(authOptions);
  const platformAdmin = isAdmin(session?.user?.email);

  return (
    <div className="w-full min-w-0 space-y-5" dir="rtl">
      <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[color:var(--ops-indigo)]">
          Workspace guide
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--ink-900)]">
          איך מפעילים את BSD-YBM בלי ללכת לאיבוד
        </h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[color:var(--ink-500)]">
          זה מסלול העבודה הרשמי: קודם מסדרים מנוי וזהות עסקית, אחר כך מגדירים תחום בניה ומנועים, ואז עובדים מתוך לקוחות, מסמכים, כספים ותיבת עבודה. אין צורך לקפוץ בין מסכים ישנים.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <HelpStep
            step="1"
            title="בדיקת מנוי וחיוב"
            description="ודא שיש מסלול פעיל, מכסות סריקה מתאימות ואמצעי תשלום תקין."
            href="/app/settings/billing"
            label="פתח מנוי וחיוב"
            icon={<CreditCard className="h-5 w-5" aria-hidden />}
          />
          <HelpStep
            step="2"
            title="השלמת זהות הארגון"
            description="עדכן שם עסק, ח.פ/ע.מ, כתובת, צוות והרשאות. זה המקור למסמכים ולפעולות ERP."
            href="/app/settings/organization"
            label="פתח ארגון ומיסוי"
            icon={<Building2 className="h-5 w-5" aria-hidden />}
          />
          <HelpStep
            step="3"
            title="התאמת תחום הבניה והמנועים"
            description="בחר התמחות, תבניות, מנועי Document AI, Gemini, OpenAI וחיבורי ענן."
            href="/app/settings/stack"
            label="פתח מנועים וחיבורים"
            icon={<Bot className="h-5 w-5" aria-hidden />}
          />
          <HelpStep
            step="4"
            title="עבודה שוטפת"
            description="עכשיו עוברים לתיבת העבודה, לקוחות, מסמכים, לוח סריקה וכספים."
            href="/app/inbox"
            label="פתח תיבת עבודה"
            icon={<Workflow className="h-5 w-5" aria-hidden />}
          />
        </div>

        <aside className="grid gap-4">
          <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
            <h2 className="text-lg font-black text-[color:var(--ink-900)]">קיצורי דרך מהירים</h2>
            <div className="mt-4 grid gap-2">
              {[
                { href: "/app/settings/overview", label: "מרכז הגדרות", icon: Settings },
                { href: "/app/clients", label: "לקוחות CRM", icon: Users },
                { href: "/app/documents", label: "מסמכים וסריקה", icon: FileSearch },
                { href: platformAdmin ? "/app/admin" : "/app/ai", label: platformAdmin ? "ניהול מערכת" : "עוזר AI", icon: Bot },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg border border-[color:var(--line)] bg-white px-4 py-3 text-[13px] font-black text-[color:var(--ink-800)] transition hover:border-[color:var(--ops-indigo)] hover:bg-[color:var(--canvas-sunken)]"
                >
                  <Icon className="h-4 w-4 text-[color:var(--ops-indigo)]" aria-hidden />
                  <span className="flex-1">{label}</span>
                  <ArrowUpRight className="h-4 w-4 text-[color:var(--ink-400)]" aria-hidden />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-5 shadow-[var(--shadow-sm)]">
            <h2 className="text-lg font-black text-[color:var(--ink-900)]">כללי סדר</h2>
            <div className="mt-4 grid gap-3">
              {[
                "עבודה יומיומית מתבצעת תחת /app בלבד.",
                "הגדרות מערכת נמצאות במרכז ההגדרות, לא במסכי dashboard ישנים.",
                "הסריקה והצ'אט זמינים מסרגל הבועות המאוחד.",
                "אם יש ספק, מתחילים ממרכז ההגדרות ואז עוברים למסך העבודה המתאים.",
              ].map((item) => (
                <p key={item} className="rounded-lg bg-[color:var(--canvas-sunken)] px-4 py-3 text-[13px] leading-6 text-[color:var(--ink-700)]">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
