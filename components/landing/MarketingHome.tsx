import Link from "next/link";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  FileText,
  Layers,
  Network,
  Puzzle,
  Settings2,
} from "lucide-react";

/**
 * דף בית שיווקי (עברית) — «BSD-YBM פתרונות AI» והשדרה המודולרית.
 * Server Component — ללא מצב לקוח.
 */
export default function MarketingHome() {
  return (
    <div
      className="min-h-screen bg-slate-950 font-sans text-slate-50 selection:bg-brand selection:text-white"
      dir="rtl"
    >
      <header className="container relative z-20 mx-auto flex items-center justify-between border-b border-slate-800/80 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-brand text-xl font-bold shadow-lg shadow-brand/20">
            B
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            BSD-YBM <span className="font-light text-slate-300">פתרונות AI</span>
          </span>
        </div>

        <nav className="hidden gap-8 text-sm font-medium text-slate-300 md:flex">
          <a href="#modularity" className="transition-colors hover:text-white">
            התאמה אישית
          </a>
          <a href="#features" className="transition-colors hover:text-white">
            יכולות המערכת
          </a>
          <Link href="/pricing" className="transition-colors hover:text-white">
            תמחור
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block"
          >
            כניסת רשומים
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark"
          >
            הצטרפות לארגון
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pb-20 pt-24 md:pb-28 md:pt-32">
          <div className="pointer-events-none absolute start-1/2 top-0 h-[400px] w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />

          <div className="container relative z-10 mx-auto px-6 text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-brand-light">
              <Settings2 size={16} aria-hidden />
              מערכת אדפטיבית לכל מקצועות הבנייה
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              השדרה שמחברת <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">
                בין כולם
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
              BSD-YBM פתרונות AI היא הליבה החכמה של העסק שלך. פלטפורמה מודולרית שמשנה את פניה בהתאם לתחום ההתמחות
              שלך, ומחברת את כל קצוות המידע למקור אמת אחד.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-4 text-lg font-medium text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark"
              >
                הגדר את סביבת העבודה שלך
                <ChevronLeft className="transition-transform group-hover:-translate-x-1" size={20} aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section id="modularity" className="border-y border-slate-900 bg-slate-900/30 py-20">
          <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">מערכת אחת, אינסוף אפשרויות</h2>
              <p className="text-lg leading-relaxed text-slate-400">
                אנחנו יודעים שניהול פרויקט חשמל אינו דומה לניהול שלד או גמר. לכן, פיתחנו את &quot;השדרה&quot; – מנוע חכם
                שמתאים את ה-ERP וה-CRM בדיוק לצרכים המקצועיים שלך. המערכת מסתגלת אוטומטית לפי הגדרות המנוי ומציפה רק
                את הכלים שחשובים למקצוע שלך.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
                <Puzzle className="mb-3 text-brand" size={32} aria-hidden />
                <span className="text-sm font-bold">גמישות מלאה</span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
                <Layers className="mb-3 text-blue-400" size={32} aria-hidden />
                <span className="text-sm font-bold">מבנה מודולרי</span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
                <Settings2 className="mb-3 text-emerald-400" size={32} aria-hidden />
                <span className="text-sm font-bold">התאמה מקצועית</span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
                <Network className="mb-3 text-purple-400" size={32} aria-hidden />
                <span className="text-sm font-bold">סנכרון רב-תחומי</span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
              <div className="group relative col-span-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 transition-colors hover:border-brand/40 md:col-span-2">
                <FileText className="mb-6 text-brand" size={40} aria-hidden />
                <h3 className="mb-3 text-2xl font-bold text-white">סורק מסמכים אדפטיבי</h3>
                <p className="max-w-md leading-relaxed text-slate-400">
                  מנוע ה-AI שלנו לומד את סוגי החשבוניות והמסמכים הייחודיים לתת-התחום שלך, ומחלץ נתונים ברמת דיוק
                  הנדסית.
                </p>
              </div>
              <div className="group rounded-3xl border border-slate-800 bg-slate-900 p-8 transition-colors hover:border-purple-500/40">
                <Bot className="mb-6 text-purple-400" size={40} aria-hidden />
                <h3 className="mb-3 text-xl font-bold text-white">מחברת פרויקט חכמה</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  שיחה חופשית מול הנתונים שלך. ה-AI מכיר את המונחים המקצועיים של ענף הבנייה ועונה לשאלות מורכבות על
                  תקציב וביצוע.
                </p>
              </div>
              <div className="group col-span-1 rounded-3xl border border-slate-800 bg-slate-900 p-8 transition-colors hover:border-blue-500/40 md:col-span-3">
                <div className="flex flex-col items-center gap-8 md:flex-row">
                  <BarChart3 className="shrink-0 text-blue-400" size={64} aria-hidden />
                  <div className="flex-1">
                    <h3 className="mb-3 text-2xl font-bold text-white">דשבורד מנהלים בהתאמה אישית</h3>
                    <p className="leading-relaxed text-slate-400">
                      כל מנוי מקבל תצוגה שונה. המערכת בונה עבורך את המדדים (KPIs) שרלוונטיים רק לעסק שלך, כדי שתוכל
                      לנהל את תזרים המזומנים והפרויקטים בלי &quot;רעש&quot; מיותר.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="font-bold tracking-wide text-white">BSD-YBM פתרונות AI</span>
        </div>
        <p className="mb-4 font-medium text-brand-light">השדרה שמחברת בין כולם.</p>
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
