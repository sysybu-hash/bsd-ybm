import { redirect } from "next/navigation";
import { legacyTabToSegment, settingsHubPath } from "@/lib/settings-hub-nav";

export const dynamic = "force-dynamic";

type SettingsSearch = Promise<{ tab?: string }>;

export default async function AppSettingsIndexPage({ searchParams }: { searchParams: SettingsSearch }) {
  const { tab } = await searchParams;
  const mapped = legacyTabToSegment(tab);
  if (mapped) {
    redirect(settingsHubPath(mapped));
  }
  redirect("/app/settings/overview");
}
