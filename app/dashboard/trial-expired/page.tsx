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
      className="min-h-[70vh] flex items-center justify-center p-4 text-right bg-slate-50"
      dir="rtl"
    >
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 text-center">
        <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock className="text-red-500" size={40} />
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-4">
          תקופת הניסיון הסתיימה
        </h1>
        <p className="text-slate-600 mb-2 font-semibold text-lg">
          {org.name}
        </p>
        <p className="text-slate-600 mb-8 leading-relaxed text-sm">
          30 הימים ב־BSD-YBM הגיעו לסיומם. כדי להמשיך בניתוח AI, ניהול פרויקטים ותובנות
          עסקיות, ניתן לשדרג לתוכנית בתשלום.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/billing"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-blue-200"
          >
            <Rocket size={20} /> שדרגו מנוי או רכשו בנדל סריקות
          </Link>

          <Link
            href="/api/auth/signout"
            className="w-full flex items-center justify-center gap-2 text-slate-400 font-medium py-2 hover:text-slate-600 transition-colors"
          >
            <LogOut size={18} /> התנתקות מהמערכת
          </Link>
        </div>
      </div>
    </div>
  );
}
