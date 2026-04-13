import { redirect } from "next/navigation";

export default function DashboardControlCenterRedirectPage() {
  redirect("/app/inbox");
}
