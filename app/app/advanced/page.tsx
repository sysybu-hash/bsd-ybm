import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { appAdvancedItems } from "@/components/app-shell/app-nav";
import { authOptions } from "@/lib/auth";
import { canAccessMeckano } from "@/lib/meckano-access";

export default async function AppAdvancedPage() {
  const session = await getServerSession(authOptions);
  const hasMeckanoAccess = await canAccessMeckano(session);
  const visibleItems = hasMeckanoAccess
    ? appAdvancedItems
    : appAdvancedItems.filter((item) => !item.requiresMeckano);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6" dir="rtl">
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Advanced Tools
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          כלי העומק של BSD-YBM מרוכזים כאן בצורה מסודרת, בלי להעמיס על סביבת העבודה היומיומית.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-500 sm:text-base">
          ברירת המחדל של המערכת היא סביבת <code>/app</code>, אבל כשצריך שליטה עמוקה יותר, ניתוח מתקדם או כלי
          מומחה, כל אזורי העומק זמינים כאן במרחב ברור ומרוכז.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white">
            חזרה ל-Workspace v2
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <item.icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-black text-slate-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">{item.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
