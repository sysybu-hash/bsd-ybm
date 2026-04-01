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
import { useI18n } from "@/components/I18nProvider";

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
  const { dir } = useI18n();
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
      const tier =
        typeof data.subscriptionTier === "string"
          ? data.subscriptionTier
          : typeof data.plan === "string"
            ? data.plan
            : null;
      if (tier) setOrgPlan(tier);
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

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15";

  return (
    <div
      className="flex min-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:flex-row lg:items-stretch"
      dir={dir}
    >
      {/* ── Sidebar rail ── */}
      <motion.aside
        initial={false}
        animate={{ width: railW }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="flex shrink-0 flex-col border-b border-slate-100 bg-slate-900 lg:border-b-0 lg:border-e lg:border-slate-100"
        style={{ minHeight: "min(100%, 520px)" }}
      >
        <div className="flex items-center justify-between gap-1 border-b border-white/8 p-3">
          {railWide ? (
            <span className="flex items-center gap-1.5 truncate px-1 text-xs font-black uppercase tracking-tight text-white">
              <Sparkles size={13} className="shrink-0 text-blue-400" />
              מרכז AI
            </span>
          ) : (
            <Sparkles size={17} className="mx-auto text-blue-400" />
          )}
          <button
            type="button"
            onClick={() => setRailWide((v) => !v)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label={railWide ? "צמצם סרגל" : "הרחב סרגל"}
          >
            {railWide ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>
        <nav className="flex flex-1 flex-row gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
          {railItems.map(({ id, label, short, Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-2.5 py-2.5 text-sm font-bold transition-all lg:w-full ${
                  active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/8 hover:text-slate-200"
                }`}
              >
                <Icon size={18} className="shrink-0" aria-hidden />
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
          <p className="hidden pb-3 text-center text-[9px] leading-tight text-slate-500 lg:block">
            {railItems.find((i) => i.id === section)?.short}
          </p>
        )}
      </motion.aside>

      {/* ── Main content ── */}
      <div className="min-w-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/40 p-5 md:p-7">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <Sparkles className="text-blue-600" size={24} aria-hidden />
            מרכז AI
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            סריקה, שיחה, טיוטות וקישורים — הכל במקום אחד
          </p>
        </div>

        {providersLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" aria-busy="true">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-500">
              <Loader2 className="animate-spin text-blue-600" size={17} aria-hidden />
              טוען סטטוס ספקים…
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[0,1,2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          </div>
        ) : configuredChatProviders.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
            <strong>אין ספק AI מוגדר.</strong> הגדרו לפחות אחד מ:{" "}
            <code className="text-xs">GOOGLE_GENERATIVE_AI_API_KEY</code>,{" "}
            <code className="text-xs">OPENAI_API_KEY</code>,{" "}
            <code className="text-xs">ANTHROPIC_API_KEY</code>,{" "}
            <code className="text-xs">GROQ_API_KEY</code>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {section === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 border-b border-slate-100 pb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    <ScanLine size={10} /> סריקה רב-מנועית
                  </span>
                  <h2 className="mt-2 text-base font-black text-slate-900">סריקת מסמכים</h2>
                  <p className="mt-0.5 text-xs text-slate-500">העלאה, בחירת ספק ופענוח — כל הממשק במקום אחד.</p>
                </div>

                {orgPlan === "FREE" && (
                  <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <strong>מנוי FREE:</strong> סריקה זמינה עם Gemini. Pro/Business פותחים ספקים נוספים.
                  </div>
                )}

                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <label className="shrink-0 text-sm font-bold text-slate-700">ספק:</label>
                  <select
                    value={providerScan}
                    onChange={(e) => setProviderScan(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm outline-none focus:border-blue-400"
                  >
                    {scanProviderOptions.length === 0 ? (
                      <option value="gemini">טוען…</option>
                    ) : (
                      scanProviderOptions.map((p) => (
                        <option key={p.id} value={p.id} disabled={!(p.configured && p.allowedByPlan !== false)}>
                          {p.label} — {!p.configured ? "חסר מפתח" : p.allowedByPlan === false ? "נדרש שדרוג" : p.description}
                        </option>
                      ))
                    )}
                  </select>
                  <button type="button" onClick={() => loadProviders()} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50">
                    רענן
                  </button>
                </div>
                <MultiEngineScanner variant="light" provider={providerScan} />
              </div>
            </motion.div>
          )}

          {section === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Bot className="text-blue-600" size={20} aria-hidden />
                <h2 className="text-base font-black text-slate-900">עוזר על נתוני הארגון</h2>
                <select
                  value={providerChat}
                  onChange={(e) => setProviderChat(e.target.value)}
                  className="ms-auto rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id} disabled={!(p.configured && p.allowedByPlan !== false)}>
                      {p.label}{!p.configured ? " — חסר מפתח" : p.allowedByPlan === false ? " — שדרג מנוי" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400">נשלח לספק עד ~50 מסמכים אחרונים כהקשר.</p>
              <div className="min-h-[160px] rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm whitespace-pre-wrap text-slate-800">
                {chatA || <span className="italic text-slate-400">התשובה תופיע כאן</span>}
                {chatLoading && <Loader2 className="mt-2 animate-spin text-blue-600" size={18} />}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={chatQ}
                  onChange={(e) => setChatQ(e.target.value)}
                  placeholder="שאלה — למשל: סכם את ההוצאות מהחודש..."
                  className={inputCls}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), runChat())}
                />
                <button
                  type="button"
                  onClick={runChat}
                  disabled={chatLoading || !chatQ.trim()}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "var(--primary-color, #2563eb)" }}
                >
                  <Send size={16} aria-hidden />
                  שלח
                </button>
              </div>
            </motion.div>
          )}

          {section === "forms" && (
            <motion.div key="forms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6 space-y-4">
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                <FilePenLine className="text-emerald-600" size={20} />
                מילוי טפסים וטיוטות
              </h2>
              <p className="text-sm text-slate-500">הדבקו טקסט טופס/שדות. התשובה מיועדת להעתקה — לא חתימה משפטית.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">הנחיות מילוי</label>
                  <textarea value={formGoal} onChange={(e) => setFormGoal(e.target.value)} placeholder="למשל: מלא פרטי עוסק וסכום ביטול" className="h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">תוכן / טופס</label>
                  <textarea value={formContext} onChange={(e) => setFormContext(e.target.value)} placeholder="הדבק כאן טקסט השדות או הטיוטה" className="h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-600">ספק:</span>
                <select value={providerChat} onChange={(e) => setProviderChat(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none">
                  {configuredChatProviders.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.allowedByPlan === false}>
                      {p.label}{p.allowedByPlan === false ? ` — ${planBlockLabel}` : ""}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={runFormAssist} disabled={formLoading || !formContext.trim()} className="ms-auto inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40">
                  {formLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                  ייצר טיוטה
                </button>
              </div>
              <div className="min-h-[120px] rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm whitespace-pre-wrap text-slate-800">
                {formOut || <span className="italic text-slate-400">הטיוטה תופיע כאן</span>}
              </div>
            </motion.div>
          )}

          {section === "links" && (
            <motion.div key="links" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid gap-3 sm:grid-cols-2">
              {quickLinks.map(({ href, title, desc }) => (
                <Link key={href} href={href} className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                  <ExternalLink size={18} className="mt-0.5 shrink-0 text-blue-500 transition group-hover:text-blue-600" aria-hidden />
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-blue-700">{title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
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
