import { redirect } from "next/navigation";

export default async function InvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; contactId?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  if (sp.client) params.set("client", sp.client);
  if (sp.contactId) params.set("contactId", sp.contactId);

  redirect(params.size ? `/app/documents/issue?${params.toString()}` : "/app/documents/issue");
}
