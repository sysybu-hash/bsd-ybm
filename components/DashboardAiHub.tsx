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
  ChevronDown,
  Info,
  CreditCard,
  BarChart3,
  Settings,
  Users,
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
  { id: "scan",  label: "סריקת מסמכים",   short: "סריקה",    Icon: ScanLine },
  { id: "chat",  label: "שיחה עם הנתונים", short: "צ׳אט AI",  Icon: MessagesSquare },
  { id: "forms", label: "עוזר טפסים",      short: "טפסים",    Icon: FilePenLine },
  { id: "links", label: "קישורים מהירים",  short: "קישורים",  Icon: LayoutGrid },
];

const DOC_TYPES = [
  { id: "invoice",  label: "חשבונית",       Icon: Receipt,        color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "receipt",  label: "קבלה",          Icon: FileText,       color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "contract", label: "חוזה",          Icon: FileSignature,  color: "text-violet-600 bg-violet-50 border-violet-200" },
  { id: "id",       label: "תעודת זהות",    Icon: IdCard,         color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "medical",  label: "מסמך רפואי",    Icon: Stethoscope,    color: "text-rose-600 bg-rose-50 border-rose-200" },
  { id: "custom",   label: "מותאם אישית",   Icon: Wrench,         color: "text-slate-600 bg-slate-50 border-slate-200" },
];

