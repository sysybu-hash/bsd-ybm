"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  MessagesSquare,
  FilePenLine,
  LayoutGrid,
  Sparkles,
  Send,
  Loader2,
  Bot,
  Zap,
  FileText,
  Receipt,
  FileSignature,
  IdCard,
  Stethoscope,
  Wrench,
  Info,
  CreditCard,
  BarChart3,
  Settings,
  Users,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import MultiEngineScanner from "@/components/MultiEngineScanner";
import { useI18n } from "@/components/I18nProvider";

type HubTab = "scan" | "chat" | "forms" | "links";

type ProviderRow = {
  id: string;
  label: string;
  description: string;
  configured: boolean;
  supportsDocumentScan: boolean;
  allowedByPlan?: boolean;
};

const TABS: { id: HubTab; label: string; short: string; Icon: typeof ScanLine }[] = [
  { id: "scan",  label: "סריקת מסמכים",    short: "סריקה",   Icon: ScanLine },
  { id: "chat",  label: "שיחה עם הנתונים", short: "צ׳אט AI", Icon: MessagesSquare },
  { id: "forms", label: "עוזר טפסים",       short: "טפסים",   Icon: FilePenLine },
  { id: "links", label: "קישורים מהירים",   short: "קישורים", Icon: LayoutGrid },
];

const DOC_TYPES = [
  { id: "invoice",  label: "חשבונית",      Icon: Receipt,       color: "ring-indigo-300 bg-indigo-50 text-indigo-700" },
  { id: "receipt",  label: "קבלה",         Icon: FileText,      color: "ring-emerald-300 bg-emerald-50 text-emerald-700" },
  { id: "contract", label: "חוזה",         Icon: FileSignature, color: "ring-violet-300 bg-violet-50 text-violet-700" },
  { id: "id",       label: "תעודת זהות",   Icon: IdCard,        color: "ring-amber-300 bg-amber-50 text-amber-700" },
  { id: "medical",  label: "מסמך רפואי",   Icon: Stethoscope,   color: "ring-rose-300 bg-rose-50 text-rose-700" },
  { id: "custom",   label: "מותאם אישית",  Icon: Wrench,        color: "ring-gray-300 bg-gray-50 text-gray-600" },
];

const QUICK_LINKS = [
  { href: "/dashboard/erp",      title: "ERP — תפעול",    desc: "מסמכים, לוחות ודוחות",  icon: <BarChart3 size={18} />, gradient: "from-indigo-50 to-blue-50",    ring: "ring-indigo-200", iconCls: "text-indigo-600" },
  { href: "/dashboard/business", title: "CRM — לקוחות",  desc: "אנשי קשר ופרויקטים",    icon: <Users size={18} />,     gradient: "from-emerald-50 to-teal-50",  ring: "ring-emerald-200", iconCls: "text-emerald-600" },
  { href: "/dashboard",          title: "דשבורד ראשי",   desc: "סיכום ותובנות",          icon: <Sparkles size={18} />,  gradient: "from-violet-50 to-purple-50", ring: "ring-violet-200", iconCls: "text-violet-600" },
  { href: "/dashboard/billing",  title: "מנוי ותשלומים", desc: "חבילות ומכסות סריקה",    icon: <CreditCard size={18} />, gradient: "from-rose-50 to-pink-50",    ring: "ring-rose-200", iconCls: "text-rose-600" },
  { href: "/dashboard/settings", title: "הגדרות",         desc: "ארגון, API ומשתמשים",    icon: <Settings size={18} />,  gradient: "from-slate-50 to-gray-100",    ring: "ring-gray-200", iconCls: "text-gray-600" },
] as const;

const MSG_PRESETS = [
  "תסכם את הנתונים הכספיים של החודש",
  "מהם הלקוחות הפעילים ביותר?",
  "אילו חשבוניות עדיין פתוחות?",
  "מה המגמות בהוצאות לאחרונה?",
];

