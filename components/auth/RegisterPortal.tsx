"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Loader2, UserPlus, Users, ArrowRight } from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthProfessionalCard from "@/components/auth/AuthProfessionalCard";

const ORG_TYPES = [
  { value: "HOME", label: "משק בית" },
  { value: "FREELANCER", label: "עצמאי / עוסק" },
  { value: "COMPANY", label: "חברה" },
  { value: "ENTERPRISE", label: "ארגון / תאגיד" },
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

  const title = isOrgTeam ? "הצטרפות לצוות" : "בקשת הרשמה";
  const subtitle = isOrgTeam
    ? previewLoading
      ? "טוען פרטי הזמנה…"
      : preview
        ? `הוזמנתם ל־${preview.orgName} · ${ROLE_LABELS[preview.role] ?? preview.role}`
        : previewErr || "לא ניתן לטעון את פרטי ההזמנה."
    : isNewOrgInvite
      ? "הוזמנתם לרמת מנוי — ייווצר ארגון חדש ואתם תהיו מנהליו."
      : "מלאו פרטים — מנהל המערכת יאשר את המנוי.";

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition read-only:bg-slate-50 read-only:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15";

  return (
    <AuthPageShell secondaryNav={{ href: "/login", label: "כניסה" }}>
      <AuthProfessionalCard
        icon={
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isOrgTeam ? "bg-teal-50" : "bg-blue-50"}`}>
            {isOrgTeam
              ? <Users className="h-6 w-6 text-teal-600" aria-hidden />
              : <UserPlus className="h-6 w-6 text-blue-600" aria-hidden />
            }
          </div>
        }
        title={title}
        subtitle={subtitle}
      >
        {!previewErr && (isOrgTeam ? preview && !previewLoading : true) ? (
          <form
            className="mt-6 space-y-3"
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
                  setMsg(typeof data.message === "string" ? data.message : "הבקשה נקלטה בהצלחה.");
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
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">שם מלא</label>
              <input name="name" className={inputClass} />
            </div>
            {showOrgFields ? (
              <>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Building2 size={13} className="text-blue-500" aria-hidden />
                    שם ארגון / עסק
                  </label>
                  <input name="organizationName" required className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">סוג ישות</label>
                  <select name="orgType" className={inputClass} defaultValue="COMPANY">
                    {ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
            <button
              type="submit"
              disabled={loading || (isOrgTeam && (!preview || !!previewErr))}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition disabled:opacity-60 ${
                isOrgTeam ? "bg-teal-600 hover:bg-teal-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : null}
              {isOrgTeam ? "השלמת הצטרפות לצוות" : isNewOrgInvite ? "השלמת הרשמה" : "שליחת בקשת הרשמה"}
            </button>
          </form>
        ) : null}

        {err ? (
          <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {err}
          </p>
        ) : null}

        {msg ? (
          <div className="mt-5 space-y-3">
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-900">
              {msg}
            </p>
            <Link
              href="/login?registered=1"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition"
            >
              {isOrgTeam || isNewOrgInvite ? "מעבר לכניסה" : "המשך לכניסה (לאחר אישור)"}
            </Link>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col items-center">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition"
          >
            <ArrowRight size={13} aria-hidden />
            כבר רשומים? כניסה למערכת
          </Link>
        </div>
      </AuthProfessionalCard>
    </AuthPageShell>
  );
}