const QUICK_LINKS = [
  { href: "/dashboard/erp",          title: "ERP — תפעול",       desc: "מסמכים, לוחות ודוחות",   icon: <BarChart3 size={18} />,      color: "bg-blue-50 text-blue-600 border-blue-200" },
  { href: "/dashboard/business",     title: "CRM — לקוחות",      desc: "אנשי קשר ופרויקטים",      icon: <Users size={18} />,          color: "bg-violet-50 text-violet-600 border-violet-200" },
  { href: "/dashboard",              title: "דשבורד ראשי",        desc: "סיכום ותובנות",            icon: <Sparkles size={18} />,       color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { href: "/dashboard/billing",      title: "מנוי ותשלומים",      desc: "חבילות ומכסות סריקה",      icon: <CreditCard size={18} />,     color: "bg-rose-50 text-rose-600 border-rose-200" },
  { href: "/dashboard/settings",     title: "הגדרות",             desc: "ארגון, API ומשתמשים",      icon: <Settings size={18} />,       color: "bg-slate-50 text-slate-600 border-slate-200" },
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
  const [showDocTypes, setShowDocTypes] = useState(false);

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const res = await fetch("/api/ai/providers");
      const data = await res.json();
      if (data.providers) setProviders(data.providers);
      if (data.subscriptionTier || data.plan) setOrgPlan(data.subscriptionTier ?? data.plan);
      if (typeof data.cheapScansRemaining === "number") setCheapScans(data.cheapScansRemaining);
      if (typeof data.premiumScansRemaining === "number") setPremiumScans(data.premiumScansRemaining);
      const firstScan = data.providers?.find((p: ProviderRow) => p.configured && p.supportsDocumentScan && p.allowedByPlan !== false);
      const firstAny = data.providers?.find((p: ProviderRow) => p.configured && p.allowedByPlan !== false);
      if (firstScan) setProviderScan(firstScan.id);
      if (firstAny) setProviderChat(firstAny.id);
    } catch { setProviders([]); }
    finally { setProvidersLoading(false); }
  }, []);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  const configuredChatProviders = useMemo(
    () => providers.filter((p) => p.configured && p.allowedByPlan !== false),
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
    } finally { setChatLoading(false); }
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
    } finally { setFormLoading(false); }
  };

  return (
    <div className="flex flex-col gap-0 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden" dir={dir}>

      {/* ══ HEADER ══ */}
      <div className="bg-gradient-to-l from-indigo-950 to-indigo-900 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-400 shadow-lg shadow-indigo-500/30">
              <Bot size={22} className="text-indigo-950" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">מרכז AI וסריקה</h1>
              <p className="text-[11px] text-indigo-300/60">סורק מסמכים · צ׳אט עם הנתונים · עוזר טפסים</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {orgPlan && (
              <span className="flex items-center gap-1 rounded-full bg-indigo-400/20 border border-indigo-400/20 px-3 py-1 text-[11px] font-bold text-indigo-200">
                <Zap size={10} className="text-indigo-300" />
                {planLabel}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-white/8 border border-white/10 px-3 py-1 text-[11px] font-bold text-white/70">
              <ScanLine size={10} />
              {scansLeft} סריקות
            </span>
            <Link href="/dashboard/billing" className="flex items-center gap-1 rounded-full bg-indigo-400 px-3 py-1 text-[11px] font-bold text-indigo-950 hover:bg-indigo-300 transition-colors">
              שדרג
            </Link>
          </div>
        </div>

        {/* Tab nav */}
        <div className="mt-5 flex gap-1 border-b border-indigo-800/40 pb-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-[12px] font-bold transition-all ${
                tab === id
                  ? "bg-white/10 text-white"
                  : "text-indigo-300/55 hover:text-indigo-200 hover:bg-white/5"
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.slice(0,5)}</span>
              {tab === id && (
                <motion.span
                  layoutId="ai-hub-tab-indicator"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-indigo-400"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="flex-1 p-5 md:p-6">
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
              {/* Document type selector */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">סוג מסמך לסריקה</p>
                <div className="flex flex-wrap gap-2">
                  {DOC_TYPES.map(({ id, label, Icon, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDocType(id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-all ${
                        docType === id
                          ? color
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scanner info */}
              {providersLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-sm text-gray-500">טוען מנועי AI...</span>
                </div>
              ) : providers.filter(p => p.configured && p.supportsDocumentScan).length === 0 ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">אין מנועי AI פעילים</p>
                    <p className="mt-0.5 text-xs text-amber-700">יש להגדיר מפתחות API בהגדרות כדי להפעיל סריקה.</p>
                    <Link href="/dashboard/settings?tab=ai" className="mt-2 inline-flex text-xs font-bold text-amber-800 underline">
                      פתח הגדרות AI ←
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* MultiEngineScanner — הלוגיקה ממוקמת כאן, לא משנים */}
              <MultiEngineScanner
                variant="light"
                provider={providerScan}
                fillHeight
                compactHeader
              />

              {/* Quick tips */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-indigo-600">טיפים לסריקה מושלמת</p>
                <ul className="space-y-1 text-[12px] text-indigo-800/70">
                  <li>• העלה קובץ PDF ברזולוציה גבוהה לתוצאות מדויקות יותר</li>
                  <li>• בחר מספר מנועים לקבלת השוואה ובחירת הטוב ביותר</li>
                  <li>• לחשבוניות — המנוע Gemini Pro נותן את הדיוק הגבוה ביותר</li>
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
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">מנוע:</p>
                <div className="flex gap-1.5">
                  {configuredChatProviders.length > 0 ? (
                    configuredChatProviders.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProviderChat(p.id)}
                        className={`rounded-xl border px-3 py-1 text-[12px] font-bold transition-all ${
                          providerChat === p.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "border-gray-200 text-gray-600 hover:border-indigo-300"
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

              {/* Preset questions */}
              <div className="flex flex-wrap gap-2">
                {MSG_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChatQ(p)}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px] min-h-[120px]">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                    <MessagesSquare size={36} strokeWidth={1.5} />
                    <p className="mt-3 text-sm text-gray-400">שאל שאלה על הנתונים העסקיים שלך</p>
                  </div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        m.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                      }`}>
                        {m.role === "user" ? "א" : <Bot size={14} />}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-sm"
                          : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <Loader2 size={14} className="animate-spin text-indigo-600" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 px-4 py-3">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <span key={i} className="block h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatQ}
                  onChange={(e) => setChatQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder="שאל שאלה על הנתונים שלך..."
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                />
                <button
                  type="button"
                  onClick={sendChat}
                  disabled={!chatQ.trim() || chatLoading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">סוג המסמך</p>
                <div className="flex flex-wrap gap-2">
                  {DOC_TYPES.slice(0, 4).map(({ id, label, Icon, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDocType(id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-all ${
                        docType === id ? color : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      <Icon size={12} />
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
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">הקשר / פרטים לעיבוד</label>
                <textarea
                  value={formContext}
                  onChange={(e) => setFormContext(e.target.value)}
                  placeholder="הדבק כאן טקסט, שדות, מידע גולמי — ה-AI ימלא ויסדר הכל"
                  rows={5}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={runFormAssist}
                disabled={!formContext.trim() || formLoading}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {formLoading ? "מעבד..." : "עבד עם AI"}
              </button>

              {formOut && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-indigo-600">תוצאת ה-AI</p>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-sans">{formOut}</pre>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(formOut)}
                    className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
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
              {QUICK_LINKS.map(({ href, title, desc, icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${color.split(" ")[2]}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color.split(" ")[0]} ${color.split(" ")[1]}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{title}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">{desc}</p>
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