import { redirect } from "next/navigation";

export default function SettingsPresenceRedirectPage() {
  redirect("/app/settings#presence");
}
