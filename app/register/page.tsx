import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import RegisterPortal from "@/components/auth/RegisterPortal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "הרשמה | BSD-YBM",
  description:
    "פתיחת חשבון חדש ב-BSD-YBM והתחלת עבודה עם לקוחות, מסמכים, חיוב ו-AI בתוך מערכת אחת.",
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
