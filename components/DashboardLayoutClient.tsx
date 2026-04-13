"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, LogOut } from "lucide-react";
import WorkspaceUtilityDock from "@/components/app-shell/WorkspaceUtilityDock";
import type { IndustryProfile } from "@/lib/professions/runtime";

type Props = {
  children: ReactNode;
  orgId: string;
  userRole: string;
  isAdminUser: boolean;
  hasMeckanoAccess: boolean;
  industryProfile: IndustryProfile;
  trialBannerDaysLeft: number | null;
  serverUser: { email: string; name: string | null; image: string | null };
};

export default function DashboardLayoutClient({
  children,
  orgId,
  userRole,
  isAdminUser,
  hasMeckanoAccess,
  industryProfile,
  trialBannerDaysLeft,
  serverUser,
}: Props) {
  const userName = serverUser.name?.trim() || serverUser.email.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-slate-100/70" dir="rtl">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Dashboard Bridge</p>
            <h1 className="truncate text-lg font-black text-slate-900">
              שכבת התאימות הישנה נשארה זמינה רק לנתיבים שעדיין מפנים למסכים מתקדמים.
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {userName} · {serverUser.email} · ארגון {orgId.slice(-6).toUpperCase()} · {userRole}
              {isAdminUser ? " · Admin" : ""}
              {hasMeckanoAccess ? " · Meckano" : ""}
              {trialBannerDaysLeft !== null ? ` · ניסיון ${trialBannerDaysLeft}` : ""}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white"
            >
              חזרה ל-Workspace v2
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700"
            >
              יציאה
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">{children}</main>

      <WorkspaceUtilityDock
        orgId={orgId}
        industryProfile={industryProfile}
        userName={userName}
      />
    </div>
  );
}
