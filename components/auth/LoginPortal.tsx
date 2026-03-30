"use client";

import { getSession, signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  KeyRound,
  LogOut,
  UserCircle,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "next-auth";
import { loginErrorMessages, loginReasonMessages } from "@/lib/auth/login-messages";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthProfessionalCard from "@/components/auth/AuthProfessionalCard";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function navigateHard(href: string) {
  window.location.assign(href);
}

function safeInternalPath(raw: string | null | undefined, fallback: string): string {
  const s = (raw ?? "").trim();
  if (!s.startsWith("/") || s.startsWith("//")) return fallback;
  return s;
}

async function clearClientSessionCookie(): Promise<void> {
  try {
    await signOut({ redirect: false });
  } catch {
    /* noop */
  }
}

export default function LoginPortal() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const callbackUrl =
    registered === "1"
      ? "/dashboard?welcome=1"
      : safeInternalPath(searchParams.get("callbackUrl"), "/dashboard");
  const errorCode = searchParams.get("error");
  const reason = searchParams.get("reason");
  const oauthError = errorCode ? loginErrorMessages[errorCode] ?? loginErrorMessages.Default : null;
  const reasonText = reason ? loginReasonMessages[reason] ?? null : null;

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [sessionProbe, setSessionProbe] = useState<"idle" | "loading" | "done">("idle");
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const refreshLocalSession = useCallback(async () => {
    setSessionProbe("loading");
    const s = await getSession();
    const id = s?.user?.id?.trim() ?? "";
    if (id.length > 0) setActiveSession(s);
    else setActiveSession(null);
    setSessionProbe("done");
  }, []);

  useEffect(() => {
    void refreshLocalSession();
  }, [refreshLocalSession]);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      await clearClientSessionCookie();
      await signIn("google", { callbackUrl, redirect: true });
    } catch {
      setLoadingGoogle(false);
    }
  };

  const handleSwitchAccount = () => {
    void signOut({ callbackUrl: "/login", redirect: true });
  };

  const sessionEmail = (activeSession?.user?.email ?? "").trim();
  const sessionName = (activeSession?.user?.name ?? "").trim();
  const showActiveBanner = sessionProbe === "done" && activeSession != null && sessionEmail.length > 0;

  const iconSlot = (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 ring-2 ring-amber-200/60 shadow-inner shadow-amber-900/5">
      <ShieldCheck className="h-7 w-7 text-amber-700" aria-hidden />
    </div>
  );

  return (
    <AuthPageShell secondaryNav={{ href: "/register", label: "הרשמה" }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
      >
        <section className="order-2 max-w-md text-center lg:order-1 lg:text-start">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/90 px-3 py-1 text-xs font-bold text-amber-950 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            BSD-YBM Intelligence
          </p>
          <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            כניסה מאובטחת
            <br />
            <span className="bg-gradient-to-l from-amber-700 to-orange-600 bg-clip-text text-transparent">
              לעסק שלכם
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            CRM, ERP, בינה מלאכותית וסריקה רב־מנועית — במקום אחד. התחברות עם Google או סיסמה שסופקה
            על־ידי מנהל המערכת.
          </p>
          <ul className="mt-6 hidden space-y-2.5 text-start text-sm text-slate-500 sm:block">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              סשן נקי לפני כל כניסה — ללא „דליפה” בין משתמשים
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
              הצפנת עוגיות, OAuth 2.0 עם Google
            </li>
          </ul>
        </section>

        <div className="order-1 w-full lg:order-2 lg:flex lg:justify-end">
          <AuthProfessionalCard
            icon={iconSlot}
            title="כניסה למערכת"
            subtitle="בחרו Google או הזינו אימייל וסיסמה בהתאם להנחיות מנהל המערכת."
          >
            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400 sm:text-xs">
              לפני כל כניסה נמחקת עוגיית הסשן הקודמת — כדי שלא יישאר חשבון אחר פעיל בטעות.
            </p>

            {sessionProbe === "loading" ? (
              <div className="mt-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden />
              </div>
            ) : null}

            {showActiveBanner ? (
              <div className="mt-6 rounded-2xl border border-amber-200/90 bg-gradient-to-l from-amber-50 to-orange-50/80 px-4 py-4 text-sm text-amber-950 shadow-sm">
                <div className="flex items-start gap-3">
                  <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
                  <div className="min-w-0 flex-1 space-y-1 text-end">
                    <p className="font-bold">כבר מחוברים למערכת</p>
                    <p className="break-all text-xs text-amber-900/85">
                      {sessionName ? `${sessionName} · ` : null}
                      {sessionEmail}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
                  <button
                    type="button"
                    onClick={() => navigateHard(callbackUrl)}
                    className="rounded-xl bg-gradient-to-l from-amber-600 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 hover:from-amber-500 hover:to-orange-500"
                  >
                    המשך לדשבורד
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSwitchAccount()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-amber-300/80 bg-white/90 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-white"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden />
                    התנתקות וחשבון אחר
                  </button>
                </div>
              </div>
            ) : null}

            {(oauthError || reasonText) && (
              <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                {reasonText ?? oauthError}
              </p>
            )}

            <button
              type="button"
              disabled={loadingGoogle}
              onClick={() => void handleGoogle()}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-4 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingGoogle ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              ) : (
                <>
                  <GoogleMark className="h-5 w-5 shrink-0" />
                  המשך עם Google
                </>
              )}
            </button>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">או</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setCredError(null);
                const fd = new FormData(e.currentTarget);
                const email = String(fd.get("email") ?? "").trim();
                const password = String(fd.get("password") ?? "");
                if (!email || !password) {
                  setCredError("מלאו אימייל וסיסמה");
                  return;
                }
                setLoadingCreds(true);
                await clearClientSessionCookie();
                const res = await signIn("credentials", {
                  email,
                  password,
                  redirect: false,
                  callbackUrl,
                });
                setLoadingCreds(false);
                if (res?.error) {
                  setCredError("אימייל או סיסמה שגויים — או שאין סיסמה הופקה עדיין.");
                  return;
                }
                const fromApi = res?.url?.trim() ?? "";
                let dest = callbackUrl;
                if (fromApi.length > 0) {
                  try {
                    const nextHost = typeof window !== "undefined" ? window.location.host : "";
                    const u = new URL(fromApi, window.location.origin);
                    if (
                      u.host === nextHost &&
                      u.pathname.startsWith("/") &&
                      !u.pathname.startsWith("//")
                    ) {
                      dest = `${u.pathname}${u.search}${u.hash}`;
                    }
                  } catch {
                    dest = callbackUrl;
                  }
                }
                navigateHard(dest);
              }}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <KeyRound size={18} className="text-amber-600" aria-hidden />
                אימייל וסיסמה
              </div>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="email@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              />
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="סיסמה"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              />
              {credError ? <p className="text-center text-sm text-red-600">{credError}</p> : null}
              <button
                type="submit"
                disabled={loadingCreds}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-amber-600 to-orange-600 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-60"
              >
                {loadingCreds ? <Loader2 className="animate-spin" size={18} /> : null}
                כניסה מאובטחת
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              אין לכם חשבון?{" "}
              <Link href="/register" className="font-bold text-amber-700 underline-offset-2 hover:underline">
                בקשת הרשמה
              </Link>
            </p>

            <Link
              href="/"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 transition hover:text-amber-800"
            >
              חזרה לעמוד הבית
            </Link>
          </AuthProfessionalCard>
        </div>
      </motion.div>
    </AuthPageShell>
  );
}
