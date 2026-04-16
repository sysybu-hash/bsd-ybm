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
  HardHat,
} from "lucide-react";
import { constructionTradeLabelHe, listConstructionTradesForSelect, normalizeConstructionTrade } from "@/lib/construction-trades";
import AuthPageShell from "@/components/auth/AuthPageShell";
import { useI18n } from "@/components/I18nProvider";

// ─── types ───────────────────────────────────────────────────────────────────

type Preview = { orgName: string; role: string; emailHint: string };
type WizardForm = {
  orgType: string;
  constructionTrade: string;
  name: string;
  email: string;
  organizationName: string;
};

type Props = Readonly<{ inviteToken?: string; orgInviteToken?: string; plan?: string }>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── component ───────────────────────────────────────────────────────────────

export default function RegisterPortal({ inviteToken, orgInviteToken, plan }: Props) {
  const { t, dir } = useI18n();
  const isTeamJoin = !!orgInviteToken;
  const isDirectPlan = !!plan;

  const ORG_TYPE_OPTIONS = [
    { value: "HOME", label: t("auth.register.types.home.label"), desc: t("auth.register.types.home.desc"), Icon: Home, activeBg: "bg-emerald-500/15", activeBorder: "border-emerald-500/40", activeText: "text-emerald-400", activeRing: "ring-emerald-500/30" },
    { value: "FREELANCER", label: t("auth.register.types.freelancer.label"), desc: t("auth.register.types.freelancer.desc"), Icon: Briefcase, activeBg: "bg-indigo-500/15", activeBorder: "border-indigo-500/40", activeText: "text-indigo-400", activeRing: "ring-indigo-500/30" },
    { value: "COMPANY", label: t("auth.register.types.company.label"), desc: t("auth.register.types.company.desc"), Icon: Building2, activeBg: "bg-indigo-500/15", activeBorder: "border-indigo-500/40", activeText: "text-indigo-400", activeRing: "ring-indigo-500/30" },
    { value: "ENTERPRISE", label: t("auth.register.types.enterprise.label"), desc: t("auth.register.types.enterprise.desc"), Icon: Factory, activeBg: "bg-orange-500/15", activeBorder: "border-orange-500/40", activeText: "text-orange-400", activeRing: "ring-orange-500/30" },
  ];

  const ROLE_LABELS: Record<string, string> = {
    EMPLOYEE: t("dashboard.crm"), 
    ORG_ADMIN: t("dashboard.admin"),
    CLIENT: t("dashboard.stats.clients"),
  };

  const steps = isTeamJoin
    ? [t("auth.register.steps.personal"), t("auth.register.steps.confirm")]
    : [
        t("auth.register.steps.type"), 
        t("nav.solutions"), 
        t("auth.register.steps.personal"), 
        t("auth.register.steps.orgName"), 
        t("auth.register.steps.confirm")
      ];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>({
    orgType: "COMPANY",
    constructionTrade: "GENERAL_CONTRACTOR",
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

  useEffect(() => {
    if (!orgInviteToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/org-invite/preview?token=${encodeURIComponent(orgInviteToken)}`);
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (cancelled) return;
        if (!res.ok) {
          setPreviewErr(typeof data.error === "string" ? data.error : "Invalid invite");
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
        if (!cancelled) setPreviewErr("Network error");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [orgInviteToken]);

  const set = (key: keyof WizardForm, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const totalSteps = steps.length;
  const isLast = step === totalSteps - 1;

  const canAdvance = (): boolean => {
    if (isTeamJoin) {
      if (step === 0) return form.name.trim().length > 0 && EMAIL_RE.test(form.email.trim());
      return true;
    }
    if (step === 0) return !!form.orgType;
    if (step === 1) return !!form.constructionTrade;
    if (step === 2) return form.name.trim().length > 0 && EMAIL_RE.test(form.email.trim());
    if (step === 3) return form.organizationName.trim().length >= 1;
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
          industry: "CONSTRUCTION",
          constructionTrade: isTeamJoin ? "GENERAL_CONTRACTOR" : normalizeConstructionTrade(form.constructionTrade),
          inviteToken: inviteToken || undefined,
          orgInviteToken: orgInviteToken || undefined,
          plan: plan || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Server error");
      } else {
        setDone(true);
      }
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, [form, inviteToken, orgInviteToken, isTeamJoin, plan]);

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition text-start";

  if (previewLoading) {
    return (
      <AuthPageShell secondaryNav={{ href: "/login", label: t("auth.register.loginLink") }}>
          <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="animate-spin" size={20} />
          Loading...
        </div>
      </AuthPageShell>
    );
  }

  if (previewErr) {
    return (
      <AuthPageShell secondaryNav={{ href: "/login", label: t("auth.register.loginLink") }}>
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-start">
          <p className="font-medium text-rose-700">{previewErr}</p>
          <Link href="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">{t("auth.register.backToLogin")}</Link>
        </div>
      </AuthPageShell>
    );
  }

  if (done) {
    return (
      <AuthPageShell secondaryNav={{ href: "/login", label: t("auth.register.loginLink") }}>
        <div className="w-full max-w-md text-center text-start" dir={dir}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            {isTeamJoin ? t("auth.register.success.titleTeam") : t("auth.register.success.title")}
          </h1>
          <p className="mt-3 leading-relaxed text-sm text-gray-500">
            {isTeamJoin ? t("auth.register.success.descTeam") : t("auth.register.success.desc")}
          </p>
          <Link href="/login?registered=1" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm">
            {t("auth.register.success.cta")}
            {dir === "rtl" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  const selectedType = ORG_TYPE_OPTIONS.find((o) => o.value === form.orgType);

  return (
    <AuthPageShell secondaryNav={{ href: "/login", label: t("auth.register.loginLink") }}>
      <div className="w-full max-w-lg" dir={dir}>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-1 w-full bg-gray-200">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
          </div>

          <div className="flex items-center justify-center gap-0 border-b border-gray-100 px-6 py-4">
            {steps.map((label, i) => (
              <div key={i} className="flex items-center">
                <div title={label} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${i < step ? "bg-indigo-500 text-white" : i === step ? "bg-indigo-600 text-white ring-4 ring-indigo-200" : "bg-gray-100 text-gray-400"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`mx-1.5 h-0.5 w-8 sm:w-14 transition-colors ${i < step ? "bg-indigo-400" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div className="px-8 pb-8 pt-6 text-start">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
              {t("auth.register.steps.step")} {step + 1} {t("auth.register.steps.of")} {totalSteps}
            </p>
            <h1 className="mb-6 text-xl font-black text-gray-900">{steps[step]}</h1>

            {!isTeamJoin && step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {ORG_TYPE_OPTIONS.map(({ value, label, desc, Icon, activeBg, activeBorder, activeText, activeRing }) => {
                  const active = form.orgType === value;
                  return (
                    <button key={value} type="button" onClick={() => set("orgType", value)} className={`flex flex-col items-center rounded-2xl border-2 p-5 text-center transition-all ${active ? `${activeBg} ${activeBorder} ring-2 ${activeRing}` : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"}`}>
                      <Icon size={28} className={active ? activeText : "text-gray-400"} />
                      <span className={`mt-2 block text-sm font-black ${active ? activeText : "text-gray-700"}`}>{label}</span>
                      <span className="mt-1 block text-xs leading-tight text-gray-400">{desc}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!isTeamJoin && step === 1 && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-gray-600">
                  BSD-YBM מיועדת לענף הבנייה והמקצועות הנלווים. בחרו את ההתמחות כדי להתאים פענוחי AI ומסמכים.
                </p>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-gray-500">סוג עסק / התמחות</span>
                  <select
                    value={form.constructionTrade}
                    onChange={(e) => set("constructionTrade", e.target.value)}
                    className={inputCls}
                  >
                    {listConstructionTradesForSelect().map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-xs text-gray-700">
                  <HardHat className="h-5 w-5 shrink-0 text-[color:var(--primary-color)]" aria-hidden />
                  <span>אפשר לשנות בהמשך בהגדרות הארגון.</span>
                </div>
              </div>
            )}

            {((!isTeamJoin && step === 2) || (isTeamJoin && step === 0)) && (
              <div className="space-y-4">
                {isTeamJoin && preview && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm">
                    <p className="font-black text-teal-800">{t("auth.register.summary.joining")}: {preview.orgName}</p>
                    <p className="mt-0.5 text-teal-600">{ROLE_LABELS[preview.role] ?? preview.role}</p>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">{t("auth.register.labels.fullName")}</label>
                  <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("auth.register.placeholders.fullName")} className={inputCls} autoFocus />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">{t("auth.register.labels.email")}</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" dir="ltr" readOnly={isTeamJoin && !!preview?.emailHint} className={`${inputCls} ${isTeamJoin && preview?.emailHint ? "bg-gray-50 text-gray-400" : ""}`} />
                  {!isTeamJoin && <p className="mt-1.5 text-xs text-gray-400">{t("auth.register.help.email")}</p>}
                </div>
              </div>
            )}

            {!isTeamJoin && step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">
                    {form.orgType === "HOME" ? t("auth.register.labels.orgNameHome") : form.orgType === "FREELANCER" ? t("auth.register.labels.orgNameFreelancer") : t("auth.register.labels.orgNameCompany")}
                  </label>
                  <input type="text" value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} placeholder={form.orgType === "HOME" ? t("auth.register.placeholders.orgNameHome") : form.orgType === "FREELANCER" ? t("auth.register.placeholders.orgNameFreelancer") : t("auth.register.placeholders.orgNameCompany")} className={inputCls} autoFocus />
                </div>
                <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">{t("auth.register.help.orgName")}</p>
              </div>
            )}

            {isLast && (
              <div className="space-y-4">
                <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  {!isTeamJoin && selectedType && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-500">{t("auth.register.summary.type")}</span>
                      <span className="flex items-center gap-1.5 font-black text-gray-900"><selectedType.Icon size={14} className={selectedType.activeText} />{selectedType.label}</span>
                    </div>
                  )}
                  {!isTeamJoin && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-500">התמחות</span>
                      <span className="font-black text-gray-900">
                        {constructionTradeLabelHe(normalizeConstructionTrade(form.constructionTrade))}
                      </span>
                    </div>
                  )}
                  {!isTeamJoin && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-500">{t("auth.register.summary.orgName")}</span>
                      <span className="font-black text-gray-900">{form.organizationName}</span>
                    </div>
                  )}
                  {isTeamJoin && preview && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-500">{t("auth.register.summary.joining")}</span>
                      <span className="font-black text-gray-900">{preview.orgName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-gray-500">{t("auth.register.summary.name")}</span>
                    <span className="font-black text-gray-900">{form.name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-gray-500">{t("auth.register.summary.email")}</span>
                    <span dir="ltr" className="font-mono text-xs font-bold text-gray-700">{form.email}</span>
                  </div>
                </div>
                {err && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">{err}</p>}
                <button type="button" disabled={loading} onClick={handleSubmit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-sm font-black text-white hover:bg-indigo-700 transition disabled:opacity-60 shadow-sm">
                  {loading ? <Loader2 className="animate-spin" size={17} /> : <MailCheck size={17} />}
                  {isTeamJoin ? t("auth.register.submitTeam") : t("auth.register.submit")}
                </button>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              {step > 0 ? (
                <button type="button" onClick={() => { setErr(null); setStep((s) => s - 1); }} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition">
                  {dir === "rtl" ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  {t("auth.register.back")}
                </button>
              ) : (
                <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition">
                  {dir === "rtl" ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  {t("auth.register.backToLogin")}
                </Link>
              )}
              {!isLast && (
                <button type="button" disabled={!canAdvance()} onClick={() => setStep((s) => s + 1)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-40 shadow-sm">
                  {t("auth.register.next")}
                  {dir === "rtl" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          {t("auth.register.alreadyHave")}{" "}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">{t("auth.register.loginLink")}</Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
