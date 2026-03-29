"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  ScanLine,
  MessagesSquare,
  FilePenLine,
  LayoutGrid,
  ExternalLink,
  Send,
  Loader2,
  Bot,
} from "lucide-react";
import MultiEngineScanner from "@/components/MultiEngineScanner";

type HubSection = "scan" | "chat" | "forms" | "links";

type ProviderRow = {
  id: string;
  label: string;
  description: string;
  configured: boolean;
  supportsDocumentScan: boolean;
  allowedByPlan?: boolean;
};

const railItems: { id: HubSection; label: string; short: string; Icon: typeof ScanLine }[] = [
  { id: "scan", label: "סריקת מסמכים", short: "סריקה", Icon: ScanLine },
  { id: "chat", label: "שיחה עם הנתונים", short: "צ׳אט", Icon: MessagesSquare },
  { id: "forms", label: "מילוי טפסים", short: "טפסים", Icon: FilePenLine },
  { id: "links", label: "קישורים מהירים", short: "קישורים", Icon: LayoutGrid },
];

const quickLinks = [
  { href: "/dashboard/erp", title: "ERP — תפעול וכספים", desc: "סריקה, מסמכים, לוחות" },
  { href: "/dashboard/crm", title: "CRM — לקוחות", desc: "אנשי קשר ופרויקטים" },
  { href: "/dashboard", title: "דשבורד ראשי", desc: "סיכום ותובנות" },
  { href: "/dashboard/billing", title: "מנוי ותשלומים", desc: "חבילות ומכסות" },
  { href: "/dashboard/settings", title: "הגדרות", desc: "ארגון וחשבון" },
] as const;

