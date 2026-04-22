import Link from "next/link";
import { Bot, CreditCard, FileText, Sparkles, UsersRound, Workflow } from "lucide-react";
import AutomationBuilder from "@/components/automations/AutomationBuilder";

const recipes = [
  {
    title: "תזכורת גבייה אוטומטית",
    body: "בכל פעם שמסמך חיוב הופך ל-overdue, ליצור משימת follow-up ולשלוח תזכורת מסודרת.",
    href: "/app/settings/billing",
    icon: CreditCard,
  },
  {
    title: "סיווג מסמכים חדשים",
    body: "כשמסמך חדש נסרק, לסווג, להציע שיוך ללקוח ולהתריע רק אם חסר מידע מהותי.",
    href: "/app/documents",
    icon: FileText,
  },
  {
    title: "החזרת לידים שנעצרו",
    body: "כשלקוח לא התקדם כמה ימים, לפתוח תזכורת למנהל התיק או טיוטת תגובה ל-AI.",
    href: "/app/clients",
    icon: UsersRound,
  },
];

export default function AutomationsPageContent() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-8" dir="rtl">
      <section className="tile tile--lavender p-6 sm:p-8">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">Automation Center</span>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--ink-900)] sm:text-5xl">
          אוטומציות, תסריטים והנחיות עבודה במקום אחד
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--ink-500)] sm:text-lg">
          המסך הזה מרכז את בניית הזרימות האוטומטיות סביב מסמכים, חיוב, לקוחות ופעולות AI, בלי ללכת לאיבוד בין חלונות.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "מוקדי אוטומציה", value: "מסמכים, חיוב, לקוחות", icon: Workflow },
            { label: "AI בתוך הזרימה", value: "טיוטות, תזכורות, סיווג", icon: Bot },
            { label: "דרך עבודה", value: "מרכזי ולא מפוזר", icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="tile p-5">
              <Icon className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
              <p className="mt-4 text-sm font-bold text-[color:var(--ink-500)]">{label}</p>
              <p className="mt-2 text-xl font-black text-[color:var(--ink-900)]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="tile p-6">
          <AutomationBuilder />
        </div>

        <aside className="grid gap-4">
          <div className="tile p-6">
            <h2 className="text-xl font-black text-[color:var(--ink-900)]">תסריטים מומלצים</h2>
            <div className="mt-4 grid gap-3">
              {recipes.map((recipe) => (
                <article key={recipe.title} className="rounded-2xl bg-[color:var(--canvas-sunken)] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <recipe.icon className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
                    <p className="font-black text-[color:var(--ink-900)]">{recipe.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--ink-500)]">{recipe.body}</p>
                  <Link href={recipe.href} className="mt-4 inline-flex text-sm font-black text-[color:var(--axis-clients)]">
                    לפתוח את האזור הרלוונטי
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div className="tile p-6">
            <h2 className="text-xl font-black text-[color:var(--ink-900)]">מה כדאי לבנות ראשון</h2>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[color:var(--ink-500)]">
              <p>1. להתחיל מאוטומציות שמונעות פספוסי גבייה או מסמכים שלא סווגו.</p>
              <p>2. אחר כך לחבר אוטומציות follow-up ללקוחות עם הצעות טיוטה של AI.</p>
              <p>3. רק בסוף להוסיף זרימות מורכבות ורוחביות בין כמה אזורים.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
