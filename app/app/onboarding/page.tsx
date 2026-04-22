import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BadgeCheck, Building2, CreditCard, FileText, Globe, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";

export const dynamic = "force-dynamic";

export default async function AppOnboardingPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const [organization, integrationCount, documentCount, issuedCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        taxId: true,
        address: true,
        industry: true,
        constructionTrade: true,
        industryConfigJson: true,
        tenantPublicDomain: true,
        paypalMerchantEmail: true,
        paypalMeSlug: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    }),
    prisma.cloudIntegration.count({ where: { organizationId } }),
    prisma.document.count({ where: { organizationId } }),
    prisma.issuedDocument.count({ where: { organizationId } }),
  ]);

  if (!organization) {
    redirect("/login");
  }

  const messages = await readRequestMessages();
  const profile = getIndustryProfile(
    organization.industry,
    organization.industryConfigJson,
    organization.constructionTrade,
    messages,
  );
  const steps = [
    {
      title: "ארגון וזהות עסקית",
      done: Boolean(organization.taxId && organization.address),
      body: "שם ארגון, ח.פ/ע.מ וכתובת מסודרת הם הבסיס למסמכים, חיוב והרשאות.",
      href: "/app/settings?tab=organization",
      cta: "לפרטי הארגון",
      icon: Building2,
    },
    {
      title: "התמחות בענף ו-AI",
      done: organization.constructionTrade !== "GENERAL_CONTRACTOR",
      body: `התאמת ${profile.constructionTradeLabel ?? profile.industryLabel} קובעת סוגי פענוח ותוצאות AI.`,
      href: "/app/settings?tab=profession",
      cta: "להתאמה מקצועית",
      icon: Sparkles,
    },
    {
      title: "פורטל, דומיין ותשלומים",
      done: Boolean(organization.tenantPublicDomain || organization.paypalMerchantEmail || organization.paypalMeSlug),
      body: "כאן מחברים את הלקוחות לעולם החיצוני: דומיין, מיתוג, ויכולת לשלם או לקבל מסמכים.",
      href: "/app/portal",
      cta: "לפורטל הלקוחות",
      icon: Globe,
    },
    {
      title: "מנוי ומכסות עבודה",
      done: organization.subscriptionStatus === "ACTIVE",
      body: "בדיקה שהמסלול, הסטטוס והמכסות שלך מתאימים לקצב העבודה בפועל.",
      href: "/app/billing",
      cta: "למרכז המנוי",
      icon: CreditCard,
    },
    {
      title: "מסמכים והנפקה ראשונה",
      done: documentCount > 0 || issuedCount > 0,
      body: "רגע שמוודא שהמערכת באמת התחילה לעבוד: סריקה, פענוח או הנפקת מסמך ראשון.",
      href: "/app/documents",
      cta: "לחלון המסמכים",
      icon: FileText,
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="flex w-full min-w-0 flex-col gap-8" dir="rtl">
      <section className="tile tile--soft p-6 sm:p-8">
        <span className="bento-eyebrow">Smart Onboarding</span>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--ink-900)] sm:text-5xl">
          מסלול התארגנות ברור עבור {organization.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--ink-500)] sm:text-lg">
          במקום לנחש מה צריך להגדיר קודם, המסך הזה מסדר את הצעדים הנכונים לפי מצב הארגון, המקצוע וההטמעה בפועל.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="tile p-5">
            <p className="text-sm font-bold text-[color:var(--ink-500)]">התקדמות הקמה</p>
            <p className="mt-2 text-3xl font-black text-[color:var(--ink-900)]">{progress}%</p>
          </div>
          <div className="tile p-5">
            <p className="text-sm font-bold text-[color:var(--ink-500)]">חיבורים פעילים</p>
            <p className="mt-2 text-3xl font-black text-[color:var(--ink-900)]">{integrationCount}</p>
          </div>
          <div className="tile p-5">
            <p className="text-sm font-bold text-[color:var(--ink-500)]">מסמכים שכבר עובדים</p>
            <p className="mt-2 text-3xl font-black text-[color:var(--ink-900)]">{documentCount + issuedCount}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {steps.map((step) => (
          <article key={step.title} className="tile p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients)]">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-xl font-black text-[color:var(--ink-900)]">{step.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--ink-500)]">{step.body}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  step.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {step.done ? "מוכן" : "דורש השלמה"}
              </span>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--ink-500)]">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                {step.done ? "השלב הזה כבר הוגדר" : "מומלץ לטפל בזה עכשיו"}
              </div>
              <Link href={step.href} className="bento-btn bento-btn--secondary">
                {step.cta}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
