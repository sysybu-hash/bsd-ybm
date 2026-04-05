"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Briefcase,
  Building2,
  Factory,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MailCheck,
} from "lucide-react";
import AuthPageShell from "@/components/auth/AuthPageShell";

// ─── constants ────────────────────────────────────────────────────────────────

const ORG_TYPE_OPTIONS = [
  {
    value: "HOME",
    label: "משק בית",
    desc: "ניהול אישי ומשפחתי",
    Icon: Home,
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-400",
    activeText: "text-emerald-700",
    activeRing: "ring-emerald-300",
  },
  {
    value: "FREELANCER",
    label: "עצמאי / עוסק",
    desc: "פרילנסר, יועץ, בעל מקצוע",
    Icon: Briefcase,
    activeBg: "bg-indigo-50",
    activeBorder: "border-indigo-400",
    activeText: "text-indigo-700",
    activeRing: "ring-indigo-300",
  },
  {
    value: "COMPANY",
    label: "חברה",
    desc: 'חברה בע"מ, סטארטאפ',
    Icon: Building2,
    activeBg: "bg-indigo-50",
    activeBorder: "border-indigo-400",
    activeText: "text-indigo-700",
    activeRing: "ring-indigo-300",
  },
  {
    value: "ENTERPRISE",
    label: "ארגון / תאגיד",
    desc: "ארגון גדול, עמותה, תאגיד",
    Icon: Factory,
    activeBg: "bg-orange-50",
    activeBorder: "border-orange-400",
    activeText: "text-orange-700",
    activeRing: "ring-orange-300",
  },
] as const;

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "עובד / צוות",
  ORG_ADMIN: "מנהל ארגון",
  PROJECT_MGR: "מנהל פרויקטים",
  CLIENT: "לקוח / צופה",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── types ───────────────────────────────────────────────────────────────────

type Preview = { orgName: string; role: string; emailHint: string };
type WizardForm = {
  orgType: string;
  name: string;
  email: string;
  organizationName: string;
};

type Props = Readonly<{ inviteToken?: string; orgInviteToken?: string }>;

// ─── component ───────────────────────────────────────────────────────────────

