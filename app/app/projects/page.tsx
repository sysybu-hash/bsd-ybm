import { redirect } from "next/navigation";

/** נתיב legacy — מרכז הפרויקטים בלשונית CRM */
export default function ProjectsRedirectPage() {
  redirect("/app/crm?hub=projects");
}
