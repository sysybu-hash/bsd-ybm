import { Suspense } from "react";
import LoginClient from "./LoginClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "כניסה | BSD-YBM Intelligence",
  description: "התחברות עם Google לפלטפורמת BSD-YBM",
};

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}
