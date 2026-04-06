"use client";

import { getSession, signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Loader2,
  KeyRound,
  LogOut,
  UserCircle,
  ArrowRight,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "next-auth";
import { loginErrorMessages, loginReasonMessages } from "@/lib/auth/login-messages";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthProfessionalCard from "@/components/auth/AuthProfessionalCard";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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

  /**
   * signOut({ redirect: false }) שולח POST ל-/api/auth/signout עם CSRF token —
   * זה מה שמנקה את ה-httpOnly JWT cookie בשרת.
   * גישה ישנה (GET ל-/api/auth/signout) הציגה דף HTML ולא ניקתה כלום.
   */
  const handleGoogle = useCallback(async () => {
    setLoadingGoogle(true);
    try {
      await signOut({ redirect: false });
    } catch {
      /* no active session — continue anyway */
    }
    void signIn("google", { callbackUrl, redirect: true });
  }, [callbackUrl]);

  const handleSwitchAccount = useCallback(async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  }, []);

  const sessionEmail = (activeSession?.user?.email ?? "").trim();
  const sessionName = (activeSession?.user?.name ?? "").trim();
  const showActiveBanner = sessionProbe === "done" && activeSession != null && sessionEmail.length > 0;

  return (
    <AuthPageShell secondaryNav={{ href: "/register", label: "הרשמה" }}>
      <AuthProfessionalCard
        icon={
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15">
            <ShieldCheck className="h-6 w-6 text-indigo-400" aria-hidden />
          </div>
        }
        title="כניסה למערכת"
        subtitle="בחרו Google או הזינו אימייל וסיסמה"
      >
        {/* Session probe */}
        {sessionProbe === "loading" && (
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white/35" aria-hidden />
          </div>
        )}

        {/* Already connected banner */}
        {showActiveBanner ? (
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <UserCircle className="h-5 w-5 shrink-0 text-indigo-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white/75">מחוברים כ־{sessionName || sessionEmail}</p>
                {sessionName ? <p className="text-xs text-white/45 break-all">{sessionEmail}</p> : null}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => navigateHard(callbackUrl)}
                className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                המשך לדשבורד
              </button>
              <button
                type="button"
                onClick={() => handleSwitchAccount()}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0a0b14] px-3 py-2 text-xs font-bold text-white/65 hover:bg-white/[0.03] transition"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                החלף חשבון
              </button>
            </div>
          </div>
        ) : null}

        {/* Error messages */}
        {(oauthError || reasonText) && (
          <p className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-center text-sm text-rose-300">
            {reasonText ?? oauthError}
          </p>
        )}

        {/* Google button */}
        <button
          type="button"
          disabled={loadingGoogle}
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.05] py-3.5 text-sm font-bold text-white hover:bg-white/[0.08] transition disabled:opacity-60"
        >
          {loadingGoogle ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/45" />
          ) : (
            <>
              <GoogleMark className="h-5 w-5 shrink-0" />
              המשך עם Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-xs font-medium text-white/25">או</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        {/* Credentials form */}
        <form
          className="space-y-3"
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
            const res = await signIn("credentials", {
              email,
              password,
              redirect: false,
              callbackUrl,
            });
            setLoadingCreds(false);
            if (res?.error) {
              setCredError("אימייל או סיסמה שגויים — או שאין סיסמה עדיין.");
              return;
            }
            const fromApi = res?.url?.trim() ?? "";
            let dest = callbackUrl;
            if (fromApi.length > 0) {
              try {
                const nextHost = typeof window !== "undefined" ? window.location.host : "";
                const u = new URL(fromApi, window.location.origin);
                if (u.host === nextHost && u.pathname.startsWith("/") && !u.pathname.startsWith("//")) {
                  dest = `${u.pathname}${u.search}${u.hash}`;
                }
              } catch {
                dest = callbackUrl;
              }
            }
            navigateHard(dest);
          }}
        >
          <div className="flex items-center gap-2 pb-1 text-xs font-bold text-white/45">
            <KeyRound size={14} className="text-indigo-400" aria-hidden />
            אימייל וסיסמה (מנהל מערכת)
          </div>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="email@example.com"
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="סיסמה"
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
          />
          {credError ? <p className="text-center text-sm text-rose-400">{credError}</p> : null}
          <button
            type="submit"
            disabled={loadingCreds}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/15 py-3.5 text-sm font-bold text-white hover:bg-indigo-400 transition disabled:opacity-60 shadow-lg shadow-indigo-500/25"
          >
            {loadingCreds ? <Loader2 className="animate-spin" size={17} /> : null}
            כניסה
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <p className="text-xs text-white/45">
            אין לכם חשבון?{" "}
            <Link href="/register" className="font-bold text-indigo-400 hover:underline">
              הרשמה
            </Link>
          </p>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-white/35 hover:text-white/70 transition"
          >
            <ArrowRight size={13} aria-hidden />
            חזרה לאתר
          </Link>
        </div>
      </AuthProfessionalCard>
    </AuthPageShell>
  );
}
