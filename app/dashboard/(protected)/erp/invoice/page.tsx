import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import InvoiceIssuance from "@/components/InvoiceIssuance";

export const metadata = { title: "הנפקת חשבוניות — BSD-YBM" };

export default async function InvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; contactId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/login");

  const sp = await searchParams;
  const prefillClient = sp.client ? decodeURIComponent(sp.client) : undefined;
  const prefillContactId = sp.contactId ? decodeURIComponent(sp.contactId) : undefined;

  return (
    <section className="min-h-screen bg-white/[0.03]/60 px-4 py-8 sm:px-6 lg:px-8">
      <InvoiceIssuance
        orgId={session.user.organizationId}
        prefillClientName={prefillClient}
        prefillContactId={prefillContactId}
      />
    </section>
  );
}
