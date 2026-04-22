import Link from "next/link";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { ArrowLeft, Sparkles } from "lucide-react";
import { buildAppAdvancedItems } from "@/components/app-shell/app-nav";
import { authOptions } from "@/lib/auth";
import { canAccessMeckano } from "@/lib/meckano-access";
import { COOKIE_LOCALE, isRtlLocale, normalizeLocale } from "@/lib/i18n/config";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { BentoGrid, Tile, TileHeader } from "@/components/ui/bento";

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
    <div className="w-full min-w-0 space-y-8" dir={pageDir}>
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          {t("workspaceNav.advancedPage.kicker")}
        </p>
        <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">
          {t("workspaceNav.advancedPage.title")}
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          {t("workspaceNav.advancedPage.subtitle")}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link href="/app" className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--ink-900)] px-4 py-2 text-sm font-black text-white">
          {t("workspaceNav.advancedPage.backCta")}
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <BentoGrid>
        {visibleItems.map((item) => (
          <Tile key={item.href} tone={item.id === "ai" ? "ai" : "neutral"} span={4} href={item.href} ariaLabel={item.title}>
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.id === "ai" ? "bg-white/10 text-white" : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-700)]"}`}>
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className={`text-[15px] font-black ${item.id === "ai" ? "text-white" : "text-[color:var(--ink-900)]"}`}>{item.title}</p>
                <p className={`mt-1 text-[13px] leading-6 ${item.id === "ai" ? "text-white/80" : "text-[color:var(--ink-500)]"}`}>{item.body}</p>
              </div>
            </div>
            {item.id === "ai" ? (
              <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/85">
                <Sparkles className="h-3 w-3" aria-hidden />
                AI Ready
              </div>
            ) : null}
          </Tile>
        ))}
      </BentoGrid>
    </div>
  );
}
