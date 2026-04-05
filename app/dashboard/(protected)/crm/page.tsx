import { redirect } from "next/navigation";
export default async function CRMPage() {
  redirect("/dashboard/business?tab=crm");
}
