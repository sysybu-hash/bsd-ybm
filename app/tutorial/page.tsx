import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SiteTutorialShowcase from "@/components/SiteTutorialShowcase";
import LandingVideoTutorials from "@/components/LandingVideoTutorials";

export const metadata: Metadata = {
  title: "הדרכה — BSD-YBM",
  description: "הדרכה ויזואלית מונפשת על מסך הבית, התחברות, דשבורד, ERP, CRM ועוזר AI",
};

export default function TutorialPage() {
  return (
    <div className="relative min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 pb-16">
        <SiteTutorialShowcase variant="page" />
        <div className="max-w-7xl mx-auto px-6">
          <LandingVideoTutorials />
        </div>
      </main>
      <Footer />
    </div>
  );
}
