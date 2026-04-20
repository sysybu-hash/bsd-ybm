import { redirect } from "next/navigation";

/** הפניה ל־`/app/ai` — מרכז AI המאוחד */
export default function AppInsightsLegacyRedirect() {
  redirect("/app/ai");
}
