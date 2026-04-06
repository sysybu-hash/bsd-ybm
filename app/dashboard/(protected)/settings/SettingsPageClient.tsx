"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  User,
  Users,
  Cpu,
  CreditCard,
  Sparkles,
  ExternalLink,
  Cloud,
  CalendarDays,
  Globe,
  Wallet,
  BarChart3,
  Bot,
  Receipt,
} from "lucide-react";
import {
  updateOrganizationAction,
  updateTenantPortalAction,
  updateBillingConnectionsAction,
} from "@/app/actions/org-settings";
import { createOrganizationInviteAction } from "@/app/actions/organization-invite";
import CloudBackupPanel from "@/components/CloudBackupPanel";
import TenantCalendarMini from "@/components/TenantCalendarMini";
import QuickPaymentPresetsSettings from "@/components/settings/QuickPaymentPresetsSettings";
import type { BillingWorkspaceV1 } from "@/lib/billing-workspace";
import { useI18n } from "@/components/I18nProvider";

const ORG_TYPE_VALUES = [
  { value: "HOME",       msgKey: "settings.orgTypeHome" },
  { value: "FREELANCER", msgKey: "settings.orgTypeFreelancer" },
  { value: "COMPANY",    msgKey: "settings.orgTypeCompany" },
  { value: "ENTERPRISE", msgKey: "settings.orgTypeEnterprise" },
] as const;

const COMPANY_TYPE_VALUES = [
  { value: "LICENSED_DEALER", label: "עוסק מורשה (מע״מ)" },
  { value: "EXEMPT_DEALER",   label: "עוסק פטור (ללא מע״מ)" },
  { value: "LTD_COMPANY",     label: "חברה בע״מ" },
] as const;

const PREFS_STORAGE_KEY = "bsd-settings-prefs";

type TabId = "account" | "erp" | "crm" | "ai" | "billing" | "cloud";

const TAB_ORDER: TabId[] = ["account", "erp", "crm", "ai", "billing", "cloud"];

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  account: <Building2 size={14} />,
  erp:     <Receipt size={14} />,
  crm:     <Users size={14} />,
  ai:      <Bot size={14} />,
  billing: <CreditCard size={14} />,
  cloud:   <Cloud size={14} />,
};

type PlaceholderTabId = Exclude<TabId, "account" | "cloud">;

const PLACEHOLDER_FIELDS: Record<
  PlaceholderTabId,
  { key: string; label: string; hint?: string; options: { value: string; label: string }[] }[]
