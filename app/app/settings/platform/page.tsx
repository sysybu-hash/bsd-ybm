import AdminPlatformDashboard from "@/components/admin/AdminPlatformDashboard";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { getSettingsHubNavItem } from "@/lib/settings-hub-nav";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";
import Link from "next/link";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ section?: string }>;

export default async function SettingsPlatformPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return (
      <section className="tile tile--lavender w-full max-w-3xl p-6 sm:p-8" dir="rtl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--ink-400)]">
          Platform Access
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[color:var(--ink-900)]">
          הגדרות הפלטפורמה שמורות למנהל העליון.
        </h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--ink-600)]">
          למשתמש הנוכחי יש גישה להגדרות הארגון, אך לא להגדרות מערכת גלובליות.
        </p>
        <Link
          href="/app/settings"
          className="mt-6 inline-flex rounded-xl bg-[color:var(--ink-900)] px-4 py-2.5 text-sm font-black text-white hover:bg-[color:var(--ink-800)]"
        >
          חזרה להגדרות
        </Link>
      </section>
    );
  }

  const meta = getSettingsHubNavItem("platform", true);

  return (
    <div className="w-full min-w-0 space-y-8" dir="rtl">
      {meta ? <SettingsPageHeader title={meta.label} description={meta.description} eyebrow="Platform" /> : null}
      <BentoGrid>
        <Tile tone="ai" span={8}>
          <TileHeader eyebrow="Control plane" />
          <p className="mt-3 text-[14px] leading-7 text-[color:var(--axis-ai-ink)]">
            מרכז השליטה בפלטפורמה — בריאות, מנויים ושידורים. הרכיבים המלאים נטענים מתחת לכרטיסים.
          </p>
          <div className="mt-4">
            <ProgressBar value={100} axis="ai" />
          </div>
        </Tile>
        <Tile tone="neutral" span={4}>
          <TileHeader eyebrow="Access" />
          <p className="mt-3 text-sm font-semibold text-[color:var(--ink-700)]">מנהלי פלטפורמה בלבד</p>
        </Tile>
      </BentoGrid>
      <AdminPlatformDashboard searchParams={searchParams} platformBasePath="/app/settings/platform" />
    </div>
  );
}
