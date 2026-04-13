import Link from "next/link";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  Bot,
  CreditCard,
  Settings,
  Shield,
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
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  icon: ReactNode;
}) {
  return (
    <article className="v2-panel p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--v2-accent)] text-sm font-black text-white">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
              {icon}
            </span>
            <h2 className="text-lg font-black text-[color:var(--v2-ink)]">{title}</h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{description}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={primaryHref} className="v2-button v2-button-primary">
              {primaryLabel}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href={secondaryHref} className="v2-button v2-button-secondary">
              {secondaryLabel}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function AppHelpPage() {
  const session = await getServerSession(authOptions);
  const platformAdmin = isAdmin(session?.user?.email);

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">Workspace Guide</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              המסלול הקצר ביותר לעבודה נכונה, בטוחה ומהירה בתוך המערכת.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              אם נכנסת לראשונה, אם עובד חדש מצטרף, או אם צריך להתאפס על סדר הפעולות הנכון, זה הדף שמסדר את
              הצעדים בלי עומס ובלי קפיצות מיותרות.
            </p>
          </div>

          <div className="v2-panel p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                <BookOpenCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-black text-[color:var(--v2-ink)]">מה בודקים קודם</p>
                <p className="mt-1 text-sm leading-7 text-[color:var(--v2-muted)]">
                  מנוי פעיל, הגדרות ארגון, משתמשים והרשאות, ורק אחר כך עבודה יומיומית.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                "בדיקת מנוי, חיוב ואמצעי תשלום פעיל.",
                "השלמת פרטי ארגון, כתובת, AI ואינטגרציות.",
                "פתיחת משתמשים והרשאות לפי תפקיד.",
                "מעבר לעבודה שוטפת ב-Inbox, Clients ו-Billing.",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
                  <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <HelpStep
          step="1"
          title="בדיקת מנוי וחיוב"
          description="מוודאים שיש מסלול פעיל, אמצעי תשלום תקין וגישה לכלי העבודה הרלוונטיים."
          primaryHref="/app/billing"
          primaryLabel="פתיחת חיוב"
          secondaryHref="/app/billing?tab=control"
          secondaryLabel="מרכז מנויים"
          icon={<CreditCard className="h-5 w-5" aria-hidden />}
        />
        <HelpStep
          step="2"
          title="השלמת הגדרות הארגון"
          description="מעדכנים פרטי עסק, מס, כתובת, דומיין, AI וחיבורים בסיסיים."
          primaryHref="/app/settings"
          primaryLabel="פתיחת הגדרות"
          secondaryHref="/app/operations"
          secondaryLabel="בדיקת תפעול"
          icon={<Settings className="h-5 w-5" aria-hidden />}
        />
        <HelpStep
          step="3"
          title="ניהול משתמשים והרשאות"
          description="מזמינים משתמשים, בודקים הרשאות, ומוודאים שכל אחד מגיע למסכים שמתאימים לו."
          primaryHref="/app/settings"
          primaryLabel="משתמשים והגדרות"
          secondaryHref={platformAdmin ? "/app/admin" : "/app/inbox"}
          secondaryLabel={platformAdmin ? "Admin" : "מעבר ל-Inbox"}
          icon={<Users className="h-5 w-5" aria-hidden />}
        />
        <HelpStep
          step="4"
          title="מעבר לעבודה שוטפת"
          description="אחרי שהבסיס מוכן, עוברים לתיבת העבודה, CRM, מסמכים, חיוב ותובנות."
          primaryHref="/app/inbox"
          primaryLabel="פתיחת תיבת עבודה"
          secondaryHref="/app/insights"
          secondaryLabel="פתיחת תובנות"
          icon={<Workflow className="h-5 w-5" aria-hidden />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="v2-panel p-6">
          <span className="v2-eyebrow">Quick Rescue</span>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)]">
            אם משהו נתקע, אלו שלושת המקומות שכדאי לפתוח קודם.
          </h2>
          <div className="mt-6 grid gap-3">
            {[
              { href: "/app/billing", label: "בדיקת מנוי, חיוב ותשלומים", icon: CreditCard },
              { href: "/app/settings", label: "בדיקת הגדרות, דומיין ו-AI", icon: Bot },
              { href: "/app/clients", label: "בדיקת לקוחות, צנרת והקשרים", icon: Shield },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 rounded-[24px] border border-[color:var(--v2-line)] bg-white/82 px-5 py-4 transition hover:bg-white"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-canvas)] text-[color:var(--v2-accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1 font-black text-[color:var(--v2-ink)]">{label}</span>
                <ArrowUpRight className="h-4 w-4 text-[color:var(--v2-muted)]" aria-hidden />
              </Link>
            ))}
          </div>
        </div>

        <aside className="v2-panel v2-panel-highlight p-6">
          <p className="text-sm font-black text-[color:var(--v2-ink)]">דברים שחשוב לזכור</p>
          <div className="mt-4 grid gap-3">
            {[
              "העבודה היומיומית מתבצעת תחת /app. אין צורך לחזור למסכי עומק אלא אם יש צורך ספציפי.",
              "Meckano זמין רק למנוי המורשה שהוגדר במערכת.",
              "במקרה של ספק, מתחילים מהמסך הרלוונטי ביותר למשימה ולא מהמערכת הוותיקה שמאחוריו.",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/82 px-4 py-4">
                <p className="text-sm leading-7 text-[color:var(--v2-ink)]">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
