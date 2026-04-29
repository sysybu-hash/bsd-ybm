import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SettingsCenterShell from "@/components/settings/SettingsCenterShell";
import AppPageChrome from "@/components/workspace/AppPageChrome";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";

export const dynamic = "force-dynamic";

export default async function AppSettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const includePlatformNav = isAdmin(session.user.email);

  return (
    <SettingsCenterShell includePlatformNav={includePlatformNav}>
      <AppPageChrome>{children}</AppPageChrome>
    </SettingsCenterShell>
  );
}
