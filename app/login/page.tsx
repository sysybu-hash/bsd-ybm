import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import LoginPortal from "@/components/auth/LoginPortal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "כניסה | BSD-YBM Intelligence",
  description: "התחברות לפלטפורמת BSD-YBM",
};

function LoginFallback() {
  return (
    <div className="min-h-app flex items-center justify-center bg-slate-50" dir="rtl">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: "var(--primary-color,#2563eb)", borderTopColor: "transparent" }}
      />
    </div>
  );
}

export default function LoginPage() {
  noStore();
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPortal />
    </Suspense>
  );
}
