"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

type Props = {
  /** ערכי גיבוי מהשרת לפני הידרציית session */
  fallbackEmail: string | null;
  fallbackImage: string | null;
};

export default function UserBadge({ fallbackEmail, fallbackImage }: Props) {
  const { data: session, status } = useSession();
  const { t, dir } = useI18n();

  const email =
    (session?.user?.email ?? fallbackEmail ?? "").trim() || "—";
  const image = session?.user?.image ?? fallbackImage;
  const loading = status === "loading";

  return (
    <div
      className="flex max-w-[min(100%,22rem)] items-center gap-2 rounded-full border border-amber-200/40 bg-gradient-to-l from-slate-900 via-slate-900 to-slate-800 py-1.5 ps-1.5 pe-2 shadow-lg shadow-amber-900/20 ring-1 ring-slate-600/50"
      dir={dir}
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-amber-400/60 ring-offset-2 ring-offset-slate-900">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-200/30 to-slate-600 text-xs font-black text-amber-100">
            {email.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-end">
        <p className="truncate text-[11px] font-medium text-slate-400" title={email}>
          {loading ? "…" : email}
        </p>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="shrink-0 rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-[11px] font-bold text-amber-100 transition hover:border-amber-400/50 hover:bg-slate-700"
      >
        <span className="inline-flex items-center gap-1">
          <LogOut size={12} className="opacity-80" />
          {t("dashboard.logout")}
        </span>
      </button>
    </div>
  );
}
