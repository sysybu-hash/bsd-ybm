import { redirect } from "next/navigation";
import type { BillingSearchParams } from "./BillingPageContent";

export default async function DashboardBillingRedirectPage({
  searchParams,
}: {
  searchParams: BillingSearchParams;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  if (sp.tab?.trim()) {
    params.set("tab", sp.tab.trim());
  }

  if (sp.orgId?.trim()) {
    params.set("orgId", sp.orgId.trim());
  }

  redirect(params.size > 0 ? `/app/billing?${params.toString()}` : "/app/billing");
}