export default function RegisterPortal({ inviteToken, orgInviteToken }: Props) {
  const isTeamJoin = !!orgInviteToken;

  /**
   * Regular flow   : 0=סוג עסק  1=פרטים אישיים  2=שם הארגון  3=אישור ושליחה
   * Team join flow : 0=פרטים אישיים  1=אישור
   */
  const steps = isTeamJoin
    ? ["פרטים אישיים", "אישור ושליחה"]
    : ["סוג עסק", "פרטים אישיים", "שם הארגון", "אישור ושליחה"];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>({
    orgType: "COMPANY",
    name: "",
    email: "",
    organizationName: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(!!orgInviteToken);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  // Load team-invite preview
  useEffect(() => {
    if (!orgInviteToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/org-invite/preview?token=${encodeURIComponent(orgInviteToken)}`,
        );
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (cancelled) return;
        if (!res.ok) {
          setPreviewErr(typeof data.error === "string" ? data.error : "הזמנה לא תקפה");
        } else {
          const hint = String(data.emailHint ?? "");
          setPreview({
            orgName: String(data.orgName ?? ""),
            role: String(data.role ?? "EMPLOYEE"),
            emailHint: hint,
          });
          if (hint) setForm((f) => ({ ...f, email: hint }));
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

  const set = (key: keyof WizardForm, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const totalSteps = steps.length;
  const isLast = step === totalSteps - 1;

  const canAdvance = (): boolean => {
    if (isTeamJoin) {
      if (step === 0)
        return form.name.trim().length > 0 && EMAIL_RE.test(form.email.trim());
      return true;
    }
    if (step === 0) return !!form.orgType;
    if (step === 1)
      return form.name.trim().length > 0 && EMAIL_RE.test(form.email.trim());
    if (step === 2) return form.organizationName.trim().length >= 1;
    return true;
  };

  const handleSubmit = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          name: form.name.trim() || null,
          organizationName: isTeamJoin ? "—" : form.organizationName.trim(),
          orgType: isTeamJoin ? "COMPANY" : form.orgType,
          inviteToken: inviteToken || undefined,
          orgInviteToken: orgInviteToken || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "שגיאה בשרת");
      } else {
        setDone(true);
      }
    } catch {
      setErr("שגיאת רשת — בדקו חיבור לאינטרנט");
    } finally {
      setLoading(false);
    }
  }, [form, inviteToken, orgInviteToken, isTeamJoin]);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition";

  // ── Loading preview ────────────────────────────────────────────────────────
  if (previewLoading) {
    return (
      <AuthPageShell secondaryNav={{ href: "/login", label: "כניסה" }}>
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          טוען פרטי הזמנה…
        </div>
      </AuthPageShell>
    );
  }

  // ── Invalid invite ────────────────────────────────────────────────────────
  if (previewErr) {
    return (
      <AuthPageShell secondaryNav={{ href: "/login", label: "כניסה" }}>
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-700">{previewErr}</p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
          >
            חזרה לכניסה
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <AuthPageShell secondaryNav={{ href: "/login", label: "כניסה" }}>
        <div className="w-full max-w-md text-center" dir="rtl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            {isTeamJoin ? "ברוכים הבאים לצוות!" : "הבקשה נשלחה בהצלחה!"}
          </h1>
          <p className="mt-3 leading-relaxed text-sm text-gray-500">
            {isTeamJoin
              ? `הצטרפתם ל־${preview?.orgName ?? "הארגון"} בתור ${ROLE_LABELS[preview?.role ?? ""] ?? preview?.role ?? ""}. כעת היכנסו עם Google.`
              : "קיבלנו את בקשתכם — מנהל המערכת יאשר תוך 24 שעות. לאחר אישור תוכלו להיכנס."}
          </p>
          <Link
            href="/login?registered=1"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition"
          >
            מעבר לכניסה
            <ArrowLeft size={15} />
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────
  const selectedType = ORG_TYPE_OPTIONS.find((o) => o.value === form.orgType);

  return (
    <AuthPageShell secondaryNav={{ href: "/login", label: "כניסה" }}>
      <div className="w-full max-w-lg" dir="rtl">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Progress bar */}
          <div className="h-1 w-full bg-gray-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-0 border-b border-gray-100 px-6 py-4">
            {steps.map((label, i) => (
              <div key={i} className="flex items-center">
                <div
                  title={label}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${
                    i < step
                      ? "bg-indigo-600 text-white"
                      : i === step
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mx-1.5 h-0.5 w-8 sm:w-14 transition-colors ${
                      i < step ? "bg-indigo-400" : "bg-gray-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="px-8 pb-8 pt-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
              שלב {step + 1} מתוך {totalSteps}
            </p>
            <h1 className="mb-6 text-xl font-black text-gray-900">{steps[step]}</h1>

            {/* ── STEP: סוג עסק (regular, step 0) ── */}
            {!isTeamJoin && step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {ORG_TYPE_OPTIONS.map(
                  ({ value, label, desc, Icon, activeBg, activeBorder, activeText, activeRing }) => {
                    const active = form.orgType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set("orgType", value)}
                        className={`flex flex-col items-center rounded-2xl border-2 p-5 text-center transition-all ${
                          active
                            ? `${activeBg} ${activeBorder} ring-2 ${activeRing}`
                            : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                        }`}
                      >
                        <Icon
                          size={28}
                          className={active ? activeText : "text-gray-400"}
                        />
                        <span
                          className={`mt-2 block text-sm font-black ${
                            active ? activeText : "text-gray-700"
                          }`}
                        >
                          {label}
                        </span>
                        <span className="mt-1 block text-xs leading-tight text-gray-400">
                          {desc}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            )}

            {/* ── STEP: פרטים אישיים ── */}
            {((!isTeamJoin && step === 1) || (isTeamJoin && step === 0)) && (
              <div className="space-y-4">
                {isTeamJoin && preview && (
                  <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm">
                    <p className="font-black text-teal-900">הצטרפות ל: {preview.orgName}</p>
                    <p className="mt-0.5 text-teal-600">
                      תפקיד: {ROLE_LABELS[preview.role] ?? preview.role}
                    </p>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">
                    שם מלא
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="שם פרטי ומשפחה"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="your@email.com"
                    dir="ltr"
                    readOnly={isTeamJoin && !!preview?.emailHint}
                    className={`${inputCls} ${
                      isTeamJoin && preview?.emailHint
                        ? "bg-gray-50 text-gray-600"
                        : ""
                    }`}
                  />
                  {!isTeamJoin && (
                    <p className="mt-1.5 text-xs text-gray-400">
                      השתמשו באימייל Google — הכניסה למערכת תהיה עם אותו כתובת
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP: שם הארגון (regular, step 2) ── */}
            {!isTeamJoin && step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">
                    {form.orgType === "HOME"
                      ? "שם המשפחה / שם לניהול"
                      : form.orgType === "FREELANCER"
                        ? "שם העסק שלך"
                        : "שם החברה / הארגון"}
                  </label>
                  <input
                    type="text"
                    value={form.organizationName}
                    onChange={(e) => set("organizationName", e.target.value)}
                    placeholder={
                      form.orgType === "HOME"
                        ? "למשל: משפחת כהן"
                        : form.orgType === "FREELANCER"
                          ? "למשל: יועץ מס — ישראל ישראלי"
                          : "שם החברה"
                    }
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
                  השם יופיע בחשבוניות, במסמכים ובממשק המערכת. ניתן לשנות בהגדרות לאחר
                  ההרשמה.
                </p>
              </div>
            )}

            {/* ── STEP: אישור ושליחה (last) ── */}
            {isLast && (
              <div className="space-y-4">
                <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
                  {!isTeamJoin && selectedType && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-500">סוג עסק</span>
                      <span className="flex items-center gap-1.5 font-black text-gray-800">
                        <selectedType.Icon size={14} className={selectedType.activeText} />
                        {selectedType.label}
                      </span>
                    </div>
                  )}
                  {!isTeamJoin && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-500">שם הארגון</span>
                      <span className="font-black text-gray-800">{form.organizationName}</span>
                    </div>
                  )}
                  {isTeamJoin && preview && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-500">הצטרפות ל</span>
                      <span className="font-black text-gray-800">{preview.orgName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-gray-500">שם</span>
                    <span className="font-black text-gray-800">{form.name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-gray-500">אימייל</span>
                    <span dir="ltr" className="font-mono text-xs font-bold text-gray-800">
                      {form.email}
                    </span>
                  </div>
                </div>

                {err && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                    {err}
                  </p>
                )}

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-black text-white hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <MailCheck size={17} />
                  )}
                  {isTeamJoin ? "השלמת הצטרפות לצוות" : "שליחת בקשת הרשמה"}
                </button>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="mt-6 flex items-center justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => { setErr(null); setStep((s) => s - 1); }}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition"
                >
                  <ArrowRight size={15} />
                  חזרה
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition"
                >
                  <ArrowRight size={15} />
                  חזרה לכניסה
                </Link>
              )}

              {!isLast && (
                <button
                  type="button"
                  disabled={!canAdvance()}
                  onClick={() => setStep((s) => s + 1)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-40"
                >
                  המשך
                  <ArrowLeft size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          כבר רשומים?{" "}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            כניסה למערכת
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
