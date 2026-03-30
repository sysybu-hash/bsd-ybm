import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import AuthEntryClient from "@/components/auth/AuthEntryClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "כניסה | BSD-YBM Intelligence",
  description: "התחברות לפלטפורמת BSD-YBM",
};

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}

export default function LoginPage() {
  noStore();
  return (
    <Suspense fallback={<LoginFallback />}>
      <AuthEntryClient />
    </Suspense>
  );
}