> = {
  erp: [
    {
      key: "defaultCurrency",
      label: "מטבע ברירת מחדל",
      hint: "יופיע בחשבוניות ובדוחות",
      options: [
        { value: "ILS", label: "₪ שקל חדש (ILS)" },
        { value: "USD", label: "$ דולר אמריקאי (USD)" },
        { value: "EUR", label: "€ יורו (EUR)" },
        { value: "GBP", label: "£ פאונד בריטי (GBP)" },
      ],
    },
    {
      key: "fiscalYearEnd",
      label: "סגירת שנת כספים",
      hint: "התאריך שבו מסתיימת שנת הכספים",
      options: [
        { value: "12-31", label: "31 בדצמבר (רגיל)" },
        { value: "03-31", label: "31 במרץ" },
        { value: "06-30", label: "30 ביוני" },
        { value: "09-30", label: "30 בספטמבר" },
      ],
    },
    {
      key: "vatRate",
      label: "שיעור מע\"מ",
      hint: "לחישוב חשבוניות מס",
      options: [
        { value: "18", label: "18% (ישראל — עדכני 2025)" },
        { value: "17", label: "17% (ישראל — עד 2024)" },
        { value: "0",  label: "0% (עסק פטור / יצוא)" },
      ],
    },
    {
      key: "bankSync",
      label: "סנכרון בנקים",
      hint: "ייבוא תנועות בנקאיות אוטומטי",
      options: [
        { value: "manual", label: "ידני — ייבוא CSV/Excel" },
        { value: "auto",   label: "אוטומטי (בפיתוח)" },
        { value: "none",   label: "לא בשימוש" },
      ],
    },
  ],
  crm: [
    {
      key: "leadStatus",
      label: "סטטוס ברירת מחדל לליד חדש",
      hint: "הסטטוס שמוקצה אוטומטית בפנייה נכנסת",
      options: [
        { value: "new",    label: "פנייה ראשונה" },
        { value: "active", label: "פעיל" },
        { value: "hot",    label: "חם" },
        { value: "cold",   label: "קר" },
      ],
    },
    {
      key: "quoteExpiry",
      label: "תוקף הצעת מחיר",
      hint: "כמה ימים ההצעה בתוקף לאחר הפקה",
      options: [
        { value: "7",  label: "7 ימים" },
        { value: "14", label: "14 ימים" },
        { value: "30", label: "30 ימים" },
        { value: "0",  label: "ללא הגבלה" },
      ],
    },
    {
      key: "whatsapp",
      label: "אינטגרציה WhatsApp",
      hint: "שליחת עדכונים ולידים דרך WhatsApp Business API",
      options: [
        { value: "none",     label: "לא מחובר" },
        { value: "beta",     label: "מחובר (בטא)" },
        { value: "disabled", label: "לא רלוונטי לארגון" },
      ],
    },
    {
      key: "followUpDays",
      label: "תזכורת מעקב אוטומטי",
      hint: "כמה ימים אחרי יצירת ליד לשלוח תזכורת",
      options: [
        { value: "1", label: "יום אחד" },
        { value: "3", label: "3 ימים" },
        { value: "7", label: "שבוע" },
        { value: "0", label: "ללא תזכורת" },
      ],
    },
  ],
  ai: [
    {
      key: "engine",
      label: "מנוע AI ראשי",
      hint: "המנוע שישמש לסריקה, חילוץ נתונים וצ׳אט",
      options: [
        { value: "auto",   label: "אוטומטי (מומלץ)" },
        { value: "gemini", label: "Google Gemini" },
        { value: "openai", label: "OpenAI GPT" },
        { value: "claude", label: "Anthropic Claude" },
      ],
    },
    {
      key: "docLang",
      label: "שפת זיהוי מסמכים",
      hint: "שפת ברירת מחדל לחילוץ טקסט ממסמכים",
      options: [
        { value: "auto", label: "אוטומטי (זיהוי שפה)" },
        { value: "he",   label: "עברית" },
        { value: "en",   label: "אנגלית" },
        { value: "ar",   label: "ערבית" },
      ],
    },
    {
      key: "ocr",
      label: "רמת פיענוח OCR",
      hint: "איזון בין מהירות לדיוק בחילוץ טקסט",
      options: [
        { value: "standard", label: "סטנדרטי — מהיר ומדויק" },
        { value: "high",     label: "גבוה — מדויק יותר, איטי יותר" },
        { value: "fast",     label: "מהיר — פחות מדויק" },
      ],
    },
    {
      key: "autoSummarize",
      label: "סיכום מסמך אוטומטי",
      hint: "יצירת סיכום AI אחרי כל העלאה",
      options: [
        { value: "on",  label: "מופעל" },
        { value: "off", label: "כבוי" },
        { value: "ask", label: "שאל בכל פעם" },
      ],
    },
  ],
  billing: [
    {
      key: "billingCycle",
      label: "מחזור חיוב מועדף",
      hint: "תדירות חיוב המנוי",
      options: [
        { value: "monthly", label: "חודשי" },
        { value: "yearly",  label: "שנתי (חיסכון 20%)" },
      ],
    },
    {
      key: "invoiceFormat",
      label: "פורמט חשבוניות להורדה",
      options: [
        { value: "pdf",  label: "PDF" },
        { value: "html", label: "HTML" },
        { value: "both", label: "PDF + HTML" },
      ],
    },
    {
      key: "autoRenew",
      label: "חידוש מנוי אוטומטי",
      hint: "חידוש אוטומטי לפני תום התקופה",
      options: [
        { value: "on",  label: "מופעל" },
        { value: "off", label: "כבוי — חידוש ידני" },
      ],
    },
  ],
};

// ─── Light input/select class helpers ────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
const selectCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
const cardCls =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";
const labelCls = "mb-1.5 block text-sm font-bold text-gray-700";
const saveBtnCls =
  "inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50";

