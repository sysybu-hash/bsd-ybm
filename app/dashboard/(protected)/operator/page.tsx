import type { Metadata } from "next";
import OperatorAssistantPanel from "@/components/operations/OperatorAssistantPanel";

export const metadata: Metadata = {
  title: "עוזר תפעולי | BSD-YBM",
  description: "סוכן תפעולי פנימי לניהול מהיר מתוך האתר.",
};

export default function OperatorPage() {
  return <OperatorAssistantPanel />;
}
