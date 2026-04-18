import Link from "next/link";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { buildAppAdvancedItems } from "@/components/app-shell/app-nav";
import { authOptions } from "@/lib/auth";
import { canAccessMeckano } from "@/lib/meckano-access";
import { COOKIE_LOCALE, isRtlLocale, normalizeLocale } from "@/lib/i18n/config";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";

export default async function AppAdvancedPage() {
  const session = await getServerSession(authOptions);
  const hasMeckanoAccess = await canAccessMeckano(session);
  const messages = await readRequestMessages();
  const t = createTranslator(messages);
  const jar = await cookies();
  const uiLocale = normalizeLocale(jar.get(COOKIE_LOCALE)?.value);
  const pageDir = isRtlLocale(uiLocale) ? "rtl" : "ltr";

  const allItems = buildAppAdvancedItems(t);
  const visibleItems = hasMeckanoAccess ? allItems : allItems.filter((item) => !item.requiresMeckano);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6" dir={pageDir}>
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          {t("workspaceNav.advancedPage.kicker")}
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          {t("workspaceNav.advancedPage.title")}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-500 sm:text-base">
          {t("workspaceNav.advancedPage.subtitle")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white">
            {t("workspaceNav.advancedPage.backCta")}
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
