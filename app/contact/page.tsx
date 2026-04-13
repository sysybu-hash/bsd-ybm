import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "יצירת קשר | BSD-YBM",
  description:
    "פנייה ל-BSD-YBM לקבלת הדגמה, התאמה לארגון או שיחה על תהליכי עבודה, מסמכים, חיוב ו-AI.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
