import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "מי אנחנו | BSD-YBM",
  description:
    "BSD-YBM — ניסיון של למעלה מ־20 שנה בניהול משרדים וחשבונאות, מזוקק למערכת AI חכמה.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
