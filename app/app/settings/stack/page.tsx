import { redirect } from "next/navigation";

export default function SettingsStackRedirectPage() {
  redirect("/app/settings#stack");
}
