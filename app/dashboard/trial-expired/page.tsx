import { redirect } from "next/navigation";

/** נתיב legacy — המקור: `/app/trial-expired` */
export default function DashboardTrialExpiredRedirect() {
  redirect("/app/trial-expired");
}
