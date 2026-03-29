"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  User,
  Database,
  Users,
  Cpu,
  CreditCard,
  Sparkles,
  ExternalLink,
  Cloud,
  type LucideIcon,
} from "lucide-react";
import { updateOrganizationAction } from "@/app/actions/org-settings";
import CloudBackupPanel from "@/components/CloudBackupPanel";
import { useI18n } from "@/components/I18nProvider";

const ORG_TYPE_VALUES = [
  { value: "HOME", msgKey: "settings.orgTypeHome" },
  { value: "FREELANCER", msgKey: "settings.orgTypeFreelancer" },
  { value: "COMPANY", msgKey: "settings.orgTypeCompany" },
  { value: "ENTERPRISE", msgKey: "settings.orgTypeEnterprise" },
] as const;

const COMPANY_TYPE_VALUES = [
  { value: "LICENSED_DEALER", label: "עוסק מורשה (מע״מ)" },
  { value: "EXEMPT_DEALER", label: "עוסק פטור (ללא מע״מ)" },
  { value: "LTD_COMPANY", label: "חברה בע״מ" },
] as const;

const PREFS_STORAGE_KEY = "bsd-settings-prefs";

type TabId = "account" | "erp" | "crm" | "ai" | "billing" | "cloud";

const TAB_ORDER: TabId[] = ["account", "erp", "crm", "ai", "billing", "cloud"];

const TAB_ICONS: Record<TabId, LucideIcon> = {
  account: User,
  erp: Database,
  crm: Users,
  ai: Cpu,
  billing: CreditCard,
  cloud: Cloud,
};

type PlaceholderTabId = Exclude<TabId, "account" | "cloud">;

const PLACEHOLDER_FIELDS: Record<
  PlaceholderTabId,
  { key: string; label: string }[]
> = {
  erp: [
    { key: "defaultCurrency", label: "מטבע ברירת מחדל" },
    { key: "fiscalYearEnd", label: "תאריך סגירת שנה" },
    { key: "bankSync", label: "סנכרון בנקים אוטומטי" },
  ],
  crm: [
    { key: "leadStatus", label: "סטטוס ליד חדש" },
    { key: "quoteTemplate", label: "תבנית הצעת מחיר" },
    { key: "whatsapp", label: "אינטגרציה לווטסאפ" },
  ],
  ai: [
    { key: "ocr", label: "רמת פיענוח OCR" },
    { key: "docLang", label: "שפת זיהוי מסמכים" },
    { key: "engine", label: "מנוע AI נבחר" },
  ],
  billing: [
    { key: "paymentMethod", label: "שיטת תשלום" },
    { key: "invoices", label: "הורדת חשבוניות" },
    { key: "planUpgrade", label: "שדרוג חבילה" },
  ],
};

