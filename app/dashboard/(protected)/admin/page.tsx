import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";
import Link from "next/link";
import { Users, Building, CreditCard, ArrowUpRight, Clock, ShieldCheck, Zap } from "lucide-react";
import AdminBroadcastNotifications from "@/components/admin/AdminBroadcastNotifications";
import PlatformPayPalOwnerCard from "@/components/admin/PlatformPayPalOwnerCard";

type AdminPageProps = {
  searchParams?: Promise<{ section?: string }>;
};

export default async function AdminDashboard({ searchParams }: AdminPageProps) {
  const session = await getServerSession(authOptions);

  // אבטחה: רק Steel Admin — לא מספיק SUPER_ADMIN ב-DB בלבד
  const allowed = isAdmin(session?.user?.email);
  if (!session || !allowed) {
    redirect("/dashboard");
  }

  // משיכת נתונים חיים ממסד הנתונים
  const totalOrganizations = await prisma.organization.count();
  const totalUsers = await prisma.user.count();
  
  // חישוב הכנסות (חשבוניות ששולמו דרך פייפלוס)
  const paidInvoices = await prisma.invoice.aggregate({
    where: { status: 'PAID' },
    _sum: { amount: true }
  });
  const totalRevenue = paidInvoices._sum.amount || 0;

  // חישוב כסף שממתין לגבייה (חשבוניות פתוחות)
  const pendingInvoices = await prisma.invoice.aggregate({
    where: { status: 'PENDING' },
    _sum: { amount: true }
  });
  const pendingRevenue = pendingInvoices._sum.amount || 0;

  // רשימת 5 הלקוחות (הארגונים) האחרונים שהצטרפו
  const recentClients = await prisma.organization.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { users: { take: 1, select: { email: true, role: true } } }
  });

  const sp = (await searchParams) ?? {};
  const activeSection = sp.section === "subscriptions" ? "subscriptions" : sp.section === "broadcast" ? "broadcast" : "overview";

  return (
    <div className="space-y-6" dir="rtl">

      {/* HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white px-6 py-7 shadow-sm md:px-8">
        <div className="absolute inset-y-0 start-0 w-1.5 rounded-s-3xl bg-gradient-to-b from-indigo-500 to-violet-600" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700">
              <ShieldCheck size={11} /> הרשאת בעלים
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900">חדר מצב <span className="text-indigo-600">BSD-YBM</span></h1>
            <p className="mt-1 text-sm text-gray-500">ניהול לקוחות, מנויים והכנסות במבט על</p>
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-gray-100 bg-gray-50 p-1.5">
            <Link
              href="/dashboard/admin"
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeSection === "overview"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              סקירה כללית
            </Link>
            <Link
              href="/dashboard/admin?section=subscriptions"
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeSection === "subscriptions"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              MASTER — מנויים
            </Link>
            <Link
              href="/dashboard/admin?section=broadcast"
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeSection === "broadcast"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              שידור והתראות
            </Link>
            <Link
              href="/dashboard/control-center"
              className="rounded-xl px-4 py-2 text-sm font-bold text-gray-600 hover:bg-white transition"
            >
              מרכז תפעול
            </Link>
          </div>
        </div>
      </section>

      {activeSection === "overview" ? <PlatformPayPalOwnerCard /> : null}

      {/* KPI cards */}
      {activeSection === "overview" ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CreditCard size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 opacity-70">הכנסות (שולם)</p>
          </div>
          <h2 className="text-3xl font-black text-emerald-700">₪{totalRevenue.toLocaleString()}</h2>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Clock size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 opacity-70">ממתין לתשלום</p>
          </div>
          <h2 className="text-3xl font-black text-amber-700">₪{pendingRevenue.toLocaleString()}</h2>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><Building size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 opacity-70">לקוחות פעילים</p>
          </div>
          <h2 className="text-3xl font-black text-blue-700">{totalOrganizations}</h2>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><Users size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 opacity-70">משתמשים רשומים</p>
          </div>
          <h2 className="text-3xl font-black text-indigo-700">{totalUsers}</h2>
        </div>

      </div>
      ) : null}

      {/* Clients table */}
      {activeSection === "overview" ? (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Building className="text-blue-500" size={18} /> לקוחות ומנויים אחרונים
          </h3>
          <Link
            href="/dashboard/billing?tab=control"
            className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            הצג את כל הלקוחות
          </Link>
        </div>
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[640px] text-right">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs">
                <th className="pb-3 font-bold uppercase tracking-wide">שם הלקוח / חברה</th>
                <th className="pb-3 font-bold uppercase tracking-wide">אימייל איש קשר</th>
                <th className="pb-3 font-bold uppercase tracking-wide">תאריך הצטרפות</th>
                <th className="pb-3 font-bold uppercase tracking-wide">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-gray-400">
                    אין עדיין לקוחות במערכת.
                  </td>
                </tr>
              ) : (
                recentClients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 font-bold text-gray-900">
                      {client.name || 'ארגון ללא שם'}
                    </td>
                    <td className="py-4 text-gray-500 text-sm">
                      {client.users[0]?.email || 'אין אימייל'}
                    </td>
                    <td className="py-4 text-gray-500 text-sm">
                      {client.createdAt.toLocaleDateString('he-IL')}
                    </td>
                    <td className="py-4">
                      <Link
                        href={`/dashboard/billing?tab=control&orgId=${encodeURIComponent(client.id)}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                      >
                        ניהול מנוי <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      {activeSection === "subscriptions" ? (
      <section id="subscriptions" className="space-y-4">
        <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-violet-600 mb-1">MASTER ADMIN</p>
          <h2 className="text-xl font-black text-gray-900">ניהול מנויים מרוכז</h2>
          <p className="text-sm text-gray-500 mt-1">כל פעולות עריכה/מחיקה זמינות במסך הבילינג המאוחד.</p>
        </div>
        <Link
          href="/dashboard/billing?tab=control"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700 transition-colors"
        >
          מעבר לניהול מנויים מאוחד <ArrowUpRight size={15} />
        </Link>
      </section>
      ) : null}

      {activeSection === "broadcast" ? <AdminBroadcastNotifications /> : null}

    </div>
  );
}