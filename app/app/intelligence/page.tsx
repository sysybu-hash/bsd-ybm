import { IntelligenceDashboardContent } from "@/app/dashboard/(protected)/intelligence/IntelligenceDashboardContent";

export const metadata = {
  title: "Intelligence | BSD-YBM",
};

export default async function AppIntelligencePage() {
  return <IntelligenceDashboardContent fallbackHref="/app" />;
}