export default function SettingsPageClient({
  initialOrg,
  initialTab,
}: {
  initialOrg: {
    name: string;
    type: string;
    companyType: string;
    taxId: string | null;
    address: string | null;
  } | null;
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
  const [inviteRole, setInviteRole] = useState<"EMPLOYEE" | "ORG_ADMIN">("EMPLOYEE");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [orgMsg, setOrgMsg] = useState<string | null>(null);
  const [pendingOrg, startOrgTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) setPrefs(JSON.parse(raw) as Record<string, string>);
    } catch {
      /* ignore */
    }
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (initialTab && TAB_ORDER.includes(initialTab as TabId)) {
      setActiveTab(initialTab as TabId);
    }
  }, [initialTab]);

  const prefKey = (tab: PlaceholderTabId, key: string) => `${tab}:${key}`;
  const getPref = (tab: PlaceholderTabId, key: string) =>
    prefs[prefKey(tab, key)] ?? "";
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
    if (activeTab === "account") {
      orgFormRef.current?.requestSubmit();
      return;
    }
    if (activeTab === "cloud") {
      setPrefsMsg(t("settings.saveHint"));
      setTimeout(() => setPrefsMsg(null), 3500);
      return;
    }
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
        role: inviteRole,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus({
        type: "success",
        msg: t("settings.inviteOk", { email: inviteEmail }),
      });
      setInviteEmail("");
    } else {
      setStatus({
        type: "error",
        msg: data.error || t("settings.assignError"),
      });
    }
  };

  const currentTitle = t(`settings.${activeTab}`);

  return (
    <div className="min-h-full bg-[#f8fafc] py-6 md:py-10 px-4 md:px-8 text-slate-900" dir={dir}>
      <div className="max-w-6xl mx-auto bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row border border-slate-100">
        <aside className="w-full md:w-72 bg-slate-50 p-6 md:p-10 border-b md:border-b-0 md:border-l border-slate-100 shrink-0">
          <h2 className="text-2xl font-black italic mb-8 text-blue-600 flex items-center gap-2">
            <Settings size={28} className="shrink-0" />
            {t("settings.title")}
          </h2>
          <nav className="space-y-2 md:space-y-4">
            {TAB_ORDER.map((tabId) => {
              const Icon = TAB_ICONS[tabId];
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className={`w-full text-start p-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${
                    activeTab === tabId
                      ? "bg-white shadow-md text-blue-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon size={18} className="shrink-0 opacity-80" />
                  {t(`settings.${tabId}`)}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-12 min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 md:mb-10">
            <motion.h3
              key={currentTitle}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-3xl font-black italic"
            >
              {currentTitle}
            </motion.h3>
            <button
              type="button"
              onClick={handleHeaderSave}
              disabled={activeTab === "account" ? pendingOrg : false}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {activeTab === "account"
                ? pendingOrg
                  ? t("common.loading")
                  : t("settings.save")
                : activeTab === "cloud"
                  ? t("settings.cloudSaveCTA")
                  : t("settings.savePrefs")}
            </button>
          </div>

          {prefsMsg && (
            <p className="mb-4 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
              {prefsMsg}
            </p>
          )}

          {activeTab === "account" && (
            <div className="grid grid-cols-1 gap-8">
              <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-700">
                  <Shield size={22} /> פרופיל אישי
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    שם:{" "}
                    <span className="text-slate-900 block font-bold text-lg mt-1">
                      {session?.user?.name ?? "—"}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100">
                    אימייל:{" "}
                    <span className="text-slate-900 block font-bold text-lg mt-1">
                      {session?.user?.email ?? "—"}
                    </span>
                  </div>
                </div>
              </div>

              {initialOrg && (
                <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2 text-slate-900">
                    <Building2 size={22} className="text-[var(--primary-color,#3b82f6)]" />
                    חברה / ארגון
                  </h4>
                  <p className="text-slate-600 text-sm mb-6">
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
                    className="space-y-4 max-w-lg"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        שם העסק / הארגון
                      </label>
                      <input
                        name="name"
                        required
                        defaultValue={initialOrg.name}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">סוג</label>
                      <select
                        name="type"
                        defaultValue={initialOrg.type}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white text-slate-900"
                      >
                        {ORG_TYPE_VALUES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(o.msgKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {canEditTaxProfile ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            סיווג מס (חשבוניות / מע״מ)
                          </label>
                          <select
                            name="companyType"
                            defaultValue={initialOrg.companyType}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 bg-white text-slate-900"
                          >
                            {COMPANY_TYPE_VALUES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            ח.פ / ע.מ
                          </label>
                          <input
                            name="taxId"
                            defaultValue={initialOrg.taxId ?? ""}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white"
                            placeholder="למשל מספר עוסק מורשה"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">כתובת</label>
                          <textarea
                            name="address"
                            rows={3}
                            defaultValue={initialOrg.address ?? ""}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 bg-white resize-y min-h-[5rem]"
                            placeholder="כתובת להצגה במסמכים"
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 bg-white border border-slate-100 rounded-xl px-4 py-3">
                        פרטי מס וכתובת (ח.פ, סיווג עוסק) ניתנים לעדכון על ידי{" "}
                        <strong>מנהל ארגון</strong> בלבד. לשינוי — בקשו ממנהל הארגון או פנו לתמיכה.
                      </p>
                    )}
                  </form>
                  {orgMsg && (
                    <p
                      className={`mt-3 text-sm ${
                        orgMsg.startsWith("✓") ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {orgMsg}
                    </p>
                  )}
                </div>
              )}

              <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-1 h-full"
                  style={{ backgroundColor: "var(--primary-color, #3b82f6)" }}
                />
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--primary-color,#2563eb)]">
                  <UserPlus size={22} /> ניהול צוות
                </h4>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  הזמינו משתמשים (Google) לפני השיוך. לאחר התחברות ראשונה — שייכו לארגון. רק מנהלי
                  ארגון נותנים כאן הרשאות.
                </p>
                <details className="mb-4 text-sm text-slate-600 bg-white/80 rounded-2xl border border-slate-100 px-4 py-3">
                  <summary className="cursor-pointer font-bold text-slate-800">
                    מה ההבדל בין תפקידים?
                  </summary>
                  <ul className="mt-2 space-y-2 list-disc list-inside pe-2">
                    <li>
                      <strong>עובד / צוות (EMPLOYEE)</strong> — גישה לשגרה; בדרך כלל בלי ניהול צוות
                      וללא שינוי הגדרות ארגון.
                    </li>
                    <li>
                      <strong>מנהל ארגון (ORG_ADMIN)</strong> — ניהול שיוך משתמשים, הגדרות, ותצוגות
                      ניהול רחבות יותר.
                    </li>
                  </ul>
                </details>
                <form onSubmit={handleInvite} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="אימייל (Google)"
                      className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary-color,#3b82f6)] outline-none"
                      required
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(e.target.value === "ORG_ADMIN" ? "ORG_ADMIN" : "EMPLOYEE")
                      }
                      className="sm:w-56 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900"
                      aria-label="תפקיד משתמש"
                    >
                      <option value="EMPLOYEE">תפקיד: עובד / צוות</option>
                      <option value="ORG_ADMIN">תפקיד: מנהל ארגון</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20"
                    >
                      שייך לארגון
                    </button>
                  </div>
                </form>
                {status && (
                  <div
                    className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${
                      status.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {status.type === "success" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    <span className="text-sm font-medium">{status.msg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "cloud" && <CloudBackupPanel />}

          {activeTab !== "account" && activeTab !== "cloud" && (
            <div className="grid grid-cols-1 gap-6">
              {(activeTab === "ai" || activeTab === "billing") && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-wrap items-center gap-3">
                  <Sparkles className="text-blue-600 shrink-0" size={22} />
                  <div className="flex-1 min-w-[200px] text-sm text-slate-700">
                    {activeTab === "ai" ? (
                      <>
                        לסריקה, צ׳אט והנחיות AI מלאות — פתחו את{" "}
                        <Link href="/dashboard/ai" className="font-bold text-blue-700 underline">
                          מרכז AI
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        ניהול מנוי ותשלומים —{" "}
                        <Link
                          href="/dashboard/billing"
                          className="font-bold text-blue-700 underline inline-flex items-center gap-1"
                        >
                          דף המנויים <ExternalLink size={14} />
                        </Link>
                        .
                      </>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "erp" && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
                  ניהול מסמכים ודוחות —{" "}
                  <Link href="/dashboard/erp" className="font-bold text-blue-700 underline">
                    פתיחת ERP
                  </Link>
                  .
                </div>
              )}
              {activeTab === "crm" && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
                  לקוחות ולידים —{" "}
                  <Link href="/dashboard/crm" className="font-bold text-blue-700 underline">
                    פתיחת CRM
                  </Link>
                  .
                </div>
              )}

              {PLACEHOLDER_FIELDS[activeTab as PlaceholderTabId].map((field) => (
                <div
                  key={field.key}
                  className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <span className="font-bold text-slate-700">{field.label}</span>
                  <input
                    type="text"
                    value={getPref(activeTab as PlaceholderTabId, field.key)}
                    onChange={(e) =>
                      setPref(activeTab as PlaceholderTabId, field.key, e.target.value)
                    }
                    placeholder="הגדר ערך…"
                    className="bg-white border border-slate-200 p-2 rounded-lg text-sm w-full sm:w-64 text-left"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500 italic">
                שדות אלו נשמרים מקומית בדפדפן; חיבור לשרת יגיע בעדכון עתידי.
              </p>
            </div>
          )}
        </main>
      </div>

      <footer className="text-center text-slate-500 text-xs italic mt-10 max-w-6xl mx-auto">
        BSD-YBM Intelligence Platform — הגדרות
      </footer>
    </div>
  );
}
