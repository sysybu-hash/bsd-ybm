import {
  Users,
  Building2,
  Clock,
  CheckSquare,
  BarChart2,
  Settings,
  Globe,
  Activity,
  FileText,
} from "lucide-react";

export const MECKANO_HUB_TABS = [
  { id: "employees", label: "עובדים", Icon: Users },
  { id: "departments", label: "מחלקות", Icon: Building2 },
  { id: "attendance", label: "נוכחות", Icon: Clock },
  { id: "locations", label: "אזורי דיווח", Icon: Globe },
  { id: "live-map", label: "מפה חיה", Icon: Activity },
  { id: "tasks", label: "משימות", Icon: CheckSquare },
  { id: "task-entries", label: "דיווח משימות", Icon: BarChart2 },
  { id: "reports", label: "דוחות", Icon: FileText },
  { id: "settings", label: "הגדרות", Icon: Settings },
] as const;

export type MeckanoHubTabId = (typeof MECKANO_HUB_TABS)[number]["id"];

export type MeckanoReportType = "attendance" | "task-entries" | "summary" | "project-cost" | "locations";
