import { redirect } from "next/navigation";

/** הועבר למסך מאוחד — מנויים ותשלומים */
export default function ExecutiveManageSubscriptionsRedirectPage() {
  redirect("/dashboard/billing?tab=advanced");
}
