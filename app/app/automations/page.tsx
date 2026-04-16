import Link from "next/link";
import { Bot, CreditCard, FileText, Sparkles, UsersRound, Workflow } from "lucide-react";
import AutomationBuilder from "@/components/automations/AutomationBuilder";

const recipes = [
  {
    title: "תזכורת גבייה אוטומטית",
    body: "בכל פעם שמסמך חיוב הופך ל-overdue, ליצור משימת follow-up ולשלוח תזכורת מסודרת.",
    href: "/app/billing",
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

export default function AppAutomationsPage() {
  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft p-6 sm:p-8">
        <span className="v2-eyebrow">Automation Center</span>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
          אוטומציות, תסריטים והנחיות עבודה במקום אחד
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
          המסך הזה מרכז את בניית הזרימות האוטומטיות סביב מסמכים, חיוב, לקוחות ופעולות AI, בלי ללכת לאיבוד בין חלונות.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "מוקדי אוטומציה", value: "מסמכים, חיוב, לקוחות", icon: Workflow },
            { label: "AI בתוך הזרימה", value: "טיוטות, תזכורות, סיווג", icon: Bot },
            { label: "דרך עבודה", value: "מרכזי ולא מפוזר", icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="v2-panel p-5">
              <Icon className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
              <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
              <p className="mt-2 text-xl font-black text-[color:var(--v2-ink)]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="v2-panel p-6">
          <AutomationBuilder />
        </div>

        <aside className="grid gap-4">
          <div className="v2-panel p-6">
            <h2 className="text-xl font-black text-[color:var(--v2-ink)]">תסריטים מומלצים</h2>
            <div className="mt-4 grid gap-3">
              {recipes.map((recipe) => (
                <article key={recipe.title} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <recipe.icon className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                    <p className="font-black text-[color:var(--v2-ink)]">{recipe.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">{recipe.body}</p>
                  <Link href={recipe.href} className="mt-4 inline-flex text-sm font-black text-[color:var(--v2-accent)]">
                    לפתוח את האזור הרלוונטי
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div className="v2-panel p-6">
            <h2 className="text-xl font-black text-[color:var(--v2-ink)]">מה כדאי לבנות ראשון</h2>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[color:var(--v2-muted)]">
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
