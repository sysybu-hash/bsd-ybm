import ExecutiveSuite from "@/components/intelligence/ExecutiveSuite";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "חדר מצב | Executive BI Dashboard",
};

export default function ExecutiveDashboardPage() {
  return <ExecutiveSuite />;
}
