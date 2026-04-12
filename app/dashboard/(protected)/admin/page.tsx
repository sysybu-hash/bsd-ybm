import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/is-admin";
import Link from "next/link";
import { Users, Building, CreditCard, ArrowUpRight, Clock, ShieldCheck, Zap } from "lucide-react";
import AdminBroadcastNotifications from "@/components/admin/AdminBroadcastNotifications";
import PlatformPayPalOwnerCard from "@/components/admin/PlatformPayPalOwnerCard";
import AdminSystemHealth from "@/components/admin/AdminSystemHealth";

type AdminPageProps = {
  searchParams?: Promise<{ section?: string }>;
};

export default async function AdminDashboard({ searchParams }: AdminPageProps) {
  const session = await getServerSession(authOptions);

  // אבטחה: רק Steel Admin
  const allowed = isAdmin(session?.user?.email);
  if (!session || !allowed) {
    redirect("/dashboard");
  }

  // משיכת נתונים חיים ממסד הנתונים
  const totalOrganizations = await prisma.organization.count();
  const totalUsers = await prisma.user.count();
  
  const paidInvoices = await prisma.invoice.aggregate({
    where: { status: 'PAID' },
    _sum: { amount: true }
  });
  const totalRevenue = paidInvoices._sum.amount || 0;

  const pendingInvoices = await prisma.invoice.aggregate({
    where: { status: 'PENDING' },
    _sum: { amount: true }
  });
  const pendingRevenue = pendingInvoices._sum.amount || 0;

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
      <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-6 py-7 md:px-8">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-500" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-400">
              <ShieldCheck size={11} /> הרשאת בעלים
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-900">חדר מצב <span className="text-indigo-400">BSD-YBM</span></h1>
            <p className="mt-1 text-sm text-gray-400">ניהול לקוחות, מנויים והכנסות במבט על</p>
          </div>
          
          <div className="flex flex-col items-end gap-4 min-w-[300px]">
            <AdminSystemHealth />
            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-gray-100 bg-gray-50 p-1.5 self-stretch lg:self-auto">
              <Link
                href="/dashboard/admin"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeSection === "overview"
                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/25"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                סקירה כללית
              </Link>
              <Link
                href="/dashboard/admin?section=subscriptions"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeSection === "subscriptions"
                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/25"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                ניהול מנויים
              </Link>
              <Link
                href="/dashboard/admin?section=broadcast"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeSection === "broadcast"
                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/25"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                שידור והתראות
              </Link>
            </div>
          </div>
        </div>
      </section>

      {activeSection === "overview" ? <PlatformPayPalOwnerCard /> : null}

      {activeSection === "overview" ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><CreditCard size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/70">הכנסות (שולם)</p>
          </div>
          <h2 className="text-3xl font-black text-gray-900">₪{totalRevenue.toLocaleString()}</h2>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><Clock size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70">ממתין לתשלום</p>
          </div>
          <h2 className="text-3xl font-black text-gray-900">₪{pendingRevenue.toLocaleString()}</h2>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400"><Building size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400/70">לקוחות פעילים</p>
          </div>
          <h2 className="text-3xl font-black text-gray-900">{totalOrganizations}</h2>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400"><Users size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400/70">משתמשים רשומים</p>
          </div>
          <h2 className="text-3xl font-black text-gray-900">{totalUsers}</h2>
        </div>
      </div>
      ) : null}

      {activeSection === "overview" ? (
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Building className="text-indigo-400" size={18} /> לקוחות ומנויים אחרונים
          </h3>
          <Link
            href="/dashboard/admin?section=subscriptions"
            className="rounded-xl bg-indigo-500/15 px-4 py-2 text-sm font-bold text-indigo-400 hover:bg-indigo-500/25 transition-colors"
          >
            ניהול כל המנויים
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs">
                <th className="pb-3 font-bold uppercase tracking-wide">שם הלקוח / חברה</th>
                <th className="pb-3 font-bold uppercase tracking-wide">אימייל איש קשר</th>
                <th className="pb-3 font-bold uppercase tracking-wide">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 font-bold text-gray-900">{client.name || 'ארגון'}</td>
                  <td className="py-4 text-gray-400 text-sm">{client.users[0]?.email}</td>
                  <td className="py-4">
                    <Link
                      href={`/dashboard/admin?section=subscriptions&orgId=${client.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-indigo-400"
                    >
                      ניהול מנוי <ArrowUpRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      {activeSection === "subscriptions" ? (
      <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 mb-6">
          <CreditCard size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900">ניהול מנויים מרוכז</h2>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          כאן תוכל לנהל את כל הלקוחות והמנויים תחת קורת גג אחת, ללא צורך בניווט לדפים חיצוניים.
        </p>
        <div className="mt-8 border-t border-gray-50 pt-8 text-start">
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">רשימת לקוחות לניהול</p>
           {/* Placeholder for actual table that was in billing */}
           <div className="grid grid-cols-1 gap-3">
              {recentClients.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all">
                  <div>
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.users[0]?.email}</p>
                  </div>
                  <button className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">ערוך מנוי</button>
                </div>
              ))}
           </div>
        </div>
      </section>
      ) : null}

      {activeSection === "broadcast" ? <AdminBroadcastNotifications /> : null}

    </div>
  );
}