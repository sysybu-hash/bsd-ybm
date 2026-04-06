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
  { id: "invoice",  label: "חשבונית",      Icon: Receipt,       color: "ring-indigo-500/50 bg-indigo-500/10 text-indigo-300" },
  { id: "receipt",  label: "קבלה",         Icon: FileText,      color: "ring-emerald-500/50 bg-emerald-500/10 text-emerald-300" },
  { id: "contract", label: "חוזה",         Icon: FileSignature, color: "ring-violet-500/50 bg-violet-500/10 text-violet-300" },
  { id: "id",       label: "תעודת זהות",   Icon: IdCard,        color: "ring-amber-500/50 bg-amber-500/10 text-amber-300" },
  { id: "medical",  label: "מסמך רפואי",   Icon: Stethoscope,   color: "ring-rose-500/50 bg-rose-500/10 text-rose-300" },
  { id: "custom",   label: "מותאם אישית",  Icon: Wrench,        color: "ring-white/20 bg-white/[0.04] text-white/50" },
];

const QUICK_LINKS = [
  { href: "/dashboard/erp",      title: "ERP — תפעול",    desc: "מסמכים, לוחות ודוחות",  icon: <BarChart3 size={18} />, gradient: "from-indigo-500/20 to-blue-500/10",    ring: "ring-indigo-500/25" },
  { href: "/dashboard/business", title: "CRM — לקוחות",  desc: "אנשי קשר ופרויקטים",    icon: <Users size={18} />,     gradient: "from-emerald-500/20 to-teal-500/10",  ring: "ring-emerald-500/25" },
  { href: "/dashboard",          title: "דשבורד ראשי",   desc: "סיכום ותובנות",          icon: <Sparkles size={18} />,  gradient: "from-violet-500/20 to-purple-500/10", ring: "ring-violet-500/25" },
  { href: "/dashboard/billing",  title: "מנוי ותשלומים", desc: "חבילות ומכסות סריקה",    icon: <CreditCard size={18} />, gradient: "from-rose-500/20 to-pink-500/10",    ring: "ring-rose-500/25" },
  { href: "/dashboard/settings", title: "הגדרות",         desc: "ארגון, API ומשתמשים",    icon: <Settings size={18} />,  gradient: "from-slate-500/20 to-gray-500/10",    ring: "ring-white/15" },
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
      className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0b14] shadow-2xl shadow-black/40"
      dir={dir}
    >
      {/* ══ HEADER ══ */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-br from-indigo-600/15 via-[#0d0e1a] to-violet-600/[0.08] px-6 py-7">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -start-16 -top-16 h-64 w-64 rounded-full bg-indigo-600/[0.12] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -end-12 h-48 w-48 rounded-full bg-violet-600/[0.08] blur-3xl" />

        <div className="relative flex flex-col gap-5">
          {/* Title row */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-500/35">
                <Bot size={24} className="text-indigo-300" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">מרכז AI וסריקה</h1>
                <p className="mt-1 text-sm text-white/45">
                  סריקת מסמכים, עבודה מול הנתונים ועזרה חכמה לטפסים במקום אחד.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {orgPlan && (
                    <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/[0.12] px-3 py-1 text-[11px] font-bold text-indigo-300 ring-1 ring-indigo-500/25">
                      <Zap size={10} />
                      {planLabel}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-[11px] font-bold text-white/50 ring-1 ring-white/[0.08]">
                    <Sparkles size={10} />
                    {configuredChatProviders.length} מנועי AI פעילים
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-[11px] font-bold text-white/50 ring-1 ring-white/[0.08]">
                    <ScanLine size={10} />
                    {configuredScanProviders.length} מנועי סריקה · {scansLeft} סריקות
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 self-start rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/70 ring-1 ring-white/[0.09] transition hover:bg-white/[0.10] hover:text-white"
            >
              מנוי וסריקות
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 rounded-2xl bg-black/30 p-1.5 ring-1 ring-white/[0.05]">
            {TABS.map(({ id, label, short, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all ${
                  tab === id
                    ? "bg-white/[0.10] text-white shadow-sm ring-1 ring-white/15"
                    : "text-white/35 hover:bg-white/[0.06] hover:text-white/65"
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
      <div className="flex-1 bg-[#050508] p-5 md:p-6">
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
                <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-white/25">
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
                          : "bg-white/[0.03] text-white/35 ring-white/[0.07] hover:bg-white/[0.07] hover:text-white/65"
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
                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                  <span className="text-sm text-white/45">טוען מנועי AI...</span>
                </div>
              ) : providers.filter((p) => p.configured && p.supportsDocumentScan).length === 0 ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4">
                  <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-bold text-amber-300">אין מנועי AI פעילים</p>
                    <p className="mt-0.5 text-xs text-amber-400/70">
                      יש להגדיר מפתחות API בהגדרות כדי להפעיל סריקה.
                    </p>
                    <Link
                      href="/dashboard/settings?tab=ai"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-300 underline hover:text-amber-200"
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
              <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.05] p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                  טיפים לסריקה
                </p>
                <ul className="space-y-1 text-[12px] text-white/35">
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
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25">מנוע:</p>
                <div className="flex gap-1.5">
                  {configuredChatProviders.length > 0 ? (
                    configuredChatProviders.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProviderChat(p.id)}
                        className={`rounded-xl px-3 py-1.5 text-[12px] font-bold ring-1 transition-all ${
                          providerChat === p.id
                            ? "bg-indigo-500/[0.18] text-indigo-300 ring-indigo-500/35"
                            : "bg-white/[0.04] text-white/35 ring-white/[0.07] hover:bg-white/[0.08] hover:text-white/65"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-white/25">אין מנועים מוגדרים</span>
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
                    className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/45 transition hover:border-indigo-500/25 hover:bg-indigo-500/[0.07] hover:text-indigo-300"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Message list */}
              <div className="max-h-[350px] min-h-[120px] flex-1 space-y-3 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-white/[0.18]">
                    <MessagesSquare size={36} strokeWidth={1.5} />
                    <p className="mt-3 text-sm text-white/30">שאל שאלה על הנתונים העסקיים שלך</p>
                  </div>
                ) : (
                  chatMessages.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          m.role === "user"
                            ? "bg-indigo-500 text-white"
                            : "bg-white/[0.07] text-white/55"
                        }`}
                      >
                        {m.role === "user" ? "א" : <Bot size={14} />}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "rounded-tr-sm bg-indigo-500/[0.18] text-white ring-1 ring-indigo-500/25"
                            : "rounded-tl-sm bg-white/[0.05] text-white/75 ring-1 ring-white/[0.07]"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.07]">
                      <Loader2 size={14} className="animate-spin text-indigo-400" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/[0.05] px-4 py-3 ring-1 ring-white/[0.07]">
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
                  className="flex-1 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/45 focus:ring-2 focus:ring-indigo-500/15"
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
                <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-white/25">
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
                          : "bg-white/[0.03] text-white/35 ring-white/[0.07] hover:bg-white/[0.07] hover:text-white/65"
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-white/65">מה תרצה שה-AI יעשה?</label>
                <input
                  type="text"
                  value={formGoal}
                  onChange={(e) => setFormGoal(e.target.value)}
                  placeholder={`לדוגמה: מלא ${activeDocType.label} עם הפרטים הבאים`}
                  className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/45 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-white/65">הקשר / פרטים לעיבוד</label>
                <textarea
                  value={formContext}
                  onChange={(e) => setFormContext(e.target.value)}
                  placeholder="הדבק כאן טקסט, שדות, מידע גולמי — ה-AI ימלא ויסדר הכל"
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/25 outline-none transition focus:border-indigo-500/45 focus:ring-2 focus:ring-indigo-500/15"
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
                <div className="rounded-2xl border border-indigo-500/[0.18] bg-indigo-500/[0.06] p-5">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                    תוצאת ה-AI
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
                    {formOut}
                  </pre>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(formOut)}
                    className="mt-3 text-xs font-bold text-indigo-400 underline hover:text-indigo-300"
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
              {QUICK_LINKS.map(({ href, title, desc, icon, gradient, ring }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 ring-1 ${ring} transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-white/65 ring-1 ring-white/[0.08]">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">{desc}</p>
                  </div>
                  <ExternalLink
                    size={13}
                    className="absolute end-3 top-3 text-white/[0.18] opacity-0 transition-opacity group-hover:opacity-100"
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