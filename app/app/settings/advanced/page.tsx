import { redirect } from "next/navigation";
import { legacyTabToSegment, settingsHubPath } from "@/lib/settings-hub-nav";

type Search = Promise<{ tab?: string }>;

const INLINE_SEGMENTS = new Set(["overview", "profile", "organization", "profession", "presence", "stack"]);

/** נתיב legacy — מפנה למקטע המתאים במרכז ההגדרות */
export default async function SettingsAdvancedRedirectPage({ searchParams }: { searchParams: Search }) {
  const { tab } = await searchParams;
  const mapped = legacyTabToSegment(tab);
  if (mapped) {
    redirect(INLINE_SEGMENTS.has(mapped) ? `/app/settings${mapped === "overview" ? "" : `#${mapped}`}` : settingsHubPath(mapped));
  }
  redirect("/app/settings");
}
