import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isFreeTrialExpired } from "@/lib/trial";
import { Lock, Rocket, LogOut } from "lucide-react";

export default async function TrialExpiredPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const orgId = session.user.organizationId;
  if (!orgId) {
    redirect("/dashboard");
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { subscriptionTier: true, trialEndsAt: true, name: true },
  });

  if (!org || !isFreeTrialExpired(org)) {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center p-4 text-right bg-white/[0.03]"
      dir="rtl"
    >
      <div className="max-w-md w-full rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
          <Lock className="text-red-500" size={40} />
        </div>

        <h1 className="text-3xl font-black text-white/75 mb-4">
          תקופת הניסיון הסתיימה
        </h1>
        <p className="text-white/55 mb-2 font-semibold text-lg">
          {org.name}
        </p>
        <p className="text-white/55 mb-8 leading-relaxed text-sm">
          30 הימים ב־BSD-YBM הגיעו לסיומם. כדי להמשיך בניתוח AI, ניהול פרויקטים ותובנות
          עסקיות, ניתן לשדרג לתוכנית בתשלום.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/billing"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Rocket size={20} /> שדרגו מנוי או רכשו בנדל סריקות
          </Link>

          <Link
            href="/api/auth/signout"
            className="w-full flex items-center justify-center gap-2 text-white/35 font-medium py-2 hover:text-white/55 transition-colors"
          >
            <LogOut size={18} /> התנתקות מהמערכת
          </Link>
        </div>
      </div>
    </div>
  );
}
