import AdminPlatformDashboard from "@/components/admin/AdminPlatformDashboard";
import AppPageChrome from "@/components/workspace/AppPageChrome";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import Link from "next/link";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ section?: string }>;

export default async function AppAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return (
      <AppPageChrome>
        <section className="tile tile--lavender w-full max-w-3xl p-6 sm:p-8" dir="rtl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
            Platform Access
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[color:var(--ink-900)]">
            מרכז ניהול הפלטפורמה שמור למנהל העליון.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
            המשתמש הנוכחי מחובר למרחב העבודה, אבל אין לו הרשאת Platform Admin למסך הזה.
          </p>
          <Link
            href="/app"
            className="mt-6 inline-flex rounded-xl bg-[color:var(--ink-900)] px-4 py-2.5 text-sm font-black text-white hover:bg-[color:var(--ink-800)]"
          >
            חזרה למרכז העבודה
          </Link>
        </section>
      </AppPageChrome>
    );
  }

  return (
    <AppPageChrome>
      <AdminPlatformDashboard searchParams={searchParams} platformBasePath="/app/admin" />
    </AppPageChrome>
  );
}
