"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { useState } from "react";

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

const errorMessages: Record<string, string> = {
  Configuration: "בעיית הגדרת שרת (בדוק משתני סביבה ל-Google).",
  AccessDenied: "הגישה נדחתה.",
  Verification: "פג תוקף קישור האימות. נסה שוב.",
  OAuthAccountNotLinked:
    "האימייל כבר קיים במערכת — נסה שוב להתחבר עם Google (אמור להיקשר אוטומטית).",
  CredentialsSignin: "התחברות נכשלה — בדקו אימייל וסיסמה.",
  Default: "התחברות נכשלה. נסה שוב.",
};

const reasonMessages: Record<string, string> = {
  no_account: "אין חשבון פעיל עבור אימייל זה. נא להירשם או לפנות למנהל המערכת.",
  pending: "החשבון ממתין לאישור מנוי על ידי מנהל המערכת.",
  blocked: "התחברות חסומה עבור כתובת זו. פנו למנהל המערכת.",
  allowlist: "כתובת זו אינה ברשימת ההתרה להתחברות. רק חשבונות מורשים יכולים להיכנס.",
};

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registered = searchParams.get("registered");
  const callbackUrl =
    registered === "1"
      ? "/dashboard?welcome=1"
      : searchParams.get("callbackUrl") || "/dashboard";
  const errorCode = searchParams.get("error");
  const reason = searchParams.get("reason");
  const oauthError = errorCode ? errorMessages[errorCode] ?? errorMessages.Default : null;
  const reasonText = reason ? reasonMessages[reason] ?? null : null;

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex flex-col"
      dir="rtl"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -end-32 h-96 w-96 rounded-full blur-[100px] opacity-20"
          style={{ backgroundColor: "var(--primary-color, #3b82f6)" }}
        />
        <div className="absolute bottom-0 -start-24 h-72 w-72 rounded-full bg-emerald-200/30 blur-[90px]" />
      </div>

      <header className="relative z-10 border-b border-slate-100 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-xl font-black italic tracking-tighter"
            style={{ color: "var(--primary-color, #3b82f6)" }}
          >
            BSD-YBM<span className="text-slate-900">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="text-sm font-bold text-blue-600 hover:text-blue-500"
            >
              הרשמה
            </Link>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              חזרה לאתר
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-10 shadow-2xl shadow-slate-200/60"
        >
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <h1 className="text-center text-2xl font-black italic text-slate-900">כניסה למערכת</h1>
          <p className="mt-2 text-center text-sm text-slate-500 leading-relaxed">
            Google — או אימייל וסיסמה אם הופקו על ידי מנהל המערכת.
          </p>

          {(oauthError || reasonText) && (
            <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {reasonText ?? oauthError}
            </p>
          )}

          <button
            type="button"
            disabled={loadingGoogle}
            onClick={() => {
              setLoadingGoogle(true);
              void signIn("google", { callbackUrl });
            }}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-60"
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

          <div className="my-8 flex items-center gap-4 text-slate-300">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold text-slate-400">או</span>
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
              if (res?.url) {
                router.push(res.url);
                router.refresh();
              } else {
                router.push(callbackUrl);
                router.refresh();
              }
            }}
          >
            <div className="flex items-center gap-2 text-slate-700 text-sm font-bold">
              <KeyRound size={18} className="text-blue-500" />
              אימייל וסיסמה
            </div>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="אימייל"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="סיסמה"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            {credError && (
              <p className="text-sm text-red-600 text-center">{credError}</p>
            )}
            <button
              type="submit"
              disabled={loadingCreds}
              className="w-full rounded-2xl bg-slate-900 hover:bg-black text-white py-3.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loadingCreds ? <Loader2 className="animate-spin" size={18} /> : null}
              כניסה
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
            משתמשי Google: רק לאחר אישור מנוי יופיע החשבון כפעיל. חדשים?{" "}
            <Link href="/register" className="font-bold text-blue-600">
              הרשמה
            </Link>
          </p>

          <Link
            href="/"
            className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            עמוד הבית
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
