import { redirect } from "next/navigation";

/** נתיב ישן — המקטע זמין במרכז ההגדרות */
export default function SettingsProfileRedirectPage() {
  redirect("/app/settings#profile");
}
