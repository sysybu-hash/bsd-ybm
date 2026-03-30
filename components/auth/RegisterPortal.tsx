"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Loader2, UserPlus, Users, Sparkles, Mail } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthProfessionalCard from "@/components/auth/AuthProfessionalCard";

const ORG_TYPES = [
  { value: "HOME", label: "משק בית" },
  { value: "FREELANCER", label: "עצמאי" },
  { value: "COMPANY", label: "חברה" },
  { value: "ENTERPRISE", label: "ארגון" },
];

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "עובד / צוות",
  ORG_ADMIN: "מנהל ארגון",
  PROJECT_MGR: "מנהל פרויקטים",
  CLIENT: "לקוח / צופה",
};

type Preview = { orgName: string; role: string; emailHint: string };

type Props = Readonly<{
  inviteToken?: string;
  orgInviteToken?: string;
}>;

export default function RegisterPortal({ inviteToken, orgInviteToken }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(!!orgInviteToken);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  const isOrgTeam = !!orgInviteToken;
  const isNewOrgInvite = !!inviteToken && !isOrgTeam;
  const showOrgFields = !isOrgTeam;

  useEffect(() => {
    if (!orgInviteToken) return;
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      setPreviewErr(null);
      try {
        const res = await fetch(`/api/org-invite/preview?token=${encodeURIComponent(orgInviteToken)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setPreviewErr(typeof data.error === "string" ? data.error : "הזמנה לא תקפה");
          }
          return;
        }
        if (!cancelled) {
          setPreview({
            orgName: String(data.orgName ?? ""),
            role: String(data.role ?? "EMPLOYEE"),
            emailHint: String(data.emailHint ?? ""),
          });
        }
      } catch {
        if (!cancelled) setPreviewErr("שגיאת רשת בטעינת ההזמנה");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgInviteToken]);

  const iconSlot = (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-2 shadow-inner ${
        isOrgTeam
          ? "bg-gradient-to-br from-teal-100 to-emerald-50 ring-teal-200/70 shadow-teal-900/5"
          : "bg-gradient-to-br from-amber-100 to-orange-50 ring-amber-200/60 shadow-amber-900/5"
      }`}
    >
      {isOrgTeam ? (
        <Users className="h-7 w-7 text-teal-700" aria-hidden />
      ) : (
        <UserPlus className="h-7 w-7 text-amber-700" aria-hidden />
      )}
    </div>
  );

  const title = isOrgTeam ? "הצטרפות לצוות" : "בקשת הרשמה";
  const subtitle = isOrgTeam
    ? previewLoading
      ? "טוען פרטי הזמנה…"
      : preview
        ? `הוזמנתם ל־${preview.orgName} בתפקיד ${ROLE_LABELS[preview.role] ?? preview.role}. האימייל חייב להתאים להזמנה.`
        : previewErr || "לא ניתן לטעון את פרטי ההזמנה."
    : isNewOrgInvite
      ? "הוזמנתם לרמת מנוי — ייווצר ארגון חדש ואתם תהיו מנהליו. האימייל חייב להתאים להזמנה."
      : "מלאו פרטים — מנהל המערכת יאשר את המנוי. לאחר האישור תתאפשר כניסה עם Google או סיסמה.";

  return (
    <AuthPageShell secondaryNav={{ href: "/login", label: "כניסה" }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
      >
        <section className="order-2 max-w-md text-center lg:order-1 lg:text-start">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/90 px-3 py-1 text-xs font-bold text-orange-950 shadow-sm">
            <Mail className="h-3.5 w-3.5 text-orange-600" aria-hidden />
            הצטרפות לפלטפורמה
          </p>
          <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            הרשמה מבוקרת
            <br />
            <span className="bg-gradient-to-l from-amber-700 to-orange-600 bg-clip-text text-transparent">
              ואישור מנוי
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            כל בקשה נבדקת לפני הפעלה. קישורי הזמנה (ארגון או צוות) מזרזים את התהליך ומגדירים את התפקיד שלכם
            מראש.
          </p>
          <ul className="mt-6 hidden space-y-2.5 text-start text-sm text-slate-500 sm:block">
            <li className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              אינטגרציה עם Google לאחר אישור חשבון
            </li>
            <li className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              CRM · ERP · מרכז AI — לפי רמת המנוי
            </li>
          </ul>
        </section>

        <div className="order-1 w-full lg:order-2 lg:flex lg:justify-end">
          <AuthProfessionalCard icon={iconSlot} title={title} subtitle={typeof subtitle === "string" ? subtitle : ""}>
            {!previewErr && (isOrgTeam ? preview && !previewLoading : true) ? (
              <form
                className="mt-8 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErr(null);
                  setMsg(null);
                  setLoading(true);
                  const fd = new FormData(e.currentTarget);
                  try {
                    const res = await fetch("/api/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: fd.get("email"),
                        name: fd.get("name"),
                        organizationName: showOrgFields ? fd.get("organizationName") : "—",
                        orgType: showOrgFields ? fd.get("orgType") : "COMPANY",
                        inviteToken: isNewOrgInvite ? inviteToken : undefined,
                        orgInviteToken: isOrgTeam ? orgInviteToken : undefined,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setErr(typeof data.error === "string" ? data.error : "שגיאה");
                    } else {
                      setMsg(
                        typeof data.message === "string" ? data.message : "הבקשה נקלטה בהצלחה.",
                      );
                      (e.target as HTMLFormElement).reset();
                    }
                  } catch {
                    setErr("שגיאת רשת");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">אימייל</label>
                  <input
                    name="email"
                    type="email"
                    required
                    readOnly={isOrgTeam && !!preview?.emailHint}
                    defaultValue={preview?.emailHint ?? ""}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition read-only:bg-slate-50 read-only:text-slate-700 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">שם מלא</label>
                  <input
                    name="name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                {showOrgFields ? (
                  <>
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <Building2 size={14} className="text-amber-600" aria-hidden />
                        שם ארגון / עסק
                      </label>
                      <input
                        name="organizationName"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">סוג</label>
                      <select
                        name="orgType"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                        defaultValue="COMPANY"
                      >
                        {ORG_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
                <button
                  type="submit"
                  disabled={loading || (isOrgTeam && (!preview || !!previewErr))}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white shadow-lg transition disabled:opacity-60 ${
                    isOrgTeam
                      ? "bg-gradient-to-l from-teal-600 to-emerald-600 shadow-teal-500/20 hover:from-teal-500 hover:to-emerald-500"
                      : "bg-gradient-to-l from-amber-600 to-orange-600 shadow-orange-500/25 hover:from-amber-500 hover:to-orange-500"
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                  {isOrgTeam ? "השלמת הצטרפות לצוות" : isNewOrgInvite ? "השלמת הרשמה" : "שליחת בקשת הרשמה"}
                </button>
              </form>
            ) : null}

            {err ? (
              <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                {err}
              </p>
            ) : null}
            {msg ? (
              <div className="mt-6 space-y-3">
                <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-900">
                  {msg}
                </p>
                <Link
                  href="/login?registered=1"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-amber-600 to-orange-600 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:from-amber-500 hover:to-orange-500"
                >
                  {isOrgTeam || isNewOrgInvite ? "מעבר לכניסה" : "המשך לכניסה (לאחר אישור)"}
                </Link>
              </div>
            ) : null}

            <Link
              href="/login"
              className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 transition hover:text-amber-800"
            >
              כבר רשומים? כניסה למערכת
            </Link>
          </AuthProfessionalCard>
        </div>
      </motion.div>
    </AuthPageShell>
  );
}
