import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFreeTrialExpired } from "@/lib/trial";
import { Lock, Rocket, LogOut } from "lucide-react";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";

export default async function AppTrialExpiredPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/app");
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    redirect("/app");
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { subscriptionTier: true, trialEndsAt: true, name: true },
  });

  if (!org || !isFreeTrialExpired(org)) {
    redirect("/app");
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[980px] space-y-8 py-10" dir="rtl">
      <header className="flex flex-col items-center text-center gap-3 px-2">
        <div className="flex h-18 w-18 items-center justify-center rounded-[22px] bg-[color:var(--state-danger-soft)] text-[color:var(--state-danger)] shadow-[var(--tile-shadow)]">
          <Lock size={34} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">Trial Expired</p>
        <h1 className="text-[34px] font-black tracking-tight text-[color:var(--ink-900)]">תקופת הניסיון הסתיימה</h1>
        <p className="text-lg font-semibold text-[color:var(--ink-900)]">{org.name}</p>
        <p className="max-w-2xl text-[14px] leading-6 text-[color:var(--ink-500)]">
          30 הימים ב־BSD-YBM (סריקות AI, ניהול לקוחות ותובנות עסקיות) הגיעו לסיומם. כדי להמשיך, ניתן לשדרג לתוכנית בתשלום.
        </p>
      </header>

      <BentoGrid>
        <Tile tone="rose" span={8}>
          <TileHeader eyebrow="Access" />
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-900)]">
            המערכת נעצרת כרגע לפני מסכי העבודה. שדרוג המסלול יחזיר מיד גישה מלאה ללקוחות, מסמכים, כספים ותובנות AI.
          </p>
          <div className="mt-4">
            <ProgressBar value={100} axis="warning" />
          </div>
        </Tile>

        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="Next Step" />
          <div className="mt-3 flex flex-col gap-3">
            <Link href="/app/billing" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--ink-900)] px-4 py-2 text-sm font-black text-white">
              <Rocket size={18} /> שדרגו מנוי או רכשו בנדל סריקות
            </Link>
            <Link
              href="/api/auth/signout"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--line-strong)] bg-white px-4 py-2 text-sm font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--ink-900)] hover:text-white"
            >
              <LogOut size={18} /> התנתקות מהמערכת
            </Link>
          </div>
        </Tile>
      </BentoGrid>
    </div>
  );
}
