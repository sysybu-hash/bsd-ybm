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

  return (
    <div
      className="flex min-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/40 lg:flex-row lg:items-stretch"
      dir={dir}
    >
      {/* סרגל צד — קומפקטי / נפתח */}
      <motion.aside
        initial={false}
        animate={{ width: railW }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="flex shrink-0 flex-col border-b border-slate-200 bg-slate-100 text-slate-800 lg:border-b-0 lg:border-e lg:border-slate-200"
        style={{ minHeight: "min(100%, 520px)" }}
      >
        <div className="flex items-center justify-between gap-1 p-2 border-b border-slate-200/90">
          {railWide ? (
            <span className="text-xs font-black uppercase tracking-tight px-1 flex items-center gap-1 truncate">
              <Sparkles size={14} className="text-blue-500 shrink-0" />
              מרכז AI
            </span>
          ) : (
            <Sparkles size={18} className="text-blue-500 mx-auto" />
          )}
          <button
            type="button"
            onClick={() => setRailWide((v) => !v)}
            className="p-2 rounded-xl hover:bg-white text-slate-600 border border-transparent hover:border-slate-200"
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
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-2 py-2.5 text-sm font-bold transition-colors lg:w-full ${
                  active
                    ? "border border-blue-200/80 bg-white text-slate-900 shadow-sm ring-1 ring-blue-100/60"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
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
          <h1 className="flex items-center gap-2 text-2xl font-black italic text-slate-900 md:text-3xl">
            <Sparkles className="text-blue-600" size={28} aria-hidden />
            מרכז AI — הכל במקום אחד
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            סריקה עם כמה ספקים, שיחה על נתוני הארגון, טיוטות למילוי טפסים, וקישורים ל-ERP ול-CRM — בלי לחפש ברחבי המערכת.
          </p>
        </header>

        {providersLoading ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-busy="true">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Loader2 className="animate-spin text-blue-600" size={18} aria-hidden />
              טוען סטטוס ספקים…
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="h-14 animate-pulse rounded-xl bg-blue-100/60" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        ) : configuredChatProviders.length === 0 ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900" role="status">
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
              <div className="crystal-border crystal-hover rounded-[2rem] p-4 shadow-lg shadow-blue-200/20 ring-1 ring-slate-200/60 md:p-6">
                <div className="mb-4 border-b border-slate-200/80 pb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">השדרה · במה מרכזית</p>
                  <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-slate-900">
                    <ScanLine className="text-blue-500" size={26} />
                    סריקת מסמכים רב־מנועית
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    העלאה, בחירת ספק ופענוח — כל הממשק במקום אחד.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  {orgPlan === "FREE" && (
                    <p className="rounded-xl border border-slate-200 bg-slate-100/90 px-3 py-2 text-xs text-slate-600">
                      <strong>מנוי FREE:</strong> סריקת מסמכים זמינה עם Gemini. Pro/Business פותחים ספקים נוספים
                      לפי החבילה.
                    </p>
                  )}
                  <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-center">
                    <label className="shrink-0 text-sm font-bold text-slate-800">ספק לסריקה:</label>
                    <select
                      value={providerScan}
                      onChange={(e) => setProviderScan(e.target.value)}
                      className="max-w-md rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm"
                    >
                      {scanProviderOptions.length === 0 ? (
                        <option value="gemini">טוען ספקים…</option>
                      ) : (
                        scanProviderOptions.map((p) => {
                          const usable = p.configured && p.allowedByPlan !== false;
                          return (
                            <option key={p.id} value={p.id} disabled={!usable}>
                              {p.label} —{" "}
                              {!p.configured
                                ? "חסר מפתח בשרת"
                                : p.allowedByPlan === false
                                  ? "דורש שדרוג מנוי"
                                  : p.description}
                            </option>
                          );
                        })
                      )}
                    </select>
                    <button type="button" onClick={() => loadProviders()} className="btn-ghost py-1.5 text-xs text-blue-700">
                      רענון רשימה
                    </button>
                  </div>
                </div>
                <div className="mt-5">
                  <MultiEngineScanner variant="light" provider={providerScan} />
                </div>
              </div>
            </motion.div>
          )}

          {section === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card-avenue space-y-4 rounded-[2rem] p-6 shadow-lg"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Bot className="text-blue-600" size={22} aria-hidden />
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
                  className="btn-primary px-6 py-3 disabled:opacity-40"
                >
                  <Send size={18} aria-hidden />
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
              className="card-avenue space-y-4 rounded-[2rem] p-6 shadow-lg"
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
                  className="card-avenue group flex items-start gap-3 p-5 transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <ExternalLink
                    size={20}
                    className="mt-0.5 shrink-0 text-blue-600 opacity-80 group-hover:opacity-100"
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
