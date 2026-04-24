import { redirect } from "next/navigation";

/** קישור יציב תחת /legal/privacy — התוכן המלא ב־/privacy */
export default function LegalPrivacyRedirectPage() {
  redirect("/privacy");
}
