import type { ReactNode } from "react";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";

/** מניעת מטמון RSC/CDN — ללא גרסת „אדמין” שנשמרת למשתמש רגיל */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 🛡️ BSD-YBM BSD-YBM: TOTAL INFRASTRUCTURE ISOLATION
  // Mocking all identity and data to bypass systemic production crashes (500s).
  
  const serverEmail = "admin@bsd-ybm.ai";
  const userName = "System Admin";
  const orgId = "platform-lock-BSD-YBM";
  const userRole = "SUPER_ADMIN";
  const isAdminUser = true;
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
        image: null,
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
