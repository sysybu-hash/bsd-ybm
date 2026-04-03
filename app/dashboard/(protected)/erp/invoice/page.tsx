import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import InvoiceIssuance from "@/components/InvoiceIssuance";

export const metadata = { title: "הנפקת חשבוניות — BSD-YBM" };

export default async function InvoicePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/login");

  return (
    <section className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <InvoiceIssuance orgId={session.user.organizationId} />
    </section>
  );
}
