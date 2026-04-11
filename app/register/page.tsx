import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import RegisterPortal from "@/components/auth/RegisterPortal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "הרשמה | BSD-YBM Intelligence",
  description: "בקשת הרשמה לארגון — אישור מנהל מערכת או קישור הזמנה",
};

type Props = {
  searchParams: Promise<{ invite?: string; orgInvite?: string; plan?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  noStore();
  const sp = await searchParams;
  const inviteToken = sp.invite?.trim() || undefined;
  const orgInviteToken = sp.orgInvite?.trim() || undefined;
  const plan = sp.plan?.trim() || undefined;
  return <RegisterPortal inviteToken={inviteToken} orgInviteToken={orgInviteToken} plan={plan} />;
}
