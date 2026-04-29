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
} from "lucide-react";
import { mergeConstructionTradeLabel } from "@/lib/construction-trades-i18n";
import { CONSTRUCTION_TRADE_IDS, constructionTradeLabelHe, normalizeConstructionTrade } from "@/lib/construction-trades";
import { useI18n } from "@/components/I18nProvider";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthProfessionalCard from "@/components/auth/AuthProfessionalCard";

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
    { value: "HOME", label: t("auth.register.types.home.label"), desc: t("auth.register.types.home.desc"), Icon: Home },
    { value: "FREELANCER", label: t("auth.register.types.freelancer.label"), desc: t("auth.register.types.freelancer.desc"), Icon: Briefcase },
    { value: "COMPANY", label: t("auth.register.types.company.label"), desc: t("auth.register.types.company.desc"), Icon: Building2 },
    { value: "ENTERPRISE", label: t("auth.register.types.enterprise.label"), desc: t("auth.register.types.enterprise.desc"), Icon: Factory },
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
    "w-full rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-3 text-sm text-[color:var(--ink-900)] placeholder:text-[color:var(--ink-400)] outline-none transition focus:border-[color:var(--axis-clients)] focus:ring-2 focus:ring-[color:var(--axis-clients-soft)] text-start";

  const registerIcon = (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--axis-clients-soft)]">
      <Building2 className="h-6 w-6 text-[color:var(--axis-clients)]" aria-hidden />
    </div>
  );

  const authChrome = (body: ReactNode) => (
    <AuthPageShell secondaryNav={{ href: "/login", label: t("auth.register.loginLink") }}>
      <AuthProfessionalCard icon={registerIcon} title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
        {body}
      </AuthProfessionalCard>
    </AuthPageShell>
  );

  if (previewLoading) {
    return authChrome(
      <div className="flex items-center justify-center gap-3 py-10 text-[color:var(--ink-500)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("auth.register.steps.step")}…</span>
      </div>,
    );
  }

  if (previewErr) {
    return authChrome(
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-800">{previewErr}</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-bold text-[color:var(--axis-clients)] hover:underline">
          {t("auth.register.backToLogin")}
        </Link>
      </div>,
    );
  }

  if (done) {
    return authChrome(
      <div className="text-center" dir={dir}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--state-success-soft)]">
          <CheckCircle2 className="h-8 w-8 text-[color:var(--state-success)]" />
        </div>
        <h2 className="text-xl font-black text-[color:var(--ink-900)]">
          {isTeamJoin ? t("auth.register.success.titleTeam") : t("auth.register.success.title")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink-500)]">
          {isTeamJoin ? t("auth.register.success.descTeam") : t("auth.register.success.desc")}
        </p>
        <Link
          href="/login?registered=1"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--axis-clients)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[color:var(--axis-clients-strong)]"
        >
          {t("auth.register.success.cta")}
          {dir === "rtl" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
        </Link>
      </div>,
    );
  }

  const selectedType = ORG_TYPE_OPTIONS.find((o) => o.value === form.orgType);

  return authChrome(
    <>
      <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)]/40 shadow-[var(--cd-shadow-sm)]">
        <div className="h-1.5 w-full bg-[color:var(--canvas-sunken)]">
          <div
            className="h-full bg-[color:var(--axis-clients)] transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1 border-b border-[color:var(--line)] px-4 py-4 sm:gap-0 sm:px-6">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center">
              <div
                title={label}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                  i < step
                    ? "bg-[color:var(--axis-clients)] text-white"
                    : i === step
                      ? "bg-[color:var(--axis-clients)] text-white ring-4 ring-[color:var(--axis-clients-glow)]"
                      : "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-400)]"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-1.5 h-0.5 w-6 sm:w-12 transition-colors ${
                    i < step ? "bg-[color:var(--axis-clients)]" : "bg-[color:var(--line)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="px-6 pb-8 pt-6 text-start sm:px-8">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[color:var(--ink-500)]">
            {t("auth.register.steps.step")} {step + 1} {t("auth.register.steps.of")} {totalSteps}
          </p>
          <h2 className="mb-6 text-lg font-black text-[color:var(--ink-900)] sm:text-xl">{steps[step]}</h2>

          {!isTeamJoin && step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {ORG_TYPE_OPTIONS.map(({ value, label, desc, Icon }) => {
                const active = form.orgType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("orgType", value)}
                    className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all sm:p-5 ${
                      active
                        ? "border-[color:var(--axis-clients)] bg-[color:var(--axis-clients-soft)] ring-2 ring-[color:var(--axis-clients-glow)]"
                        : "border-[color:var(--line)] bg-[color:var(--canvas-raised)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--canvas-sunken)]/50"
                    }`}
                  >
                    <Icon
                      size={28}
                      className={active ? "text-[color:var(--axis-clients-strong)]" : "text-[color:var(--ink-400)]"}
                    />
                    <span
                      className={`mt-2 block text-sm font-black ${active ? "text-[color:var(--axis-clients-ink)]" : "text-[color:var(--ink-900)]"}`}
                    >
                      {label}
                    </span>
                    <span className="mt-1 block text-xs leading-tight text-[color:var(--ink-500)]">{desc}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!isTeamJoin && step === 1 && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-[color:var(--ink-500)]">{t("auth.register.construction.lead")}</p>
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-[color:var(--ink-600)]">
                  {t("auth.register.construction.selectLabel")}
                </span>
                <select
                  value={form.constructionTrade}
                  onChange={(e) => set("constructionTrade", e.target.value)}
                  className={inputCls}
                >
                  {tradeSelectOptions.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--state-warning-soft)] bg-[color:var(--state-warning-soft)] px-4 py-3 text-xs text-[color:var(--ink-800)]">
                <HardHat className="h-5 w-5 shrink-0 text-[color:var(--state-warning)]" aria-hidden />
                <span>{t("auth.register.construction.hint")}</span>
              </div>
            </div>
          )}

          {((!isTeamJoin && step === 2) || (isTeamJoin && step === 0)) && (
            <div className="space-y-4">
              {isTeamJoin && preview && (
                <div className="rounded-xl border border-[color:var(--axis-clients-border)] bg-[color:var(--axis-clients-soft)] px-4 py-3 text-sm">
                  <p className="font-black text-[color:var(--axis-clients-ink)]">
                    {t("auth.register.summary.joining")}: {preview.orgName}
                  </p>
                  <p className="mt-0.5 text-[color:var(--axis-clients-strong)]">{ROLE_LABELS[preview.role] ?? preview.role}</p>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[color:var(--ink-600)]">
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
                <label className="mb-1.5 block text-xs font-bold text-[color:var(--ink-600)]">
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
                {!isTeamJoin && <p className="mt-1.5 text-xs text-[color:var(--ink-500)]">{t("auth.register.help.email")}</p>}
              </div>
            </div>
          )}

          {!isTeamJoin && step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[color:var(--ink-600)]">
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
              <p className="rounded-xl border border-[color:var(--line)] bg-[color:var(--canvas-sunken)]/60 px-4 py-3 text-xs leading-relaxed text-[color:var(--ink-500)]">
                {t("auth.register.help.orgName")}
              </p>
            </div>
          )}

          {isLast && (
            <div className="space-y-4">
              <div className="divide-y divide-[color:var(--line)] overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)]">
                {!isTeamJoin && selectedType && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="text-[color:var(--ink-500)]">{t("auth.register.summary.type")}</span>
                    <span className="flex items-center gap-1.5 font-black text-[color:var(--ink-900)]">
                      <selectedType.Icon size={14} className="text-[color:var(--axis-clients)]" />
                      {selectedType.label}
                    </span>
                  </div>
                )}
                {!isTeamJoin && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-[color:var(--ink-500)]">{t("auth.register.summary.trade")}</span>
                    <span className="font-black text-[color:var(--ink-900)]">
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
                    <span className="text-[color:var(--ink-500)]">{t("auth.register.summary.orgName")}</span>
                    <span className="font-black text-[color:var(--ink-900)]">{form.organizationName}</span>
                  </div>
                )}
                {isTeamJoin && preview && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-[color:var(--ink-500)]">{t("auth.register.summary.joining")}</span>
                    <span className="font-black text-[color:var(--ink-900)]">{preview.orgName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-[color:var(--ink-500)]">{t("auth.register.summary.name")}</span>
                  <span className="font-black text-[color:var(--ink-900)]">{form.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-[color:var(--ink-500)]">{t("auth.register.summary.email")}</span>
                  <span dir="ltr" className="font-mono text-xs font-bold text-[color:var(--ink-700)]">
                    {form.email}
                  </span>
                </div>
              </div>
              {err && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
                  {err}
                </p>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--axis-clients)] py-4 text-sm font-black text-white transition hover:bg-[color:var(--axis-clients-strong)] disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={17} /> : <MailCheck size={17} />}
                {isTeamJoin ? t("auth.register.submitTeam") : t("auth.register.submit")}
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setErr(null);
                  setStep((s) => s - 1);
                }}
                className="flex items-center justify-center gap-1.5 text-sm font-medium text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)] sm:justify-start"
              >
                {dir === "rtl" ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                {t("auth.register.back")}
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm font-medium text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)] sm:justify-start"
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
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[color:var(--axis-clients)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[color:var(--axis-clients-strong)] disabled:opacity-40 sm:w-auto"
              >
                {t("auth.register.next")}
                {dir === "rtl" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-[color:var(--ink-500)]">
        {t("auth.register.alreadyHave")}{" "}
        <Link href="/login" className="font-bold text-[color:var(--axis-clients)] hover:underline">
          {t("auth.register.loginLink")}
        </Link>
      </p>

      <p className="mt-6 text-center text-xs leading-relaxed text-[color:var(--ink-400)]">
        בלחיצה על הרשמה, אתה מסכים ל־
        <Link href="/legal/terms" className="font-semibold text-[color:var(--ink-600)] underline underline-offset-2 hover:text-[color:var(--ink-900)]">
          תנאי השימוש
        </Link>
        {" ול־"}
        <Link href="/legal/privacy" className="font-semibold text-[color:var(--ink-600)] underline underline-offset-2 hover:text-[color:var(--ink-900)]">
          מדיניות הפרטיות
        </Link>
        .
      </p>
    </>,
  );
}
