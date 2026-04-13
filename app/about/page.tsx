import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "אודות BSD-YBM",
  description:
    "BSD-YBM נבנתה כדי לחבר בין לקוחות, מסמכים, חיוב, שליטה תפעולית ו-AI בתוך מערכת אחת לעסקים מקצועיים בישראל.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
