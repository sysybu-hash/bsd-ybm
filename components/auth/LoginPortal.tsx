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
import { useI18n } from "@/components/I18nProvider";

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
  const { t, dir } = useI18n();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const callbackUrl =
    registered === "1"
      ? "/app?welcome=1"
      : safeInternalPath(searchParams.get("callbackUrl"), "/app");
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
    <AuthPageShell secondaryNav={{ href: "/register", label: t("auth.login.registerLink") }}>
      <AuthProfessionalCard
        icon={
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
            <ShieldCheck className="h-6 w-6 text-indigo-600" aria-hidden />
          </div>
        }
        title={t("auth.login.title")}
        subtitle={t("auth.login.subtitle")}
      >
        {/* Session probe */}
        {sessionProbe === "loading" && (
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" aria-hidden />
          </div>
        )}

        {/* Already connected banner */}
        {showActiveBanner ? (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-start">
            <div className="flex items-center gap-3">
              <UserCircle className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-800">{t("auth.login.connectedAs")}{sessionName || sessionEmail}</p>
                {sessionName ? <p className="text-xs text-gray-400 break-all">{sessionEmail}</p> : null}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => navigateHard(callbackUrl)}
                className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                {t("auth.login.continueToDashboard")}
              </button>
              <button
                type="button"
                onClick={() => handleSwitchAccount()}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                {t("auth.login.switchAccount")}
              </button>
            </div>
          </div>
        ) : null}

        {/* Error messages */}
        {(oauthError || reasonText) && (
          <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
            {reasonText ?? oauthError}
          </p>
        )}

        {/* Google button */}
        <button
          type="button"
          disabled={loadingGoogle}
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-800 hover:bg-gray-50 transition disabled:opacity-60 shadow-sm"
        >
          {loadingGoogle ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          ) : (
            <>
              <GoogleMark className="h-5 w-5 shrink-0" />
              {t("auth.login.google")}
            </>
          )}
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium text-gray-400">{t("auth.login.or")}</span>
          <div className="h-px flex-1 bg-gray-200" />
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
              setCredError(t("auth.login.errorEmpty"));
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
              setCredError(t("auth.login.errorInvalid"));
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
          <div className="flex items-center gap-2 pb-1 text-xs font-bold text-gray-500 text-start">
            <KeyRound size={14} className="text-indigo-600" aria-hidden />
            {t("auth.login.credsLabel")}
          </div>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("auth.login.emailPlaceholder")}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-start"
          />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={t("auth.login.passwordPlaceholder")}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-start"
          />
          {credError ? <p className="text-center text-sm text-rose-600">{credError}</p> : null}
          <button
            type="submit"
            disabled={loadingCreds}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-60 shadow-sm"
          >
            {loadingCreds ? <Loader2 className="animate-spin" size={17} /> : null}
            {t("auth.login.submit")}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <p className="text-xs text-gray-500">
            {t("auth.login.noAccount")}{" "}
            <Link href="/register" className="font-bold text-indigo-600 hover:underline">
              {t("auth.login.registerLink")}
            </Link>
          </p>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition"
          >
            <ArrowRight size={13} aria-hidden />
            {t("auth.login.backToSite")}
          </Link>
        </div>
      </AuthProfessionalCard>
    </AuthPageShell>
  );
}