export default function DashboardAiHub({ orgId }: { orgId: string }) {
  const { dir } = useI18n();
  const [tab, setTab] = useState<HubTab>("scan");
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [providerScan, setProviderScan] = useState("gemini");
  const [providerChat, setProviderChat] = useState("gemini");
  const [providersLoading, setProvidersLoading] = useState(true);
  const [orgPlan, setOrgPlan] = useState<string | null>(null);
  const [cheapScans, setCheapScans] = useState<number | null>(null);
  const [premiumScans, setPremiumScans] = useState<number | null>(null);

  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatQ, setChatQ] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [formContext, setFormContext] = useState("");
  const [formGoal, setFormGoal] = useState("");
  const [formOut, setFormOut] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [docType, setDocType] = useState("invoice");

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const res = await fetch("/api/ai/providers");
      const data = await res.json();
      if (data.providers) setProviders(data.providers);
      if (data.subscriptionTier || data.plan) setOrgPlan(data.subscriptionTier ?? data.plan);
      if (typeof data.cheapScansRemaining === "number") setCheapScans(data.cheapScansRemaining);
      if (typeof data.premiumScansRemaining === "number") setPremiumScans(data.premiumScansRemaining);
      const firstScan = data.providers?.find(
        (p: ProviderRow) => p.configured && p.supportsDocumentScan && p.allowedByPlan !== false
      );
      const firstAny = data.providers?.find(
        (p: ProviderRow) => p.configured && p.allowedByPlan !== false
      );
      if (firstScan) setProviderScan(firstScan.id);
      if (firstAny) setProviderChat(firstAny.id);
    } catch {
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  const configuredChatProviders = useMemo(
    () => providers.filter((p) => p.configured && p.allowedByPlan !== false),
    [providers],
  );

  const configuredScanProviders = useMemo(
    () => providers.filter((p) => p.configured && p.supportsDocumentScan && p.allowedByPlan !== false),
    [providers],
  );

  const activeDocType = DOC_TYPES.find((d) => d.id === docType) ?? DOC_TYPES[0];
  const planLabel = orgPlan ? orgPlan.replace(/_/g, " ") : "—";
  const scansLeft = cheapScans !== null ? cheapScans : "—";

  const sendChat = async () => {
    const q = chatQ.trim();
    if (!q || !orgId) return;
    setChatMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatQ("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, orgId, provider: providerChat }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "ai", text: data.answer ?? data.error ?? "אין תשובה" }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "שגיאת רשת" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const runFormAssist = async () => {
    if (!formContext.trim() || !orgId) return;
    setFormLoading(true);
    setFormOut("");
    const message = `אתה עוזר AI של BSD-YBM. סייע למשתמש למלא מסמך/טופס.

סוג מסמך: ${activeDocType.label}
מטרת המשתמש: ${formGoal || "לא צוין"}
תוכן/הקשר:
${formContext}

החזר בעברית:
1. רשימת שדות מוצעת עם ערכים מלאים
2. אזהרות אם חסר מידע חשוב
3. טיוטת הטקסט הסופי מוכנה להדבקה
`;
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, orgId, provider: providerChat }),
      });
      const data = await res.json();
      setFormOut(data.answer ?? data.error ?? "אין תשובה");
    } catch {
      setFormOut("שגיאת רשת");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      dir={dir}
    >
      {/* ══ HEADER ══ */}
      <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-6 py-7">

        <div className="relative flex flex-col gap-5">
          {/* Title row */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 ring-1 ring-indigo-200">
                <Bot size={24} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">מרכז AI וסריקה</h1>
                <p className="mt-1 text-sm text-gray-500">
                  סריקת מסמכים, עבודה מול הנתונים ועזרה חכמה לטפסים במקום אחד.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {orgPlan && (
                    <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200">
                      <Zap size={10} />
                      {planLabel}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-500 ring-1 ring-gray-200">
                    <Sparkles size={10} />
                    {configuredChatProviders.length} מנועי AI פעילים
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-500 ring-1 ring-gray-200">
                    <ScanLine size={10} />
                    {configuredScanProviders.length} מנועי סריקה · {scansLeft} סריקות
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 self-start rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-200 hover:text-gray-900"
            >
              מנוי וסריקות
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-100 p-1.5 ring-1 ring-gray-200">
            {TABS.map(({ id, label, short, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all ${
                  tab === id
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                    : "text-gray-500 hover:bg-white/70 hover:text-gray-700"
                }`}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="flex-1 bg-gray-50 p-5 md:p-6">
        <AnimatePresence mode="wait">

          {/* ── SCAN TAB ── */}
          {tab === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Doc type chips */}
              <div>
                <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  סוג מסמך לסריקה
                </p>
                <div className="flex flex-wrap gap-2">
                  {DOC_TYPES.map(({ id, label, Icon, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDocType(id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold ring-1 transition-all ${
                        docType === id
                          ? color
                          : "bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 hover:text-gray-700"
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider status */}
              {providersLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4">
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                  <span className="text-sm text-gray-500">טוען מנועי AI...</span>
                </div>
              ) : providers.filter((p) => p.configured && p.supportsDocumentScan).length === 0 ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">אין מנועי AI פעילים</p>
                    <p className="mt-0.5 text-xs text-amber-600">
                      יש להגדיר מפתחות API בהגדרות כדי להפעיל סריקה.
                    </p>
                    <Link
                      href="/dashboard/settings?tab=ai"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-700 underline hover:text-amber-900"
                    >
                      פתח הגדרות AI ←
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* The scanner — logic untouched */}
              <MultiEngineScanner
                variant="dark"
                provider={providerScan}
                fillHeight
                compactHeader
              />

              {/* Tips */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  טיפים לסריקה
                </p>
                <ul className="space-y-1 text-[12px] text-gray-500">
                  <li>• העלה קובץ PDF ברזולוציה גבוהה לתוצאות מדויקות יותר</li>
                  <li>• בחר מספר מנועים לקבלת השוואה ובחירת הטוב ביותר</li>
                  <li>• לחשבוניות — Gemini Pro מספק את הדיוק הגבוה ביותר</li>
                  <li>• לאחר הסריקה ניתן לשמור ישירות ל-ERP או ל-CRM</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* ── CHAT TAB ── */}
          {tab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {/* Provider selector */}
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">מנוע:</p>
                <div className="flex gap-1.5">
                  {configuredChatProviders.length > 0 ? (
                    configuredChatProviders.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProviderChat(p.id)}
                        className={`rounded-xl px-3 py-1.5 text-[12px] font-bold ring-1 transition-all ${
                          providerChat === p.id
                            ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                            : "bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">אין מנועים מוגדרים</span>
                  )}
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {MSG_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChatQ(p)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Message list */}
              <div className="max-h-[350px] min-h-[120px] flex-1 space-y-3 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                    <MessagesSquare size={36} strokeWidth={1.5} />
                    <p className="mt-3 text-sm text-gray-400">שאל שאלה על הנתונים העסקיים שלך</p>
                  </div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {m.role === "user" ? "א" : <Bot size={14} />}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "rounded-tr-sm bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200"
                            : "rounded-tl-sm bg-gray-100 text-gray-700 ring-1 ring-gray-200"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <Loader2 size={14} className="animate-spin text-indigo-500" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 ring-1 ring-gray-200">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="block h-2 w-2 animate-bounce rounded-full bg-indigo-400/65"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatQ}
                  onChange={(e) => setChatQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder="שאל שאלה על הנתונים שלך..."
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={sendChat}
                  disabled={!chatQ.trim() || chatLoading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {chatLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── FORMS TAB ── */}
          {tab === "forms" && (
            <motion.div
              key="forms"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div>
                <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  סוג המסמך
                </p>
                <div className="flex flex-wrap gap-2">
                  {DOC_TYPES.slice(0, 4).map(({ id, label, Icon, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDocType(id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold ring-1 transition-all ${
                        docType === id
                          ? color
                          : "bg-gray-50 text-gray-400 ring-gray-200 hover:bg-gray-50 hover:text-gray-600"
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">מה תרצה שה-AI יעשה?</label>
                <input
                  type="text"
                  value={formGoal}
                  onChange={(e) => setFormGoal(e.target.value)}
                  placeholder={`לדוגמה: מלא ${activeDocType.label} עם הפרטים הבאים`}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">הקשר / פרטים לעיבוד</label>
                <textarea
                  value={formContext}
                  onChange={(e) => setFormContext(e.target.value)}
                  placeholder="הדבק כאן טקסט, שדות, מידע גולמי — ה-AI ימלא ויסדר הכל"
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="button"
                onClick={runFormAssist}
                disabled={!formContext.trim() || formLoading}
                className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {formLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                {formLoading ? "מעבד..." : "עבד עם AI"}
              </button>

              {formOut && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    תוצאת ה-AI
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                    {formOut}
                  </pre>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(formOut)}
                    className="mt-3 text-xs font-bold text-indigo-600 underline hover:text-indigo-800"
                  >
                    העתק תוצאה
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── LINKS TAB ── */}
          {tab === "links" && (
            <motion.div
              key="links"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {QUICK_LINKS.map(({ href, title, desc, icon, gradient, ring, iconCls }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 ring-1 ${ring} transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-gray-200/50`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-gray-200 ${iconCls}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{title}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">{desc}</p>
                  </div>
                  <ExternalLink
                    size={13}
                    className="absolute end-3 top-3 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}