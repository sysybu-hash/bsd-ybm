import { IntelligenceDashboardContent } from "@/app/workspace-content/intelligence/IntelligenceDashboardContent";

export const metadata = {
  title: "Intelligence | BSD-YBM",
};

export default async function AppIntelligencePage() {
  return <IntelligenceDashboardContent fallbackHref="/app" />;
}
