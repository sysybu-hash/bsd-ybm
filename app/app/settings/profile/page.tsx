import { getServerSession } from "next-auth";
import { UserProfileUI } from "@/components/settings/UserProfileUI";
import { authOptions } from "@/lib/auth";
import { loadSettingsHubPageData } from "@/lib/settings-hub-server";

export const dynamic = "force-dynamic";

export default async function SettingsProfilePage() {
  const [session, data] = await Promise.all([getServerSession(authOptions), loadSettingsHubPageData()]);

  const name = (session?.user?.name ?? "").trim() || (session?.user?.email?.split("@")[0] ?? "");
  const email = session?.user?.email ?? "";

  return (
    <div className="w-full min-w-0" dir="rtl">
      <UserProfileUI name={email ? name : "—"} email={email || "—"} roleLabel={data.viewer.roleLabel} />
    </div>
  );
}
