import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "הרשמה | BSD-YBM Intelligence",
  description: "בקשת הרשמה לארגון — אישור מנהל מערכת או קישור הזמנה",
};

type Props = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  const inviteToken = sp.invite?.trim() || undefined;
  return <RegisterClient inviteToken={inviteToken} />;
}
