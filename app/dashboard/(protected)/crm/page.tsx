import { redirect } from "next/navigation";

export default function DashboardCrmRedirectPage() {
  redirect("/app/clients");
}
