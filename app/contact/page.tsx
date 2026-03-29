import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "צור קשר | BSD-YBM",
  description: "יצירת קשר עם BSD-YBM — האתרוג 99 גבעת זאב, טלפון, אימייל ווואטסאפ.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
