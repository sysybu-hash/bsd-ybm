import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import MeckanoHub from "@/components/meckano/MeckanoHub";
import { authOptions } from "@/lib/auth";
import { canAccessMeckano } from "@/lib/meckano-access";
import { prisma } from "@/lib/prisma";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";

export const dynamic = "force-dynamic";
export const metadata = { title: "מקאנו | BSD-YBM" };

export default async function OperationsMeckanoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!(await canAccessMeckano(session))) redirect("/app/operations");

  const orgId = session.user.organizationId;
  let hasMeckanoKey = false;

  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { meckanoApiKey: true },
    });
    hasMeckanoKey = Boolean(org?.meckanoApiKey);
  }

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      <header className="flex flex-col gap-1 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">Meckano</p>
        <h1 className="text-[32px] font-black tracking-tight text-[color:var(--ink-900)] sm:text-[38px]">מרכז מקאנו</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[color:var(--ink-500)]">
          ניהול סנכרון עובדים, מחלקות, נוכחות ונתוני שטח דרך החיבור הארגוני למקאנו.
        </p>
      </header>
      <BentoGrid>
        <Tile tone={hasMeckanoKey ? "clients" : "rose"} span={8}>
          <TileHeader eyebrow="Sync Readiness" />
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-700)]">
            {hasMeckanoKey
              ? "מפתח ה-API מחובר. אפשר להמשיך לניהול עובדים, מחלקות ואזורי עבודה."
              : "אין עדיין מפתח API שמור למקאנו. יש להשלים חיבור לפני שממשיכים."}
          </p>
          <div className="mt-4">
            <ProgressBar value={hasMeckanoKey ? 100 : 20} axis={hasMeckanoKey ? "clients" : "warning"} />
          </div>
        </Tile>
        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="API Key" />
          <p className="mt-3 text-sm font-black text-[color:var(--ink-900)]">
            {hasMeckanoKey ? "מחובר" : "חסר"}
          </p>
        </Tile>
      </BentoGrid>
      <MeckanoHub hasMeckanoKey={hasMeckanoKey} />
    </div>
  );
}
