import { redirect } from "next/navigation";

/** הועבר למסך מאוחד — מנויים ותשלומים */
export default function ExecutiveSubscriptionsRedirectPage() {
  redirect("/dashboard/billing?tab=manage");
}
