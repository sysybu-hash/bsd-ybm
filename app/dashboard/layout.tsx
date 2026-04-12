import type { ReactNode } from "react";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/is-admin";
import { redirect } from "next/navigation";

/** מניעת מטמון RSC/CDN — ללא גרסת „אדמין” שנשמרת למשתמש רגיל */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 🛡️ BSD-YBM BSD-YBM: REAL IDENTITY PROTECTION
  // We use the real server session to determine identity and roles.
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return redirect("/login");
  }

  const serverEmail = session.user.email;
  const userName = session.user.name ?? "User";
  const userRole = session.user.role ?? "USER";
  const isAdminUser = isAdmin(serverEmail);
  const orgId = session.user.organizationId ?? "platform-lock-BSD-YBM";
  const trialBannerDaysLeft = null;

  return (
    <DashboardLayoutClient
      orgId={orgId}
      userRole={userRole}
      isAdminUser={isAdminUser}
      trialBannerDaysLeft={trialBannerDaysLeft}
      serverUser={{
        email: serverEmail,
        name: userName,
        image: session.user.image ?? null,
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
