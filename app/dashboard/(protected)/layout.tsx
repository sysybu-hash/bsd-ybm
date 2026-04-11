import type { ReactNode } from "react";

export default async function ProtectedDashboardSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 🛡️ BSD-YBM BSD-YBM: NESTED INFRASTRUCTURE ISOLATION
  // Bypassing auth check and database trials in the protected layout segment.
  
  return <>{children}</>;
}