export default function SettingsPageClient({
  initialOrg,
  initialBillingWorkspace,
  initialTab,
}: {
  initialOrg: {
    name: string;
    type: string;
    companyType: string;
    taxId: string | null;
    address: string | null;
    isReportable: boolean;
    calendarGoogleEnabled: boolean;
    tenantPublicDomain: string | null;
    tenantSiteBrandingJson: string;
    paypalMerchantEmail: string | null;
    paypalMeSlug: string | null;
    liveDataTier: string;
  } | null;
  initialBillingWorkspace: BillingWorkspaceV1 | null;
  initialTab?: string;
}) {
  const { t, dir } = useI18n();
  const { data: session } = useSession();
  const canEditTaxProfile =
    session?.user?.role === "ORG_ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const router = useRouter();
  const orgFormRef = useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [prefs, setPrefs] = useState<Record<string, string>>({});
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [teamInviteMsg, setTeamInviteMsg] = useState<string | null>(null);
  const [pendingTeamInvite, startTeamInvite] = useTransition();
  const [orgMsg, setOrgMsg] = useState<string | null>(null);
  const [pendingOrg, startOrgTransition] = useTransition();
  const [portalMsg, setPortalMsg] = useState<string | null>(null);
  const [pendingPortal, startPortalTransition] = useTransition();
  const [calendarConnectHint, setCalendarConnectHint] = useState<string | null>(null);
  const [paymentConnMsg, setPaymentConnMsg] = useState<string | null>(null);
  const [pendingPayment, startPaymentTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) setPrefs(JSON.parse(raw) as Record<string, string>);
    } catch { /* ignore */ }
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (initialTab && TAB_ORDER.includes(initialTab as TabId)) {
      setActiveTab(initialTab as TabId);
    }
  }, [initialTab]);

  const prefKey = (tab: PlaceholderTabId, key: string) => `${tab}:${key}`;
  const getPref = (tab: PlaceholderTabId, key: string) => prefs[prefKey(tab, key)] ?? "";
  const setPref = (tab: PlaceholderTabId, key: string, value: string) => {
    setPrefs((p) => ({ ...p, [prefKey(tab, key)]: value }));
  };

  const persistPrefs = () => {
    if (!prefsLoaded) return;
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    setPrefsMsg(t("settings.prefsSavedLocal"));
    setTimeout(() => setPrefsMsg(null), 3500);
  };

  const handleHeaderSave = () => {
    if (activeTab === "account") { orgFormRef.current?.requestSubmit(); return; }
    if (activeTab === "cloud") { setPrefsMsg(t("settings.saveHint")); setTimeout(() => setPrefsMsg(null), 3500); return; }
    persistPrefs();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const res = await fetch("/api/assign-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        organizationId: session?.user?.organizationId,
        role: inviteRole as "EMPLOYEE" | "ORG_ADMIN" | "PROJECT_MGR" | "CLIENT",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus({ type: "success", msg: t("settings.inviteOk", { email: inviteEmail }) });
      setInviteEmail("");
    } else {
      setStatus({ type: "error", msg: data.error || t("settings.assignError") });
    }
  };

  const currentTitle = t(`settings.${activeTab}`);

  return (
    <div className="" dir={dir}>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* ── Page hero ── */}
        <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-6 py-6">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 ring-1 ring-indigo-200">
                <Settings size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">{currentTitle}</h3>
                <p className="text-[11px] text-gray-500">הגדרות המערכת והארגון</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleHeaderSave}
              disabled={activeTab === "account" ? pendingOrg : false}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save size={15} />
              {activeTab === "account"
                ? pendingOrg ? t("common.loading") : t("settings.save")
                : activeTab === "cloud" ? t("settings.cloudSaveCTA") : t("settings.savePrefs")}
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <nav className="flex overflow-x-auto border-b border-gray-100 bg-gray-50 px-3 py-2 gap-1">
          {TAB_ORDER.map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all ${
                activeTab === tabId
                  ? "bg-white text-indigo-700 ring-1 ring-indigo-200 shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-700"
              }`}
            >
              <span className="opacity-70">{TAB_ICONS[tabId]}</span>
              {t(`settings.${tabId}`)}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <main className="min-w-0 flex-1 bg-gray-50 p-5 md:p-7">

          {/* Prefs saved notice */}
          {prefsMsg && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800">{prefsMsg}</p>
            </div>
          )}

          {/* ── ACCOUNT TAB ── */}
          {activeTab === "account" && (
            <div className="grid grid-cols-1 gap-6">

              {/* Profile card */}
              <div className={cardCls}>
                <h4 className="mb-4 flex items-center gap-2.5 text-base font-black text-gray-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 ring-1 ring-indigo-200">
                    <User size={15} className="text-indigo-600" />
                  </span>
                  פרופיל אישי
                </h4>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">שם מלא</p>
                    <span className="text-lg font-black text-gray-900">{session?.user?.name ?? "—"}</span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">כתובת אימייל</p>
                    <span className="text-lg font-black text-gray-900">{session?.user?.email ?? "—"}</span>
                  </div>
                </div>
              </div>

              {/* Org form */}
              {initialOrg && (
                <div className={cardCls}>
                  <h4 className="mb-2 flex items-center gap-2.5 text-base font-black text-gray-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 ring-1 ring-indigo-200">
                      <Building2 size={15} className="text-indigo-600" />
                    </span>
                    חברה / ארגון
                  </h4>
                  <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                    השם משמש לזיהוי הארגון במערכת (CRM, מסמכים וכו׳).
                  </p>
                  <form
                    ref={orgFormRef}
                    action={(fd) => {
                      setOrgMsg(null);
                      startOrgTransition(async () => {
                        const r = await updateOrganizationAction(fd);
                        setOrgMsg(r.ok ? "✓ נשמר" : r.error || "שגיאה");
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="max-w-lg space-y-4"
                  >
                    <div>
                      <label className={labelCls}>שם העסק / הארגון</label>
                      <input name="name" required defaultValue={initialOrg.name} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>סוג</label>
                      <select name="type" defaultValue={initialOrg.type} className={selectCls}>
                        {ORG_TYPE_VALUES.map((o) => (
                          <option key={o.value} value={o.value}>{t(o.msgKey)}</option>
                        ))}
                      </select>
                    </div>
                    {canEditTaxProfile ? (
                      <>
                        <div>
                          <label className={labelCls}>סיווג מס (חשבוניות / מע״מ)</label>
                          <select name="companyType" defaultValue={initialOrg.companyType} className={selectCls}>
                            {COMPANY_TYPE_VALUES.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>ח.פ / ע.מ</label>
                          <input name="taxId" defaultValue={initialOrg.taxId ?? ""} className={inputCls} placeholder="למשל מספר עוסק מורשה" />
                        </div>
                        <div>
                          <label className={labelCls}>כתובת</label>
                          <textarea name="address" rows={3} defaultValue={initialOrg.address ?? ""} className={`${inputCls} resize-y min-h-[5rem]`} placeholder="כתובת להצגה במסמכים" />
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              name="isReportable"
                              defaultChecked={initialOrg.isReportable}
                              className="mt-1 h-4 w-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>
                              ארגון מדווח למס (חשבוניות והפקות רשמיות)
                              <span className="mt-1 block text-xs font-normal text-gray-400">
                                כבו את הסימון לניהול אישי בלבד — מסמכים יוצגו כמזכר פנימי ללא חישוב מע״מ.
                              </span>
                            </span>
                          </label>
                        </div>
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-gray-600 leading-relaxed">
                          <p className="mb-1 font-bold text-indigo-900">הפקת מסמכים ותשלומים</p>
                          <p>
                            לפי הסיווג והדיווח שמגדירים כאן, ניתן להפיק ב{" "}
                            <Link href="/dashboard/billing" className="font-bold text-indigo-600 underline">מנוי ותשלומים</Link>{" "}
                            את כל סוגי המסמכים. מע״ו וחישובים תואמים את סוג העוסק.
                          </p>
                          <p className="mt-2 text-xs text-gray-400">
                            מסמכים סרוקים ישנים — ב{" "}
                            <Link href="/dashboard/erp" className="font-bold text-indigo-300 underline">ERP</Link>
                            {" · "}
                            חיבור ענן — ב{" "}
                            <Link href="/dashboard/settings?tab=cloud" className="font-bold text-indigo-300 underline">גיבוי ענן</Link>.
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        פרטי מס וכתובת ניתנים לעדכון על ידי <strong className="text-gray-700">מנהל ארגון</strong> בלבד.
                        <span className="mt-2 block text-gray-400">
                          הפקת מסמכים —{" "}
                          <Link href="/dashboard/billing" className="font-bold text-indigo-600 underline">מנויים</Link>
                          {" · "}
                          ייבוא סריקות — <Link href="/dashboard/erp" className="font-bold text-indigo-600 underline">ERP</Link>.
                        </span>
                      </p>
                    )}
                  </form>
                  {orgMsg && (
                    <p className={`mt-3 text-sm font-bold ${orgMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                      {orgMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Portal settings */}
              {initialOrg && canEditTaxProfile && (
                <div className={cardCls}>
                  <h4 className="mb-2 flex items-center gap-2.5 text-base font-black text-gray-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 ring-1 ring-sky-200">
                      <Globe size={15} className="text-sky-600" />
                    </span>
                    פורטל המנוי, דף הבית ודומיין
                  </h4>
                  <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                    דומיין ציבורי (לאחר הגדרת DNS ב-Vercel), מיתוג JSON, ולוח שנה עם סנכרון Google.
                  </p>
                  <form
                    action={(fd) => {
                      setPortalMsg(null);
                      startPortalTransition(async () => {
                        const r = await updateTenantPortalAction(fd);
                        setPortalMsg(r.ok ? "✓ הגדרות הפורטל נשמרו" : r.error || "שגיאה");
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="max-w-2xl space-y-4"
                  >
                    <div>
                      <label className={labelCls}>דומיין ציבורי (ללא https)</label>
                      <input name="tenantPublicDomain" type="text" dir="ltr" defaultValue={initialOrg.tenantPublicDomain ?? ""} placeholder="app.example.co.il" className={inputCls} />
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          name="calendarGoogleEnabled"
                          defaultChecked={initialOrg.calendarGoogleEnabled}
                          className="mt-1 h-4 w-4 rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="flex items-center gap-2">
                          <CalendarDays size={16} className="shrink-0 text-indigo-600" />
                          הצגת לוח שנה בדשבורד והכנה לסנכרון Google Calendar
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className={labelCls}>מיתוג אתר (JSON — אופציונלי)</label>
                      <textarea
                        name="tenantSiteBrandingJson"
                        rows={6}
                        dir="ltr"
                        defaultValue={initialOrg.tenantSiteBrandingJson}
                        placeholder={'{ "landingTitle": "...", "tagline": "...", "primaryColor": "#2563eb" }'}
                        className={`${inputCls} resize-y min-h-[8rem] font-mono text-xs`}
                      />
                    </div>
                    <button type="submit" disabled={pendingPortal} className={saveBtnCls}>
                      {pendingPortal ? "שומר…" : "שמור הגדרות פורטל"}
                    </button>
                  </form>
                  {portalMsg && (
                    <p className={`mt-3 text-sm font-bold ${portalMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                      {portalMsg}
                    </p>
                  )}
                  {initialOrg.calendarGoogleEnabled && (
                    <div className="mt-8 space-y-4 border-t border-gray-100 pt-8">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-bold text-gray-700">לוח שנה</p>
                        <button
                          type="button"
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                          onClick={async () => {
                            setCalendarConnectHint(null);
                            try {
                              const res = await fetch("/api/integrations/google-calendar");
                              const data = (await res.json()) as { message?: string };
                              setCalendarConnectHint(data.message ?? "לא ניתן לטעון סטטוס חיבור.");
                            } catch {
                              setCalendarConnectHint("שגיאת רשת בבדיקת החיבור.");
                            }
                          }}
                        >
                          בדיקת סטטוס חיבור Google
                        </button>
                      </div>
                      {calendarConnectHint && (
                        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                          {calendarConnectHint}
                        </p>
                      )}
                      <TenantCalendarMini />
                    </div>
                  )}
                </div>
              )}

              {/* Team management */}
              <div className={cardCls}>
                <h4 className="mb-4 flex items-center gap-2.5 text-base font-black text-gray-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 ring-1 ring-emerald-200">
                    <UserPlus size={15} className="text-emerald-600" />
                  </span>
                  ניהול צוות
                </h4>
                <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">דרך מומלצת:</strong> שליחת קישור במייל — הנרשם מצטרף{" "}
                  <strong className="text-gray-700">רק</strong> לארגון שלכם.
                </p>

                {/* Invite by email */}
                <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="mb-3 text-sm font-bold text-emerald-700">1 — הזמנת צוות במייל (קישור)</p>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setTeamInviteMsg(null);
                      const fd = new FormData(e.currentTarget);
                      startTeamInvite(async () => {
                        const r = await createOrganizationInviteAction(fd);
                        if (r.ok) {
                          setTeamInviteMsg(`נשלח מייל עם קישור הרשמה. ניתן גם להעתיק: ${r.registerUrl}`);
                          (e.target as HTMLFormElement).reset();
                        } else {
                          setTeamInviteMsg(`שגיאה: ${r.error}`);
                        }
                      });
                    }}
                  >
                    <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
                      <input
                        type="email"
                        name="email"
                        placeholder="אימייל מוזמן"
                        required
                        className="min-w-[200px] flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      />
                      <select
                        name="role"
                        defaultValue="EMPLOYEE"
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none sm:w-56"
                        aria-label="תפקיד בהזמנה"
                      >
                        <option value="EMPLOYEE">עובד / צוות</option>
                        <option value="PROJECT_MGR">מנהל פרויקטים</option>
                        <option value="CLIENT">לקוח / צופה</option>
                        <option value="ORG_ADMIN">מנהל ארגון (שימוש זהיר)</option>
                      </select>
                      <input type="hidden" name="validDays" value="14" />
                      <button
                        type="submit"
                        disabled={pendingTeamInvite}
                        className="rounded-2xl bg-emerald-500 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        {pendingTeamInvite ? "שולח…" : "שליחת קישור במייל"}
                      </button>
                    </div>
                  </form>
                  {teamInviteMsg && (
                    <p className="mt-3 break-all whitespace-pre-wrap text-xs text-emerald-700">{teamInviteMsg}</p>
                  )}
                </div>

                {/* Role reference */}
                <details className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  <summary className="cursor-pointer font-bold text-gray-700">מה ההבדל בין תפקידים?</summary>
                  <ul className="mt-2 list-inside list-disc space-y-1.5 pe-2">
                    <li><strong className="text-gray-700">עובד / צוות</strong> — שגרה; בלי ניהול צוות.</li>
                    <li><strong className="text-gray-700">מנהל פרויקטים / לקוח</strong> — גישה מצומצמת.</li>
                    <li><strong className="text-gray-700">מנהל ארגון</strong> — שיוך משתמשים והגדרות.</li>
                  </ul>
                </details>

                {/* Manual assign */}
                <p className="mb-3 text-sm font-bold text-gray-700">
                  2 — שיוך ידני (רק אחרי כניסה ראשונה עם Google)
                </p>
                <form onSubmit={handleInvite} className="flex flex-col gap-3">
                  <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="אימייל (Google)"
                      required
                      className="min-w-[200px] flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none sm:w-56"
                      aria-label="תפקיד משתמש"
                    >
                      <option value="EMPLOYEE">תפקיד: עובד / צוות</option>
                      <option value="PROJECT_MGR">תפקיד: מנהל פרויקטים</option>
                      <option value="CLIENT">תפקיד: לקוח / צופה</option>
                      <option value="ORG_ADMIN">תפקיד: מנהל ארגון</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-2xl bg-indigo-500 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                    >
                      שייך לארגון
                    </button>
                  </div>
                </form>
                {status && (
                  <div className={`mt-6 flex items-center gap-3 rounded-2xl p-4 ${
                    status.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}>
                    {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{status.msg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CLOUD TAB ── */}
          {activeTab === "cloud" && <CloudBackupPanel />}

          {/* ── OTHER TABS (erp / crm / ai / billing) ── */}
          {activeTab !== "account" && activeTab !== "cloud" && (
            <div className="grid grid-cols-1 gap-6">

              {/* PayPal + live data tier (billing tab only) */}
              {activeTab === "billing" && initialOrg && canEditTaxProfile && (
                <div className={cardCls}>
                  <h4 className="mb-2 flex items-center gap-2 text-base font-black text-gray-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 ring-1 ring-indigo-200">
                      <Wallet size={14} className="text-indigo-600" />
                    </span>
                    PayPal של הארגון + רמת נתונים חיים
                  </h4>
                  <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                    שדות אלו הם ל<strong className="text-gray-700">לקוחות הארגון</strong> (לא חשבון מפעיל האתר).{" "}
                    <Link href="/dashboard/billing" className="font-bold text-indigo-600 underline">דף המנויים ←</Link>
                  </p>
                  <form
                    action={(fd) => {
                      setPaymentConnMsg(null);
                      startPaymentTransition(async () => {
                        const r = await updateBillingConnectionsAction(fd);
                        setPaymentConnMsg(r.ok ? "✓ נשמר" : r.error || "שגיאה");
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="max-w-xl space-y-4"
                  >
                    <div>
                      <label className={labelCls}>מייל חשבון PayPal (לקבלת תשלומים)</label>
                      <input name="paypalMerchantEmail" type="email" dir="ltr" defaultValue={initialOrg.paypalMerchantEmail ?? ""} placeholder="your-paypal@email.com" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>שם משתמש PayPal.Me (אופציונלי)</label>
                      <input name="paypalMeSlug" type="text" dir="ltr" defaultValue={initialOrg.paypalMeSlug ?? ""} placeholder="למשל: MyBusiness" className={inputCls} />
                      <p className="mt-1 text-xs text-gray-400">רק השם — יוצג קישור ל-paypal.me/… לשיתוף עם לקוחות.</p>
                    </div>
                    <div>
                      <label className={labelCls}>רמת נתונים חיים / הכנה לביטוח ושירותים</label>
                      <select name="liveDataTier" defaultValue={initialOrg.liveDataTier || "basic"} className={selectCls}>
                        <option value="basic">בסיסי — ללא הזנת נתונים חיצוניים</option>
                        <option value="standard">מתקדם — מוכן לחיבור ספקים</option>
                        <option value="premium">פרימיום — נתונים חיים + ביטוח (הרחבה עתידית)</option>
                      </select>
                    </div>
                    <button type="submit" disabled={pendingPayment} className={saveBtnCls}>
                      {pendingPayment ? "שומר…" : "שמור הגדרות תשלום ונתונים"}
                    </button>
                  </form>
                  {paymentConnMsg && (
                    <p className={`mt-3 text-sm font-bold ${paymentConnMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                      {paymentConnMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Quick payment presets */}
              {activeTab === "billing" && initialBillingWorkspace && canEditTaxProfile && (
                <QuickPaymentPresetsSettings
                  key={JSON.stringify(initialBillingWorkspace.quickPaymentPresets)}
                  workspace={initialBillingWorkspace}
                />
              )}

              {/* AI / Billing shortcut strip */}
              {(activeTab === "ai" || activeTab === "billing") && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <Sparkles className="shrink-0 text-indigo-600" size={20} />
                  <div className="flex-1 min-w-[200px] text-sm text-gray-600">
                    {activeTab === "ai" ? (
                      <>
                        לסריקה, צ׳אט והנחיות AI מלאות —{" "}
                        <Link href="/dashboard/ai" className="font-bold text-indigo-600 underline">מרכז AI ←</Link>
                      </>
                    ) : (
                      <>
                        ניהול מנוי ותשלומים —{" "}
                        <Link href="/dashboard/billing" className="inline-flex items-center gap-1 font-bold text-indigo-600 underline">
                          דף המנויים <ExternalLink size={13} />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ERP shortcut */}
              {activeTab === "erp" && (
                <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-gray-600">
                  <Receipt size={16} className="shrink-0 text-indigo-600" />
                  <span>ניהול מסמכים ודוחות — <Link href="/dashboard/erp" className="font-bold text-indigo-600 underline">פתיחת ERP ←</Link></span>
                </div>
              )}

              {/* CRM shortcut */}
              {activeTab === "crm" && (
                <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-gray-600">
                  <Users size={16} className="shrink-0 text-indigo-600" />
                  <span>לקוחות ולידים — <Link href="/dashboard/crm" className="font-bold text-indigo-600 underline">פתיחת CRM ←</Link></span>
                </div>
              )}

              {/* Placeholder preference fields */}
              {PLACEHOLDER_FIELDS[activeTab as PlaceholderTabId].map((field) => (
                <div
                  key={field.key}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                >
                  <label className="mb-1 block font-black text-gray-800">{field.label}</label>
                  {field.hint && <p className="mb-3 text-xs text-gray-400">{field.hint}</p>}
                  <select
                    value={getPref(activeTab as PlaceholderTabId, field.key) || field.options[0].value}
                    onChange={(e) => setPref(activeTab as PlaceholderTabId, field.key, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-72"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}

              <p className="text-xs italic text-gray-400">
                הגדרות אלו נשמרות מקומית בדפדפן; חיבור לשרת יגיע בעדכון עתידי.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}