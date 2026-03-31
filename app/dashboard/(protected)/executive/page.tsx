import { redirect } from "next/navigation";

/** מוזג לדף Intelligence — שומרים נתיב ישן לסימניות וקישורים */
export default function ExecutiveDashboardRedirectPage() {
  redirect("/dashboard/intelligence#executive-suite");
}
