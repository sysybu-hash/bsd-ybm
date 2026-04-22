import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ExternalLink, FileText, Globe, ImageIcon, Sparkles, UsersRound } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/ui-formatters";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { createTranslator } from "@/lib/i18n/translate";
import { BentoGrid, ProgressBar, Tile, TileHeader, TileLink } from "@/components/ui/bento";

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

  const messages = await readRequestMessages();
  const t = createTranslator(messages);

  const branding =
    typeof organization.tenantSiteBrandingJson === "object" &&
    organization.tenantSiteBrandingJson &&
    !Array.isArray(organization.tenantSiteBrandingJson)
      ? (organization.tenantSiteBrandingJson as Record<string, unknown>)
      : {};

  const publicUrl = organization.tenantPublicDomain ? `https://${organization.tenantPublicDomain}` : null;
  const readiness =
    [organization.tenantPublicDomain, organization.paypalMerchantEmail || organization.paypalMeSlug, branding.landingTitle, branding.tagline]
      .filter(Boolean).length * 25;

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          {t("workspacePortal.eyebrow")}
        </p>
        <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">
          הפורטל החיצוני של {organization.name}
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          כאן רואים איך הלקוחות פוגשים את הארגון מחוץ למערכת: דומיין, מיתוג, מסמכים ותשתית שיתוף.
        </p>
      </header>

      <BentoGrid>
        <Tile tone="clients" span={8}>
          <TileHeader
            eyebrow="Portal Readiness"
            action={<TileLink href="/app/settings/presence" label="לנוכחות דיגיטלית" tone="clients" />}
          />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--axis-clients-ink)]/80">מוכנות פורטל</p>
              <p className="tile-hero-value text-[color:var(--axis-clients-ink)]">{readiness}%</p>
            </div>
            <div className="hidden flex-1 sm:block">
              <ProgressBar value={readiness} axis="clients" glow />
            </div>
          </div>
        </Tile>

        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="Status" />
          <div className="mt-3 grid gap-3">
            <div className="flex items-center justify-between rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2">
              <span className="text-[12px] font-bold text-[color:var(--ink-500)]">דומיין</span>
              <span className="text-sm font-black text-[color:var(--ink-900)]">{organization.tenantPublicDomain ?? "לא הוגדר"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[color:var(--canvas-sunken)] px-3 py-2">
              <span className="text-[12px] font-bold text-[color:var(--ink-500)]">שכבת תשלום</span>
              <span className={`text-sm font-black ${organization.paypalMerchantEmail || organization.paypalMeSlug ? "text-[color:var(--state-success)]" : "text-[color:var(--state-warning)]"}`}>
                {organization.paypalMerchantEmail || organization.paypalMeSlug ? "מחוברת" : "דורשת חיבור"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/app/settings/presence" className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--axis-clients)] px-3 py-2 text-[12px] font-bold text-white hover:bg-[color:var(--axis-clients-strong)]">
                להגדיר פורטל ומיתוג
              </Link>
              {publicUrl ? (
                <Link href={publicUrl} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2 text-[12px] font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white" target="_blank">
                  פתיחת הפורטל
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
        </Tile>

        <Tile tone="neutral" span={6}>
          <TileHeader eyebrow="מיתוג וחשיפה" />
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg bg-[color:var(--canvas-sunken)] px-4 py-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[color:var(--axis-clients)]" aria-hidden />
                <p className="text-sm font-bold text-[color:var(--ink-500)]">כותרת דף נחיתה</p>
              </div>
              <p className="mt-2 font-black text-[color:var(--ink-900)]">
                {typeof branding.landingTitle === "string" && branding.landingTitle.trim() ? branding.landingTitle : "עדיין לא הוגדרה"}
              </p>
            </div>
            <div className="rounded-lg bg-[color:var(--canvas-sunken)] px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[color:var(--axis-ai)]" aria-hidden />
                <p className="text-sm font-bold text-[color:var(--ink-500)]">סלוגן</p>
              </div>
              <p className="mt-2 font-black text-[color:var(--ink-900)]">
                {typeof branding.tagline === "string" && branding.tagline.trim() ? branding.tagline : "עדיין לא הוגדר"}
              </p>
            </div>
          </div>
        </Tile>

        <Tile tone="neutral" span={6}>
          <TileHeader eyebrow="מסמכים ללקוח" />
          <div className="mt-4 grid gap-3">
            {issuedDocuments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
                עדיין אין מסמכים מונפקים להצגה ללקוחות.
              </div>
            ) : (
              issuedDocuments.map((document) => (
                <div key={document.id} className="rounded-lg bg-[color:var(--canvas-sunken)] px-4 py-4">
                  <p className="font-black text-[color:var(--ink-900)]">{document.clientName}</p>
                  <p className="mt-1 text-sm text-[color:var(--ink-500)]">
                    {document.type} · {document.status} · {formatShortDate(document.date.toISOString())}
                  </p>
                </div>
              ))
            )}
          </div>
        </Tile>

        <Tile tone="neutral" span={12}>
          <TileHeader eyebrow="קליטת מסמכים אחרונה" />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentScanned.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[color:var(--line-strong)] px-4 py-6 text-center text-sm text-[color:var(--ink-500)]">
                עדיין לא נקלטו מסמכים לפורטל או לארגון.
              </div>
            ) : (
              recentScanned.map((document) => (
                <div key={document.id} className="rounded-lg bg-[color:var(--canvas-sunken)] px-4 py-4">
                  <p className="font-black text-[color:var(--ink-900)]">{document.fileName}</p>
                  <p className="mt-1 text-sm text-[color:var(--ink-500)]">{formatShortDate(document.createdAt.toISOString())}</p>
                </div>
              ))
            )}
          </div>
        </Tile>
      </BentoGrid>
    </div>
  );
}
