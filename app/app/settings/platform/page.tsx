import AdminPlatformDashboard from "@/components/admin/AdminPlatformDashboard";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ section?: string }>;

export default function SettingsPlatformPage({ searchParams }: { searchParams: SearchParams }) {
  return <AdminPlatformDashboard searchParams={searchParams} platformBasePath="/app/settings/platform" />;
}
