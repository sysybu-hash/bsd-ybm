import AdminPlatformDashboard from "@/components/admin/AdminPlatformDashboard";
import AppPageChrome from "@/components/workspace/AppPageChrome";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ section?: string }>;

export default function AppAdminPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AppPageChrome>
      <AdminPlatformDashboard searchParams={searchParams} platformBasePath="/app/admin" />
    </AppPageChrome>
  );
}
