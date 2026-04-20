import { redirect } from "next/navigation";

type SearchParams = Promise<{ section?: string; orgId?: string }>;

export default async function DashboardAdminRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  if (sp.section === "subscriptions") {
    const params = new URLSearchParams({ tab: "control" });
    if (sp.orgId?.trim()) {
      params.set("orgId", sp.orgId.trim());
    }
    redirect(`/app/settings/billing?${params.toString()}`);
  }

  if (sp.section === "broadcast") {
    redirect("/app/admin?section=broadcast");
  }

  redirect("/app/admin");
}
