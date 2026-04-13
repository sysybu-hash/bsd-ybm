import { redirect } from "next/navigation";

export default function LegacyDashboardAiPage() {
  redirect("/app/insights/advanced");
}
