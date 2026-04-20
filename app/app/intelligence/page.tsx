import { redirect } from "next/navigation";

/** הפניה ל־`/app/ai` — תוכן המודיעין משולב במסך AI */
export default function AppIntelligenceLegacyRedirect() {
  redirect("/app/ai");
}
