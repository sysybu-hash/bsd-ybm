"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type ServerUser = { email: string; name: string | null; image: string | null };

/** פרופיל משתמש בתחתית סרגל הצד — זכוכית, מסגרת זהב, נקודת סטטוס פעיל */
export default function DashboardSidebarUserCard({
  serverUser,
}: Readonly<{ serverUser: ServerUser }>) {
  const { data: session, status } = useSession({ required: true });
  const { t, dir } = useI18n();

  const serverMail = serverUser.email.trim();
  /** כמו התפריט: לא מציגים מייל מ-session בדפדפן אם יש מייל שרת — מונע „לקוח עם מייל אדמין ישן” */
  const email = (serverMail || (session?.user?.email ?? "")).trim();
  const name = (serverUser.name || (session?.user?.name ?? "") || "").trim();
  const image = serverUser.image ?? session?.user?.image ?? null;
  const loading = status === "loading" && !serverMail;
  const displayName = loading ? "…" : name || email.split("@")[0] || "—";

  return (
    <div
      key={email}
      dir={dir}
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm ring-1 ring-gray-100/90"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <span
            className="absolute -top-0.5 z-[1] h-2.5 w-2.5 rounded-full bg-emerald-500/15 shadow-[0_0_10px_rgba(16,185,129,0.85)] ring-2 ring-white"
            title={t("dashboard.forecast.status")}
            aria-hidden
          />
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-teal-400/70 ring-offset-2 ring-offset-white">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100 to-teal-50 text-sm font-black text-teal-300">
                {(loading ? "…" : email || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1 text-end">
          <p className="truncate text-sm font-bold text-gray-900">{displayName}</p>
          <p className="truncate text-[11px] font-medium text-gray-400" title={email || undefined}>
            {loading ? "…" : email || "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/", redirect: true })}
          className="shrink-0 rounded-xl border border-gray-200/80 bg-white/90 p-2.5 text-gray-400 transition hover:scale-105 hover:border-teal-500/30 hover:text-teal-300"
          aria-label={t("dashboard.logout")}
        >
          <LogOut size={18} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