export default function DashboardAiHub({ orgId }: { orgId: string }) {
  const [railWide, setRailWide] = useState(false);
  const [section, setSection] = useState<HubSection>("scan");
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [providerScan, setProviderScan] = useState("gemini");
  const [providerChat, setProviderChat] = useState("gemini");
  const [providersLoading, setProvidersLoading] = useState(true);
  const [orgPlan, setOrgPlan] = useState<string | null>(null);

  const [chatQ, setChatQ] = useState("");
  const [chatA, setChatA] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [formContext, setFormContext] = useState("");
  const [formGoal, setFormGoal] = useState("");
  const [formOut, setFormOut] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const res = await fetch("/api/ai/providers");
      const data = await res.json();
      if (data.providers) setProviders(data.providers);
      if (typeof data.plan === "string") setOrgPlan(data.plan);
      const firstScan = data.providers?.find(
        (p: ProviderRow) =>
          p.configured && p.supportsDocumentScan && p.allowedByPlan !== false,
      );
      const firstAny = data.providers?.find(
        (p: ProviderRow) => p.configured && p.allowedByPlan !== false,
      );
      if (firstScan) setProviderScan(firstScan.id);
      if (firstAny) setProviderChat(firstAny.id);
    } catch {
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const scanProviderOptions = useMemo(
    () => providers.filter((p) => p.supportsDocumentScan),
    [providers],
  );
  const configuredScanProviders = useMemo(
    () => scanProviderOptions.filter((p) => p.configured && p.allowedByPlan !== false),
    [scanProviderOptions],
  );
  const configuredChatProviders = useMemo(
    () => providers.filter((p) => p.configured && p.allowedByPlan !== false),
    [providers],
  );

  const planBlockLabel = "נדרש שדרוג מנוי";

  useEffect(() => {
    const cur = providers.find((p) => p.id === providerScan);
    if (cur?.allowedByPlan === false) {
      const next = configuredScanProviders.find((p) => p.allowedByPlan !== false);
      if (next) setProviderScan(next.id);
    }
  }, [providers, providerScan, configuredScanProviders]);

  useEffect(() => {
    const cur = providers.find((p) => p.id === providerChat);
    if (cur?.allowedByPlan === false) {
      const next = configuredChatProviders.find((p) => p.allowedByPlan !== false);
      if (next) setProviderChat(next.id);
    }
  }, [providers, providerChat, configuredChatProviders]);

  const runChat = async () => {
    if (!chatQ.trim() || !orgId) return;
    setChatLoading(true);
    setChatA("");
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatQ, orgId, provider: providerChat }),
      });
      const data = await res.json();
      setChatA(data.answer ?? data.error ?? "אין תשובה");
    } catch {
      setChatA("שגיאת רשת");
    } finally {
      setChatLoading(false);
    }
  };

  const runFormAssist = async () => {
    if (!formContext.trim() || !orgId) return;
    setFormLoading(true);
    setFormOut("");
    const message = `אתה מסייר במסגרת BSD-YBM. המשתמש רוצה למלא טופס או מסמך.

הנחיות המשתמש (מה למלא / איך):
${formGoal || "—"}

תוכן/הקשר (שדות, טקסט גולמי, או טיוטה):
${formContext}

החזר בעברית: (1) רשימת שדות מוצעת עם ערכים (2) אזהרות אם חסר מידע (3) טקסט מוכן להדבקה אם רלוונטי.`;

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

  const railW = railWide ? 196 : 58;

  return (
    <div
      className="flex flex-col gap-4 lg:flex-row lg:items-stretch min-h-[calc(100dvh-6rem)] rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/40 overflow-hidden"
      dir="rtl"
    >
      {/* סרגל צד — קומפקטי / נפתח */}
      <motion.aside
        initial={false}
        animate={{ width: railW }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="shrink-0 border-b border-slate-200 lg:border-b-0 lg:border-l bg-slate-900 text-white flex flex-col"
        style={{ minHeight: "min(100%, 520px)" }}
      >
        <div className="flex items-center justify-between gap-1 p-2 border-b border-white/10">
          {railWide ? (
            <span className="text-xs font-black uppercase tracking-tight px-1 flex items-center gap-1 truncate">
              <Sparkles size={14} className="text-amber-300 shrink-0" />
              מרכז AI
            </span>
          ) : (
            <Sparkles size={18} className="text-amber-300 mx-auto" />
          )}
          <button
            type="button"
            onClick={() => setRailWide((v) => !v)}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-300"
            aria-label={railWide ? "צמצם סרגל" : "הרחב סרגל"}
          >
            {railWide ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
        <nav className="flex-1 flex flex-row lg:flex-col gap-1 p-2 overflow-x-auto lg:overflow-visible">
          {railItems.map(({ id, label, short, Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-bold transition-colors whitespace-nowrap lg:w-full ${
                  active ? "bg-white/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} className="shrink-0" aria-hidden />
                <AnimatePresence initial={false}>
                  {railWide && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="truncate"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!railWide && <span className="sr-only">{label}</span>}
              </button>
            );
          })}
        </nav>
        {!railWide && (
          <p className="hidden lg:block text-[9px] text-slate-500 text-center px-1 pb-2 leading-tight">
            {railItems.find((i) => i.id === section)?.short}
          </p>
        )}
      </motion.aside>

      {/* תוכן ראשי */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50">
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black italic text-slate-900 flex items-center gap-2">
            <Sparkles className="text-[var(--primary-color,#3b82f6)]" size={28} />
            מרכז AI — הכל במקום אחד
          </h1>
          <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
            סריקה עם כמה ספקים, שיחה על נתוני הארגון, טיוטות למילוי טפסים, וקישורים ל-ERP ול-CRM — בלי לחפש ברחבי המערכת.
          </p>
        </header>

        {providersLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin" size={18} /> טוען סטטוס ספקים…
          </div>
        ) : configuredChatProviders.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong>אין ספק AI מוגדר.</strong> הגדרו לפחות אחד מ:{" "}
            <code className="text-xs">GOOGLE_GENERATIVE_AI_API_KEY</code>,{" "}
            <code className="text-xs">OPENAI_API_KEY</code>,{" "}
            <code className="text-xs">ANTHROPIC_API_KEY</code>, <code className="text-xs">GROQ_API_KEY</code> ב-Vercel או ב־.env
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {section === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex flex-col gap-2 sm:gap-3">
                {orgPlan === "FREE" && (
                  <p className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                    <strong>מנוי FREE:</strong> סריקת מסמכים זמינה עם Gemini. Pro/Business פותחים ספקים
                    נוספים לפי החבילה.
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                  <label className="text-sm font-bold text-slate-800 shrink-0">ספק לסריקה:</label>
                  <select
                    value={providerScan}
                    onChange={(e) => setProviderScan(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium max-w-md"
                  >
                    {scanProviderOptions.length === 0 ? (
                      <option value="gemini">טוען ספקים…</option>
                    ) : (
                      scanProviderOptions.map((p) => {
                        const usable = p.configured && p.allowedByPlan !== false;
                        return (
                          <option key={p.id} value={p.id} disabled={!usable}>
                            {p.label} — {!p.configured ? "חסר מפתח בשרת" : p.allowedByPlan === false ? "דורש שדרוג מנוי" : p.description}
                          </option>
                        );
                      })
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => loadProviders()}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    רענון רשימה
                  </button>
                </div>
              </div>
              <MultiEngineScanner variant="light" provider={providerScan} />
            </motion.div>
          )}

          {section === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl space-y-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Bot className="text-[var(--primary-color)]" size={22} />
                <h2 className="text-lg font-black text-slate-900">עוזר על נתוני הארגון</h2>
                <select
                  value={providerChat}
                  onChange={(e) => setProviderChat(e.target.value)}
                  className="ms-auto rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {providers.map((p) => {
                    const usable = p.configured && p.allowedByPlan !== false;
                    return (
                      <option key={p.id} value={p.id} disabled={!usable}>
                        {p.label}
                        {!p.configured ? " — חסר מפתח" : p.allowedByPlan === false ? " — שדרוג מנוי" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="text-xs text-slate-500">
                נשלח לספק עד ~50 מסמכים אחרונים כהקשר (כמו עוזר הגלובוס בתחתית המסך, כאן במסך מלא).
              </p>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 min-h-[160px] p-4 text-sm text-slate-800 whitespace-pre-wrap">
                {chatA || <span className="text-slate-400 italic">התשובה תופיע כאן</span>}
                {chatLoading && <Loader2 className="animate-spin mt-2 text-blue-600" size={20} />}
              </div>
              <div className="flex gap-2 flex-col sm:flex-row">
                <input
                  value={chatQ}
                  onChange={(e) => setChatQ(e.target.value)}
                  placeholder="שאלה — למשל: סכם את סוגי ההוצאות מהחודש..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), runChat())}
                />
                <button
                  type="button"
                  onClick={runChat}
                  disabled={chatLoading || !chatQ.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] text-white font-bold px-6 py-3 disabled:opacity-40"
                >
                  <Send size={18} />
                  שלח
                </button>
              </div>
            </motion.div>
          )}

          {section === "forms" && (
            <motion.div
              key="forms"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl space-y-4"
            >
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FilePenLine className="text-emerald-600" size={22} />
                מילוי טפסים וטיוטות
              </h2>
              <p className="text-sm text-slate-600">
                הדבקו טקסט טופס / שדות / דוגמה. הנחיות — מה למלא בשביל מי. התשובה מיועדת להעתקה ידנית למערכות חיצוניות (לא חתימה משפטית).
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">הנחיות מילוי</label>
                  <textarea
                    value={formGoal}
                    onChange={(e) => setFormGoal(e.target.value)}
                    placeholder="למשל: מלא פרטי עוסק וסכום ביטול"
                    className="w-full h-28 rounded-xl border border-slate-200 p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">תוכן / טופס</label>
                  <textarea
                    value={formContext}
                    onChange={(e) => setFormContext(e.target.value)}
                    placeholder="הדבק כאן טקסט השדות או הטיוטה"
                    className="w-full h-28 rounded-xl border border-slate-200 p-3 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-600">ספק:</span>
                <select
                  value={providerChat}
                  onChange={(e) => setProviderChat(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {configuredChatProviders.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.allowedByPlan === false}>
                      {p.label}
                      {p.allowedByPlan === false ? ` — ${planBlockLabel}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={runFormAssist}
                  disabled={formLoading || !formContext.trim()}
                  className="ms-auto inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-bold px-5 py-2.5 disabled:opacity-40"
                >
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                  ייצר טיוטת מילוי
                </button>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 min-h-[120px] p-4 text-sm whitespace-pre-wrap text-slate-800">
                {formOut || <span className="text-slate-400 italic">הטיוטה תופיע כאן</span>}
              </div>
            </motion.div>
          )}

          {section === "links" && (
            <motion.div
              key="links"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {quickLinks.map(({ href, title, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <ExternalLink
                    size={20}
                    className="mt-0.5 shrink-0 text-[var(--primary-color)] opacity-70 group-hover:opacity-100"
                    aria-hidden
                  />
                  <div>
                    <div className="font-black text-slate-900">{title}</div>
                    <div className="text-sm text-slate-500 mt-1">{desc}</div>
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
