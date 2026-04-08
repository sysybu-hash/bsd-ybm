import AutomationBuilder from "@/components/automations/AutomationBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מרכז בקרת אוטומציות | Control Center",
};

export default function ControlCenterPage() {
  return <AutomationBuilder />;
}
