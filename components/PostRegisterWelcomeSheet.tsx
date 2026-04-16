"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, Wifi, WifiOff } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const STORAGE_KEY = "bsd_welcome_sheet_done";

/**
 * חלונית לאחר הרשמה / כניסה ראשונה — תמונה, סטטוס חיבור, התנתקות.
 */
export default function PostRegisterWelcomeSheet() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || status !== "authenticated") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    const u = new URL(window.location.href);
    if (u.searchParams.get("welcome") === "1") {
      setOpen(true);
      u.searchParams.delete("welcome");
      const qs = u.searchParams.toString();
      window.history.replaceState({}, "", `${u.pathname}${qs ? `?${qs}` : ""}`);
    }
  }, [status]);

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  if (!open || !session?.user) return null;

  const connected = status === "authenticated";
  const img = session.user.image;
  const name = session.user.name ?? "משתמש";
  const email = session.user.email ?? "";

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-gray-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bsd-welcome-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/60" dir="rtl">
        <h2 id="bsd-welcome-title" className="text-center text-xl font-black text-gray-900">
          ברוך הבא ל־BSD-YBM
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">החשבון שלך מחובר ומוכן לעבודה</p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-teal-500/20 bg-gray-50 shadow-inner">
            {img ? (
              <Image src={img} alt="" fill className="object-cover" sizes="96px" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-black text-teal-300">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{name}</p>
            <p className="text-sm text-gray-400">{email}</p>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
              connected ? "bg-emerald-500/15 text-emerald-800" : "bg-teal-500/15 text-white"
            }`}
          >
            {connected ? <Wifi size={16} aria-hidden /> : <WifiOff size={16} aria-hidden />}
            {connected ? "מחובר למערכת" : "בודק חיבור…"}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-100 bg-rose-500/[0.08] py-3.5 text-sm font-black text-rose-300 transition hover:bg-red-100"
          >
            <LogOut size={18} aria-hidden />
            התנתק
          </button>
          <button
            type="button"
            onClick={close}
            className="w-full rounded-2xl bg-teal-600 py-3.5 text-sm font-black text-white shadow-lg shadow-teal-500/25 hover:bg-teal-500/15"
          >
            המשך לדשבורד
          </button>
        </div>
      </div>
    </div>
  );
}
