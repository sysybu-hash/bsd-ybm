import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ExternalLink, FileText, Globe, ImageIcon, Sparkles, UsersRound } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/ui-formatters";

export const dynamic = "force-dynamic";

export default async function AppPortalPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const [organization, issuedDocuments, recentScanned] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        tenantPublicDomain: true,
        tenantSiteBrandingJson: true,
        paypalMerchantEmail: true,
        paypalMeSlug: true,
      },
    }),
    prisma.issuedDocument.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        clientName: true,
        type: true,
        status: true,
        date: true,
      },
    }),
    prisma.document.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        fileName: true,
        createdAt: true,
      },
    }),
  ]);

  if (!organization) {
    redirect("/login");
  }

  const branding =
    typeof organization.tenantSiteBrandingJson === "object" &&
    organization.tenantSiteBrandingJson &&
    !Array.isArray(organization.tenantSiteBrandingJson)
      ? (organization.tenantSiteBrandingJson as Record<string, unknown>)
      : {};

  const publicUrl = organization.tenantPublicDomain ? `https://${organization.tenantPublicDomain}` : null;

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft p-6 sm:p-8">
        <span className="v2-eyebrow">Client Portal</span>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
          הפורטל החיצוני של {organization.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
          כאן רואים איך הלקוחות פוגשים את הארגון מחוץ למערכת: דומיין, מיתוג, מסמכים ותשתית שיתוף.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="v2-panel p-5">
            <Globe className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">דומיין ציבורי</p>
            <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">
              {organization.tenantPublicDomain ?? "לא הוגדר"}
            </p>
          </div>
          <div className="v2-panel p-5">
            <UsersRound className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">מסמכים מונפקים אחרונים</p>
            <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">{issuedDocuments.length}</p>
          </div>
          <div className="v2-panel p-5">
            <Sparkles className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">שכבת תשלום</p>
            <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">
              {organization.paypalMerchantEmail || organization.paypalMeSlug ? "מחוברת" : "דורשת חיבור"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/settings?tab=portal" className="v2-button v2-button-primary">
            להגדיר פורטל ומיתוג
          </Link>
          {publicUrl ? (
            <Link href={publicUrl} className="v2-button v2-button-secondary" target="_blank">
              פתיחת הפורטל
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="v2-panel p-6">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <h2 className="text-xl font-black text-[color:var(--v2-ink)]">מיתוג וחשיפה</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
              <p className="text-sm font-bold text-[color:var(--v2-muted)]">כותרת דף נחיתה</p>
              <p className="mt-2 font-black text-[color:var(--v2-ink)]">
                {typeof branding.landingTitle === "string" && branding.landingTitle.trim() ? branding.landingTitle : "עדיין לא הוגדרה"}
              </p>
            </div>
            <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
              <p className="text-sm font-bold text-[color:var(--v2-muted)]">סלוגן</p>
              <p className="mt-2 font-black text-[color:var(--v2-ink)]">
                {typeof branding.tagline === "string" && branding.tagline.trim() ? branding.tagline : "עדיין לא הוגדר"}
              </p>
            </div>
          </div>
        </div>

        <div className="v2-panel p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
            <h2 className="text-xl font-black text-[color:var(--v2-ink)]">תוכן שזמין ללקוח</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {issuedDocuments.map((document) => (
              <div key={document.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                <p className="font-black text-[color:var(--v2-ink)]">{document.clientName}</p>
                <p className="mt-1 text-sm text-[color:var(--v2-muted)]">
                  {document.type} · {document.status} · {formatShortDate(document.date.toISOString())}
                </p>
              </div>
            ))}
            {issuedDocuments.length === 0 ? (
              <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                עדיין אין מסמכים מונפקים להצגה ללקוחות.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="v2-panel p-6">
        <h2 className="text-xl font-black text-[color:var(--v2-ink)]">קליטת מסמכים אחרונה</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recentScanned.map((document) => (
            <div key={document.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
              <p className="font-black text-[color:var(--v2-ink)]">{document.fileName}</p>
              <p className="mt-1 text-sm text-[color:var(--v2-muted)]">{formatShortDate(document.createdAt.toISOString())}</p>
            </div>
          ))}
          {recentScanned.length === 0 ? (
            <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
              עדיין לא נקלטו מסמכים לפורטל או לארגון.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
