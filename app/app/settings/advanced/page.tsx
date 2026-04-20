import { redirect } from "next/navigation";
import { legacyTabToSegment, settingsHubPath } from "@/lib/settings-hub-nav";

type Search = Promise<{ tab?: string }>;

/** נתיב legacy — מפנה למקטע המתאים במרכז ההגדרות */
export default async function SettingsAdvancedRedirectPage({ searchParams }: { searchParams: Search }) {
  const { tab } = await searchParams;
  const mapped = legacyTabToSegment(tab);
  if (mapped) {
    redirect(settingsHubPath(mapped));
  }
  redirect("/app/settings/overview");
}
