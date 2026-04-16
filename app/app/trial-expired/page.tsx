import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFreeTrialExpired } from "@/lib/trial";
import { Lock, Rocket, LogOut } from "lucide-react";

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
    <div
      className="min-h-[70vh] flex items-center justify-center p-4 text-right bg-[color:var(--v2-canvas)]"
      dir="rtl"
    >
      <div className="v2-panel max-w-md w-full p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
          <Lock className="text-red-500" size={40} />
        </div>

        <h1 className="text-3xl font-black text-[color:var(--v2-ink)] mb-4">תקופת הניסיון הסתיימה</h1>
        <p className="text-[color:var(--v2-ink)] mb-2 font-semibold text-lg">{org.name}</p>
        <p className="text-[color:var(--v2-muted)] mb-8 leading-relaxed text-sm">
          30 הימים ב־BSD-YBM (סריקות AI, ניהול לקוחות ותובנות עסקיות) הגיעו לסיומם. כדי להמשיך, ניתן לשדרג לתוכנית בתשלום.
        </p>

        <div className="space-y-4">
          <Link href="/app/billing" className="v2-button v2-button-primary flex w-full items-center justify-center gap-2 py-4 font-bold">
            <Rocket size={20} /> שדרגו מנוי או רכשו בנדל סריקות
          </Link>

          <Link
            href="/api/auth/signout"
            className="w-full flex items-center justify-center gap-2 text-[color:var(--v2-muted)] font-medium py-2 hover:text-[color:var(--v2-ink)] transition-colors"
          >
            <LogOut size={18} /> התנתקות מהמערכת
          </Link>
        </div>
      </div>
    </div>
  );
}
