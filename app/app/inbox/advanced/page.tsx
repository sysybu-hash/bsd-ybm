import { redirect } from "next/navigation";

export default async function LegacyControlCenterPage() {
  redirect("/app/inbox");
}
