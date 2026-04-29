import { redirect } from "next/navigation";

/** נתיב legacy — כל ניהול הפרויקטים במרכז CRM */
export default function ProjectsRedirectPage() {
  redirect("/app/crm");
}
