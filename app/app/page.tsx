import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CreditCard, FileText, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import { buildAppNavCollection } from "@/components/app-shell/app-nav";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  const [organization, clientsCount, documentsCount, invoicesSum] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        industry: true,
        constructionTrade: true,
        industryConfigJson: true,
      },
    }),
    prisma.contact.count({ where: { organizationId } }),
    prisma.document.count({ where: { organizationId } }),
    prisma.issuedDocument.aggregate({
      where: { organizationId, type: "INVOICE" },
      _sum: { total: true },
    }),
  ]);
  const industryProfile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
  );

  const stats = [
    { label: industryProfile.clientsLabel, value: clientsCount.toString(), icon: UsersRound },
    { label: industryProfile.documentsLabel, value: documentsCount.toString(), icon: FileText },
    {
      label: "מחזור חיוב",
      value: formatCurrencyILS(invoicesSum._sum.total ?? 0),
      icon: CreditCard,
    },
  ];

  const quickLinks = buildAppNavCollection(industryProfile).primary.filter((item) => item.href !== "/app");

  return (
    <div className="grid gap-5" dir="rtl">
      <section className="v2-panel v2-panel-soft p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="v2-eyebrow">Workspace Home</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-4xl">
              {industryProfile.homeTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--v2-muted)]">
              {industryProfile.homeDescription}
            </p>
          </div>

          <Link href="/app/advanced" className="v2-button v2-button-secondary self-start lg:self-auto">
            כלים מתקדמים
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-[color:var(--v2-line)] bg-white/92 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[color:var(--v2-muted)]">{label}</p>
                  <p className="mt-1 truncate text-xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">
                    {value}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="v2-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="v2-eyebrow">קיצורי דרך</span>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)]">
              מעבר ישיר לאזור העבודה הבא.
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/88 px-4 py-4 transition hover:bg-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--v2-canvas)] text-[color:var(--v2-accent)]">
                <item.icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black text-[color:var(--v2-ink)]">{item.label}</p>
                <p className="mt-1 truncate text-sm text-[color:var(--v2-muted)]">{item.summary}</p>
              </div>
              <ArrowLeft className="h-4 w-4 shrink-0 text-[color:var(--v2-muted)]" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="v2-panel p-6">
          <span className="v2-eyebrow">Next Layer</span>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.05em] text-[color:var(--v2-ink)]">
            חמישה מוקדים שמיישרים את כל האתר
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              { href: "/app/onboarding", label: "Onboarding חכם", summary: "מסלול הגדרה ברור לפי מצב הארגון, המקצוע והמנוי." },
              { href: "/app/automations", label: "Automation Center", summary: "תסריטים ואוטומציות למסמכים, חיוב, לקוחות ו-AI." },
              { href: "/app/portal", label: "Client Portal", summary: "שליטה בדומיין, מיתוג ותוכן חיצוני ללקוחות." },
              { href: "/app/admin", label: "Health + Audit", summary: "בריאות מערכת ויומן פעולות למסכי הניהול." },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-[color:var(--v2-line)] bg-white/88 px-4 py-4 transition hover:bg-white">
                <p className="font-black text-[color:var(--v2-ink)]">{item.label}</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{item.summary}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="v2-panel v2-panel-highlight p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <p className="text-lg font-black text-[color:var(--v2-ink)]">מה נוסף עכשיו</p>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              { icon: Sparkles, text: "Onboarding שמפחית בלבול ומחלק את ההגדרות לצעדים ברורים." },
              { icon: CreditCard, text: "ניהול מנויים מחובר עכשיו לעבודה היומיומית ולא רק למסך צדדי." },
              { icon: FileText, text: "Portal שמרכז מה הלקוח רואה, איזה מסמכים זמינים ואיך משתפים אותם." },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-2xl bg-white/82 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                  <p className="text-sm font-semibold leading-7 text-[color:var(--v2-ink)]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
