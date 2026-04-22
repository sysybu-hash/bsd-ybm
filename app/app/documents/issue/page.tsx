export { metadata } from "@/app/dashboard/(protected)/erp/invoice/InvoiceIssuePageContent";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LegacyInvoiceIssuePage from "@/app/dashboard/(protected)/erp/invoice/InvoiceIssuePageContent";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";
import { BentoGrid, Tile, TileHeader } from "@/components/ui/bento";

export default async function AppIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; contactId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      industry: true,
      constructionTrade: true,
      industryConfigJson: true,
    },
  });

  const messages = await readRequestMessages();
  const profile = getIndustryProfile(
    organization?.industry ?? "CONSTRUCTION",
    organization?.industryConfigJson,
    organization?.constructionTrade,
    messages,
  );

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">Issue Workspace</p>
        <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">
          הנפקה לפי {profile.industryLabel}
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          לפני ההנפקה אפשר לראות אילו מסמכים ואישורים מוגדרים למקצוע הפעיל, וליצור את המסמך המתאים מתוך אותה שפה מקצועית.
        </p>
      </header>

      <BentoGrid>
        {profile.templates.slice(0, 4).map((template) => (
          <Tile key={template.id} tone="clients" span={3}>
            <TileHeader eyebrow={template.kind} />
            <p className="mt-2 text-sm font-black text-[color:var(--ink-900)]">{template.label}</p>
            <p className="mt-2 text-[12px] leading-6 text-[color:var(--ink-500)]">{template.description}</p>
          </Tile>
        ))}
      </BentoGrid>

      <LegacyInvoiceIssuePage searchParams={searchParams} />
    </div>
  );
}
