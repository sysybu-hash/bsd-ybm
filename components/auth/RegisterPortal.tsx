"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
  Network,
} from "lucide-react";
import { mergeConstructionTradeLabel } from "@/lib/construction-trades-i18n";
import { CONSTRUCTION_TRADE_IDS, constructionTradeLabelHe, normalizeConstructionTrade } from "@/lib/construction-trades";
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

const HERO_BULLETS_HE = [
  "סריקה ופענוח חשבוניות אוטומטי (ERP)",
  "ניהול פרויקטים אדפטיבי מבוסס AI",
  "סנכרון מלא למערכת מקאנו",
  "התאמה מלאה למקצועות הבנייה השונים",
] as const;

// ─── component ───────────────────────────────────────────────────────────────

export default function RegisterPortal({ inviteToken, orgInviteToken, plan }: Props) {
  const { t, dir, messages } = useI18n();
  const tradeSelectOptions = useMemo(
    () =>
      CONSTRUCTION_TRADE_IDS.map((id) => ({
        id,
        label: mergeConstructionTradeLabel(messages, id, constructionTradeLabelHe(id)),
      })),
    [messages],
  );
  const isTeamJoin = !!orgInviteToken;

  const ORG_TYPE_OPTIONS = [
    { value: "HOME", label: t("auth.register.types.home.label"), desc: t("auth.register.types.home.desc"), Icon: Home, activeBg: "bg-emerald-500/15", activeBorder: "border-emerald-500/50", activeText: "text-emerald-400", activeRing: "ring-emerald-500/25" },
    { value: "FREELANCER", label: t("auth.register.types.freelancer.label"), desc: t("auth.register.types.freelancer.desc"), Icon: Briefcase, activeBg: "bg-teal-500/15", activeBorder: "border-teal-500/50", activeText: "text-teal-300", activeRing: "ring-teal-500/25" },
    { value: "COMPANY", label: t("auth.register.types.company.label"), desc: t("auth.register.types.company.desc"), Icon: Building2, activeBg: "bg-teal-500/15", activeBorder: "border-teal-500/50", activeText: "text-teal-300", activeRing: "ring-teal-500/25" },
    { value: "ENTERPRISE", label: t("auth.register.types.enterprise.label"), desc: t("auth.register.types.enterprise.desc"), Icon: Factory, activeBg: "bg-orange-500/15", activeBorder: "border-orange-500/50", activeText: "text-orange-300", activeRing: "ring-orange-500/25" },
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
        t("auth.register.steps.confirm"),
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
    return () => {
      cancelled = true;
    };
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

  const inputCls =
    "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition text-start";

  const splitShell = (formColumn: ReactNode) => (
    <div
      className="flex min-h-screen flex-col bg-slate-950 font-sans rtl text-white lg:flex-row"
      dir={dir}
    >
      <div className="relative z-10 flex w-full flex-col justify-center bg-slate-950 px-8 py-12 sm:px-16 md:px-24 xl:px-32 lg:w-1/2">
        <Link
          href="/"
          className="absolute end-8 top-8 flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ArrowRight size={16} /> חזרה לדף הבית
        </Link>
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-brand text-xl font-bold text-white shadow-lg shadow-brand/20">
              B
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">BSD-YBM</span>
          </div>
          {formColumn}
        </div>
      </div>
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden border-s border-slate-800/50 bg-slate-900 lg:flex">
        {/* אפקט רשת (Grid) מבוסס Tailwind CSS בלבד */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute start-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[120px]" />
        <div className="relative z-10 max-w-md p-8">
          <Network className="mb-6 text-brand-light" size={48} />
          <h2 className="mb-6 text-4xl font-bold leading-tight text-white">
            השדרה שמחברת <br />
            את כל הפרויקטים שלך.
          </h2>
          <div className="space-y-4">
            {HERO_BULLETS_HE.map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="shrink-0 text-emerald-500" size={20} />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (previewLoading) {
    return splitShell(
      <div className="flex items-center gap-3 text-slate-400">
        <Loader2 className="animate-spin" size={20} />
        {t("auth.register.steps.step")}…
      </div>,
    );
  }

  if (previewErr) {
    return splitShell(
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
        <p className="font-medium text-rose-200">{previewErr}</p>
        <Link href="/login" className="mt-4 inline-block text-sm text-brand-light hover:underline">
          {t("auth.register.backToLogin")}
        </Link>
      </div>,
    );
  }

  if (done) {
    return splitShell(
      <div className="text-center" dir={dir}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-white">
          {isTeamJoin ? t("auth.register.success.titleTeam") : t("auth.register.success.title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {isTeamJoin ? t("auth.register.success.descTeam") : t("auth.register.success.desc")}
        </p>
        <Link
          href="/login?registered=1"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
        >
          {t("auth.register.success.cta")}
          {dir === "rtl" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
        </Link>
      </div>,
    );
  }

  const selectedType = ORG_TYPE_OPTIONS.find((o) => o.value === form.orgType);

  return splitShell(
    <>
      <h1 className="mb-2 text-3xl font-bold text-white">צור חשבון ארגוני</h1>
      <p className="mb-8 text-sm text-slate-400">{t("publicShell.authHeroLead")}</p>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
        <div className="h-1 w-full bg-slate-800">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-0 border-b border-slate-800 px-6 py-4">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center">
              <div
                title={label}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${
                  i < step
                    ? "bg-brand text-white"
                    : i === step
                      ? "bg-brand text-white ring-4 ring-brand/30"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-1.5 h-0.5 w-8 sm:w-14 transition-colors ${
                    i < step ? "bg-brand/80" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="px-8 pb-8 pt-6 text-start">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-light">
            {t("auth.register.steps.step")} {step + 1} {t("auth.register.steps.of")} {totalSteps}
          </p>
          <h2 className="mb-6 text-xl font-black text-white">{steps[step]}</h2>

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
                          : "border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon size={28} className={active ? activeText : "text-slate-500"} />
                      <span className={`mt-2 block text-sm font-black ${active ? activeText : "text-slate-200"}`}>
                        {label}
                      </span>
                      <span className="mt-1 block text-xs leading-tight text-slate-500">{desc}</span>
                    </button>
                  );
                },
              )}
            </div>
          )}

          {!isTeamJoin && step === 1 && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-slate-400">{t("auth.register.construction.lead")}</p>
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-500">
                  {t("auth.register.construction.selectLabel")}
                </span>
                <select
                  value={form.constructionTrade}
                  onChange={(e) => set("constructionTrade", e.target.value)}
                  className={inputCls}
                >
                  {tradeSelectOptions.map(({ id, label }) => (
                    <option key={id} value={id} className="bg-slate-900">
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-slate-300">
                <HardHat className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
                <span>{t("auth.register.construction.hint")}</span>
              </div>
            </div>
          )}

          {((!isTeamJoin && step === 2) || (isTeamJoin && step === 0)) && (
            <div className="space-y-4">
              {isTeamJoin && preview && (
                <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm">
                  <p className="font-black text-teal-200">
                    {t("auth.register.summary.joining")}: {preview.orgName}
                  </p>
                  <p className="mt-0.5 text-teal-300/90">{ROLE_LABELS[preview.role] ?? preview.role}</p>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400">
                  {t("auth.register.labels.fullName")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t("auth.register.placeholders.fullName")}
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400">
                  {t("auth.register.labels.email")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="email@example.com"
                  dir="ltr"
                  readOnly={isTeamJoin && !!preview?.emailHint}
                  className={`${inputCls} ${isTeamJoin && preview?.emailHint ? "opacity-80" : ""}`}
                />
                {!isTeamJoin && <p className="mt-1.5 text-xs text-slate-500">{t("auth.register.help.email")}</p>}
              </div>
            </div>
          )}

          {!isTeamJoin && step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-400">
                  {form.orgType === "HOME"
                    ? t("auth.register.labels.orgNameHome")
                    : form.orgType === "FREELANCER"
                      ? t("auth.register.labels.orgNameFreelancer")
                      : t("auth.register.labels.orgNameCompany")}
                </label>
                <input
                  type="text"
                  value={form.organizationName}
                  onChange={(e) => set("organizationName", e.target.value)}
                  placeholder={
                    form.orgType === "HOME"
                      ? t("auth.register.placeholders.orgNameHome")
                      : form.orgType === "FREELANCER"
                        ? t("auth.register.placeholders.orgNameFreelancer")
                        : t("auth.register.placeholders.orgNameCompany")
                  }
                  className={inputCls}
                  autoFocus
                />
              </div>
              <p className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-xs leading-relaxed text-slate-500">
                {t("auth.register.help.orgName")}
              </p>
            </div>
          )}

          {isLast && (
            <div className="space-y-4">
              <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60">
                {!isTeamJoin && selectedType && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">{t("auth.register.summary.type")}</span>
                    <span className="flex items-center gap-1.5 font-black text-white">
                      <selectedType.Icon size={14} className={selectedType.activeText} />
                      {selectedType.label}
                    </span>
                  </div>
                )}
                {!isTeamJoin && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">{t("auth.register.summary.trade")}</span>
                    <span className="font-black text-white">
                      {mergeConstructionTradeLabel(
                        messages,
                        normalizeConstructionTrade(form.constructionTrade),
                        constructionTradeLabelHe(normalizeConstructionTrade(form.constructionTrade)),
                      )}
                    </span>
                  </div>
                )}
                {!isTeamJoin && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">{t("auth.register.summary.orgName")}</span>
                    <span className="font-black text-white">{form.organizationName}</span>
                  </div>
                )}
                {isTeamJoin && preview && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">{t("auth.register.summary.joining")}</span>
                    <span className="font-black text-white">{preview.orgName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">{t("auth.register.summary.name")}</span>
                  <span className="font-black text-white">{form.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">{t("auth.register.summary.email")}</span>
                  <span dir="ltr" className="font-mono text-xs font-bold text-slate-300">
                    {form.email}
                  </span>
                </div>
              </div>
              {err && (
                <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-200">
                  {err}
                </p>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 text-sm font-black text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <MailCheck size={17} />}
                {isTeamJoin ? t("auth.register.submitTeam") : t("auth.register.submit")}
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setErr(null);
                  setStep((s) => s - 1);
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-white"
              >
                {dir === "rtl" ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                {t("auth.register.back")}
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-white"
              >
                {dir === "rtl" ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                {t("auth.register.backToLogin")}
              </Link>
            )}
            {!isLast && (
              <button
                type="button"
                disabled={!canAdvance()}
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-40"
              >
                {t("auth.register.next")}
                {dir === "rtl" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t("auth.register.alreadyHave")}{" "}
        <Link href="/login" className="font-medium text-brand-light transition hover:text-white">
          {t("auth.register.loginLink")}
        </Link>
      </p>

      <p className="mt-8 text-center text-xs text-slate-600">
        בלחיצה על הרשמה, אתה מסכים ל־
        <Link href="/legal/terms" className="underline transition hover:text-slate-400">
          תנאי השימוש
        </Link>
        {" ול־"}
        <Link href="/legal/privacy" className="underline transition hover:text-slate-400">
          מדיניות הפרטיות
        </Link>
        .
      </p>
    </>,
  );
}
