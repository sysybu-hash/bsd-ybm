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
  { id: "invoice",  label: "חשבונית",      Icon: Receipt,       color: "ring-blue-200 bg-blue-50 text-blue-700" },
  { id: "receipt",  label: "קבלה",         Icon: FileText,      color: "ring-emerald-200 bg-emerald-50 text-emerald-700" },
  { id: "contract", label: "חוזה",         Icon: FileSignature, color: "ring-violet-200 bg-violet-50 text-violet-700" },
  { id: "id",       label: "תעודת זהות",   Icon: IdCard,        color: "ring-amber-200 bg-amber-50 text-amber-700" },
  { id: "medical",  label: "מסמך רפואי",   Icon: Stethoscope,   color: "ring-rose-200 bg-rose-50 text-rose-700" },
  { id: "custom",   label: "מותאם אישית",  Icon: Wrench,        color: "ring-slate-200 bg-slate-100 text-slate-700" },
];

const QUICK_LINKS = [
  { href: "/dashboard/erp",      title: "ERP — תפעול",    desc: "מסמכים, לוחות ודוחות",  icon: <BarChart3 size={18} />, gradient: "from-blue-50 to-sky-50",       ring: "ring-blue-100", iconCls: "text-blue-600" },
  { href: "/dashboard/business", title: "CRM — לקוחות",  desc: "אנשי קשר ופרויקטים",    icon: <Users size={18} />,     gradient: "from-emerald-50 to-teal-50",  ring: "ring-emerald-100", iconCls: "text-emerald-600" },
  { href: "/dashboard",          title: "דשבורד ראשי",   desc: "סיכום ותובנות",          icon: <Sparkles size={18} />,  gradient: "from-violet-50 to-purple-50", ring: "ring-violet-100", iconCls: "text-violet-600" },
  { href: "/dashboard/billing",  title: "מנוי ותשלומים", desc: "חבילות ומכסות סריקה",    icon: <CreditCard size={18} />, gradient: "from-rose-50 to-pink-50",    ring: "ring-rose-100", iconCls: "text-rose-600" },
  { href: "/dashboard/settings", title: "הגדרות",         desc: "ארגון, API ומשתמשים",    icon: <Settings size={18} />,  gradient: "from-slate-50 to-slate-100",    ring: "ring-slate-200", iconCls: "text-slate-600" },
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
      className="card-avenue flex flex-col overflow-hidden"
      dir={dir}
    >
      {/* ══ HEADER ══ */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-tl from-slate-50 via-white to-blue-50/10 px-6 py-7 md:px-8">
        <div className="relative flex flex-col gap-6">
          {/* Title row */}
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100/50 shadow-sm border border-blue-100">
                <Bot size={28} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black italic text-slate-900">מרכז AI וסריקה</h1>
                <p className="mt-1 text-sm text-slate-500 font-medium">
                  סריק מסמכים חכמה, חילוץ מידע, שיחה עם נתונים, ועוזר כתיבה למסמכים עסקיים.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {orgPlan && (
                    <span className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 shadow-sm">
                      <Zap size={13} />
                      {planLabel}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">
                    <Sparkles size={13} className="text-blue-500" />
                    {configuredChatProviders.length} מנועי צ'אט זמינים
                  </span>
                  <span className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">
                    <ScanLine size={13} className="text-blue-500" />
                    {configuredScanProviders.length} מנועי סריקה ({scansLeft} סריקות חוזה נותרו)
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="btn-secondary flex shrink-0 items-center gap-2"
            >
              ניהול מנויים וסריקות
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1.5 border border-slate-200 w-fit">
            {TABS.map(({ id, label, short, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold transition-all ${
                  tab === id
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200 cursor-default"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                <Icon size={16} className={tab === id ? "text-blue-600" : ""} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="flex-1 bg-surface-white p-6 md:p-8">
        <AnimatePresence mode="wait">

          {/* ── SCAN TAB ── */}
          {tab === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Doc type chips */}
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
                  הגדרת סוג המסמכים המיועדים לסריקה עכשיו
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {DOC_TYPES.map(({ id, label, Icon, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDocType(id)}
                      className={`flex items-center shadow-sm gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold ring-1 transition-all ${
                        docType === id
                          ? color
                          : "bg-surface-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider status */}
              {providersLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                  <span className="text-sm font-bold text-slate-600">סורק אחר מנועים קיימים במערכת...</span>
                </div>
              ) : providers.filter((p) => p.configured && p.supportsDocumentScan).length === 0 ? (
                <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                  <Info size={24} className="mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <h3 className="text-base font-black text-amber-900">לא נמצאו מנועי AI פעילים במערכת</h3>
                    <p className="mt-1 text-sm text-amber-800 font-medium">
                      כדי לסרוק מסמכים, יש להגדיר דרך אזור הניהול מפתחות API ולוודא שהחבילה שלך תומכת.
                    </p>
                    <Link
                      href="/dashboard/settings?tab=ai"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 underline hover:text-amber-900"
                    >
                      פתיחת אזור הגדרות ה-AI ←
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* The scanner — logic untouched */}
              <MultiEngineScanner
                variant="light"
                provider={providerScan}
                fillHeight={false}
                compactHeader={false}
              />

              {/* Tips */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 mt-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                  <Sparkles size={14} /> טיפים קצרים לאופטימיזציית סריקה
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm font-medium text-slate-600">
                  <p>🔹 רצוי להעלות קבצי PDF נקיים כדי לשמור על 99% דיוק ומבנה הנתונים.</p>
                  <p>🔹 באפשרותכם לבחור מספר מנועי בינה מלאכותית לקבלת השוואה איכותית ותוצאה מוצלבת.</p>
                  <p>🔹 עבור חשבוניות, Gemini Pro נוטה להחזיר את אחוזי הדיוק והחילוץ הגבוהים ביותר.</p>
                  <p>🔹 בעת קבלת הנתונים תוכלו לנווט לשמירה אוטומטית ל-CRM כארגון חדש.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CHAT TAB ── */}
          {tab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">מודל נבחר מראש:</p>
                  <div className="flex flex-wrap gap-2">
                    {configuredChatProviders.length > 0 ? (
                      configuredChatProviders.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProviderChat(p.id)}
                          className={`rounded-lg px-3 py-1.5 text-[12px] font-bold ring-1 transition-all shadow-sm ${
                            providerChat === p.id
                              ? "bg-blue-600 text-white ring-blue-600"
                              : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))
                    ) : (
                      <span className="text-sm font-medium text-slate-400 border border-dashed border-slate-300 rounded p-1">אין מנועים מקונפגים לשיחה</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2.5">
                {MSG_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChatQ(p)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Message list */}
              <div className="max-h-[400px] min-h-[250px] flex-1 space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50/50 p-4 md:p-6 shadow-inner ring-1 ring-white">
                {chatMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center py-10 text-slate-300">
                    <MessagesSquare size={48} strokeWidth={1} className="text-blue-200" />
                    <p className="mt-4 text-base font-bold text-slate-400 max-w-sm text-center line-clamp-2">
                      דברו באופן טבעי עם הבינה המלאכותית על נתוני ודוחות החברה. אל תוותרו על פירוט.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-sm ${
                          m.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-surface-white text-blue-600 border border-blue-100"
                        }`}
                      >
                        {m.role === "user" ? "US" : <Bot size={20} />}
                      </div>
                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                          m.role === "user"
                            ? "rounded-tr-sm bg-blue-50 text-blue-900 border border-blue-100 font-medium"
                            : "rounded-tl-sm bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white px-5 py-4 border border-slate-200 shadow-sm flex items-center justify-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="block h-2 w-2 animate-bounce rounded-full bg-blue-400"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="flex gap-3 pt-2">
                <input
                  type="text"
                  value={chatQ}
                  onChange={(e) => setChatQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder="כתוב הודעה חדשה לבינה המלאכותית..."
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                />
                <button
                  type="button"
                  onClick={sendChat}
                  disabled={!chatQ.trim() || chatLoading}
                  className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {chatLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} className="mr-0.5" />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── FORMS TAB ── */}
          {tab === "forms" && (
            <motion.div
              key="forms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-5 border-b lg:border-b-0 lg:border-l border-slate-200 pb-6 lg:pb-0 lg:pl-6">
                    <div>
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          תבנית יעד לאכלוס הנתונים
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {DOC_TYPES.slice(0, 4).map(({ id, label, Icon, color }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setDocType(id)}
                              className={`flex items-center shadow-sm gap-2 rounded-lg px-3 py-2 text-[12px] font-bold ring-1 transition-all ${
                                docType === id
                                  ? color
                                  : "bg-surface-white text-slate-500 ring-slate-200 hover:bg-slate-50 hover:text-slate-700"
                              }`}
                            >
                              <Icon size={14} />
                              {label}
                            </button>
                          ))}
                        </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">מה על ה-AI לבצע בנושא נבחר זה?</label>
                      <input
                        type="text"
                        value={formGoal}
                        onChange={(e) => setFormGoal(e.target.value)}
                        placeholder={`הסבירו בתמצית. למשל: פתח לי ${activeDocType.label} חדשה מתורגמת לאנגלית...`}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">גוף המידע - פרטים והקשר לעיבוד</label>
                      <textarea
                        value={formContext}
                        onChange={(e) => setFormContext(e.target.value)}
                        placeholder="הדביקו לכאן תוכן מייל לקוח, העתק מאפליקציה או כל שברי מילים לא מסודרים, והפרומפטים שלנו יפרמטו את הכל לטופס יפה."
                        rows={7}
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={runFormAssist}
                      disabled={!formContext.trim() || formLoading}
                      className="btn-primary w-full shadow-lg shadow-blue-600/20 py-3.5 mt-2"
                    >
                      {formLoading ? (
                        <Loader2 size={18} className="animate-spin ml-2" />
                      ) : (
                        <Sparkles size={18} className="ml-2" />
                      )}
                      {formLoading ? "הבינה המלאכותית בעבודה..." : "בצע הזרקת נתונים ועיבוד כעת"}
                    </button>
                 </div>
                 
                 <div className="relative">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-blue-500">
                      תשובת מנוע עיבוד וסיוע (מוכן להעתקה)
                    </p>
                    <div className="h-[430px] rounded-2xl border border-slate-200 bg-slate-50 relative overflow-y-auto overflow-x-hidden shadow-sm p-5">
                       {!formOut ? (
                           <div className="absolute inset-0 flex flex-col justify-center items-center opacity-50 px-6 text-center text-slate-500">
                              <FilePenLine size={32} className="mb-3 text-slate-400"/>
                              <p className="font-bold text-sm">התוצאה תיבנה באזור זה</p>
                              <p className="text-xs max-w-xs mt-1">מלאו את השדות בצידה השני של המסך והריצו את המנוע לקבלת תבנית מלאה.</p>
                           </div>
                       ) : (
                         <div className="relative w-full h-full">
                           <pre className="whitespace-pre-wrap font-sans text-sm leading-loose text-slate-800 h-full w-full">
                             {formOut}
                           </pre>
                           <button
                             type="button"
                             onClick={() => navigator.clipboard.writeText(formOut)}
                             className="absolute top-0 end-0 bg-white shadow-sm border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-black text-blue-600 hover:bg-slate-50 transition"
                           >
                             להעתיק ניסוח מתוקן
                           </button>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* ── LINKS TAB ── */}
          {tab === "links" && (
            <motion.div
              key="links"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {QUICK_LINKS.map(({ href, title, desc, icon, gradient, ring, iconCls }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-start flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 ring-1 ${ring} transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/5`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-white/60 shadow-sm ${iconCls}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900">{title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{desc}</p>
                  </div>
                  <div className="mt-2 text-[10px] uppercase font-black tracking-wider text-slate-400 group-hover:text-blue-500 transition-colors flex items-center">
                     לצפייה בלוח <ExternalLink size={12} className="ms-1 inline" />
                  </div>
                </Link>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}