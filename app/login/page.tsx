import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import LoginPortal from "@/components/auth/LoginPortal";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "כניסה | BSD-YBM",
  description: "כניסה למערכת BSD-YBM לניהול לקוחות, מסמכים, חיוב ובקרה תפעולית.",
};

function LoginFallback() {
  return (
    <div className="min-h-app flex flex-col items-center justify-center gap-4 bg-[color:var(--canvas)] px-4" dir="rtl">
      <Skeleton className="h-12 w-12 rounded-2xl" aria-hidden />
      <div className="w-full max-w-xs space-y-2">
        <Skeleton className="h-3 w-full" aria-hidden />
        <Skeleton className="mx-auto h-3 w-[80%]" aria-hidden />
      </div>
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
