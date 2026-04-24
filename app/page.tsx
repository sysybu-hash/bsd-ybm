import type { Metadata } from "next";
import MarketingHome from "@/components/landing/MarketingHome";

export const metadata: Metadata = {
  title: "BSD-YBM פתרונות AI | השדרה שמחברת בין כולם",
  description:
    "מערכת ERP ו-CRM מודולרית המופעלת על ידי בינה מלאכותית, המותאמת אישית לכל תחומי הבנייה והתשתיות.",
};

export default function HomePage() {
  return <MarketingHome />;
}
