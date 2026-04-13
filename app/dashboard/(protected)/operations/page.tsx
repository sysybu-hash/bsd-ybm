import { redirect } from "next/navigation";

export default function DashboardOperationsRedirectPage() {
  redirect("/app/operations");
}
