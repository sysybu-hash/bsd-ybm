import { redirect } from "next/navigation";

export const metadata = { title: "AI | BSD-YBM" };

export default function AppInsightsAdvancedRedirectPage() {
  redirect("/app/ai#insights");
}
