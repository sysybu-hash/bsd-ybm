import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import UnifiedSettingsWorkspace from "@/components/settings/UnifiedSettingsWorkspace";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { loadSettingsHubPageData } from "@/lib/settings-hub-server";
import { legacyTabToSegment, settingsHubPath } from "@/lib/settings-hub-nav";

export const dynamic = "force-dynamic";

type SettingsSearch = Promise<{ tab?: string }>;

export default async function AppSettingsIndexPage({ searchParams }: { searchParams: SettingsSearch }) {
  const { tab } = await searchParams;
  const mapped = legacyTabToSegment(tab);
  if (mapped) {
    const inlineSegments = new Set(["overview", "profile", "organization", "profession", "presence", "stack"]);
    redirect(inlineSegments.has(mapped) ? `/app/settings${mapped === "overview" ? "" : `#${mapped}`}` : settingsHubPath(mapped));
  }

  const [session, data] = await Promise.all([getServerSession(authOptions), loadSettingsHubPageData()]);
  const email = session?.user?.email ?? "";
  const name = (session?.user?.name ?? "").trim() || email.split("@")[0] || "משתמש";

  return (
    <UnifiedSettingsWorkspace
      {...data}
      includePlatformNav={isAdmin(email)}
      userName={name}
      userEmail={email || "—"}
    />
  );
}
