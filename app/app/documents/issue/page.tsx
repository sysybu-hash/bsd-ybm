export { metadata } from "@/app/dashboard/(protected)/erp/invoice/InvoiceIssuePageContent";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LegacyInvoiceIssuePage from "@/app/dashboard/(protected)/erp/invoice/InvoiceIssuePageContent";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRequestMessages } from "@/lib/i18n/server-messages";
import { getIndustryProfile } from "@/lib/professions/runtime";

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
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft p-6 sm:p-8">
        <span className="v2-eyebrow">Issue Workspace</span>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
          הנפקה לפי {profile.industryLabel}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
          לפני ההנפקה אפשר לראות אילו מסמכים ואישורים מוגדרים למקצוע הפעיל, וליצור את המסמך המתאים
          מתוך אותה שפה מקצועית שמוגדרת בארגון.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {profile.templates.map((template) => (
            <div key={template.id} className="rounded-2xl border border-[color:var(--v2-line)] bg-white/88 px-4 py-4">
              <p className="font-black text-[color:var(--v2-ink)]">{template.label}</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--v2-muted)]">{template.description}</p>
            </div>
          ))}
        </div>
      </section>

      <LegacyInvoiceIssuePage searchParams={searchParams} />
    </div>
  );
}
