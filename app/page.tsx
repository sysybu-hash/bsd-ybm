"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, CalendarClock, FileText, Hammer, LineChart, MapPin, Receipt, ShieldCheck } from "lucide-react";
import AdaptiveWidgetShell from "@/components/os/AdaptiveWidgetShell";
import Omnibar from "@/components/os/Omnibar";

type ChatRole = "user" | "assistant" | "system";

type ChatMessage = Readonly<{
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}>;

type GenerativeSurface = Readonly<{
  project: boolean;
  invoice: boolean;
}>;

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function inferSurfacesFromText(text: string): GenerativeSurface {
  const t = text.toLowerCase();
  const wantsProject =
    /פרויקט|אתר|בנייה|קבלן|לו"ז|לוז|צוות|עובדים|project|site|schedule|crew/.test(t);
  const wantsInvoice =
    /חשבונית|חשבון|תשלום|מע"מ|מס|quote|invoice|payment|vat|billing/.test(t);

  if (wantsProject || wantsInvoice) {
    return { project: wantsProject, invoice: wantsInvoice };
  }

  if (t.trim().length === 0) return { project: false, invoice: false };
  return { project: true, invoice: true };
}

function buildAssistantReply(userText: string, surfaces: GenerativeSurface): string {
  const trimmed = userText.trim();
  if (!trimmed) {
    return "אני כאן. תאר את הבנייה, הלקוח או המסמך — ואייתר את הווידג'טים הרלוונטיים על הקנבס.";
  }

  const parts: string[] = [];

  if (surfaces.project && surfaces.invoice) {
    parts.push("מיפיתי משימה מעורבת — הצגתי כרטיס פרויקט חי וטיוטת חשבונית מהירה.");
  } else if (surfaces.project) {
    parts.push("הדגשתי את ליבת האתר — כרטיס הפרויקט עלה לקדמת המסך.");
  } else if (surfaces.invoice) {
    parts.push("מסלול החיובים הופעל — טיוטת חשבונית מהירה מוכנה לעריכה.");
  } else {
    parts.push("עדכנתי את הקנבס בהתאם לבקשה.");
  }

  parts.push("בשלב זה זו הדגמה מקומית; חיבור מנוע AI אמיתי יחליף את הלוגיקה הזו בלי לשנות את מעטפת ה-Omni-Canvas.");

  return parts.join(" ");
}

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [voice, setVoice] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: "assistant",
      content:
        "ברוכים הבאים ל-Singularity. אין תפריטים — רק קנבס. כתבו פקודה בשורה התחתונה ואני אציג את הרכיבים הנכונים לפי ההקשר.",
      createdAt: Date.now(),
    },
  ]);
  const [surfaces, setSurfaces] = useState<GenerativeSurface>({ project: false, invoice: false });
  const [projectDismissed, setProjectDismissed] = useState(false);
  const [invoiceDismissed, setInvoiceDismissed] = useState(false);

  const visibleProject = surfaces.project && !projectDismissed;
  const visibleInvoice = surfaces.invoice && !invoiceDismissed;

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text || busy) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, createdAt: Date.now() };
    setDraft("");
    setMessages((m) => [...m, userMsg]);
    setBusy(true);

    window.setTimeout(() => {
      const next = inferSurfacesFromText(text);
      let merged: GenerativeSurface = { project: false, invoice: false };
      setSurfaces((prev) => {
        merged = {
          project: prev.project || next.project,
          invoice: prev.invoice || next.invoice,
        };
        return merged;
      });
      if (next.project) setProjectDismissed(false);
      if (next.invoice) setInvoiceDismissed(false);

      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: buildAssistantReply(text, merged),
        createdAt: Date.now(),
      };
      setMessages((m) => [...m, assistantMsg]);
      setBusy(false);
    }, 520);
  }, [busy, draft]);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant"),
    [messages],
  );

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(120% 80% at 10% 0%, rgba(56,189,248,0.22), transparent 55%), radial-gradient(90% 70% at 95% 10%, rgba(168,85,247,0.2), transparent 50%), radial-gradient(80% 60% at 50% 100%, rgba(14,165,233,0.12), transparent 55%), #030712",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-soft-light opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(70% 60% at 50% 35%, black, transparent)",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl"
          animate={
            reduceMotion
              ? {}
              : { x: [0, 24, 0], y: [0, -18, 0], scale: [1, 1.05, 1], opacity: [0.35, 0.55, 0.35] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-violet-500/15 blur-3xl"
          animate={
            reduceMotion
              ? {}
              : { x: [0, -20, 0], y: [0, 14, 0], scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }
          }
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 pb-44 pt-7 sm:px-6 sm:pt-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Singularity · 2026</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Omni-Canvas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              מערכת הפעלה אחת לבנייה — CRM, ERP ותפעול מתמזגים לקנבס יחיד. השורה התחתונה היא ממשק הפיקוד; הרקע הוא משטח הייצור החי שלך.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 ring-1 ring-white/5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/90" aria-hidden />
              מצב לילה אדפטיבי
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 ring-1 ring-white/5">
              <LineChart className="h-3.5 w-3.5 text-cyan-200/90" aria-hidden />
              Generative UI (מדומה)
            </span>
          </div>
        </header>

        <section aria-label="מצב שיחה" className="mt-8 flex flex-1 flex-col gap-6 lg:flex-row">
          <div className="lg:w-[42%]">
            <div className="rounded-2xl border border-white/[0.1] bg-zinc-950/40 p-4 shadow-inner shadow-black/30 backdrop-blur-xl ring-1 ring-white/[0.06]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">יומן שיחה</p>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/55 ring-1 ring-white/10">
                  {messages.length} הודעות
                </span>
              </div>
              <ol className="mt-3 max-h-[min(52vh,28rem)] space-y-3 overflow-y-auto overscroll-contain pe-1">
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.li
                      key={m.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className={[
                        "rounded-xl border px-3 py-2.5 text-sm leading-relaxed ring-1",
                        m.role === "user"
                          ? "border-cyan-400/15 bg-cyan-500/10 text-cyan-50 ring-cyan-300/10"
                          : "border-white/[0.08] bg-white/[0.04] text-white/85 ring-white/5",
                      ].join(" ")}
                    >
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        {m.role === "user" ? "משתמש" : m.role === "assistant" ? "Singularity" : "מערכת"}
                      </span>
                      {m.content}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
              {lastAssistant ? (
                <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] leading-snug text-white/45">
                  מצב פני שטח אחרון: פרויקט {surfaces.project ? "פעיל" : "כבוי"} · חשבונית {surfaces.invoice ? "פעילה" : "כבויה"}
                </p>
              ) : null}
            </div>
          </div>

          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-dashed border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent" />
            <div className="relative flex min-h-[min(52vh,32rem)] flex-col gap-5 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">משטח רכיבים חיים</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-white/45">
                  <span className="rounded-full bg-black/30 px-2 py-1 ring-1 ring-white/10">גרירה מהכותרת</span>
                  <span className="rounded-full bg-black/30 px-2 py-1 ring-1 ring-white/10">סגירה מהירה</span>
                </div>
              </div>

              <div className="relative flex flex-1 flex-wrap content-start items-start justify-center gap-5 sm:gap-7">
                <AnimatePresence>
                  {visibleProject ? (
                    <AdaptiveWidgetShell
                      key="project"
                      title="כרטיס פרויקט"
                      subtitle="מגדל המים · תל אביב"
                      badge="Live"
                      initialOffset={{ x: -6, y: 0 }}
                      onDismiss={() => setProjectDismissed(true)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-sky-500/10 ring-1 ring-cyan-300/25">
                            <Building2 className="h-5 w-5 text-cyan-100" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">שיקום תשתיות קומות 12–18</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-white/55">
                              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              רחוב הירקון 21 · שלב ביצוע פעיל
                            </p>
                          </div>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-white/[0.04] px-2.5 py-2 ring-1 ring-white/10">
                            <dt className="text-white/45">התקדמות</dt>
                            <dd className="mt-1 text-sm font-semibold text-emerald-200/95">68%</dd>
                          </div>
                          <div className="rounded-xl bg-white/[0.04] px-2.5 py-2 ring-1 ring-white/10">
                            <dt className="text-white/45">סטטוס סיכון</dt>
                            <dd className="mt-1 text-sm font-semibold text-amber-200/95">בינוני</dd>
                          </div>
                          <div className="col-span-2 rounded-xl bg-white/[0.04] px-2.5 py-2 ring-1 ring-white/10">
                            <dt className="flex items-center gap-1 text-white/45">
                              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                              ציר זמן קרוב
                            </dt>
                            <dd className="mt-1 text-sm text-white/80">יום שלישי — אספקת פלדה · חמישי — ביקורת בטיחות</dd>
                          </div>
                        </dl>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
                          >
                            <Hammer className="h-3.5 w-3.5" aria-hidden />
                            פתיחת לוח שבועי
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-50 ring-1 ring-cyan-300/25 transition hover:bg-cyan-500/20"
                          >
                            <FileText className="h-3.5 w-3.5" aria-hidden />
                            דוח יומי
                          </button>
                        </div>
                      </div>
                    </AdaptiveWidgetShell>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence>
                  {visibleInvoice ? (
                    <AdaptiveWidgetShell
                      key="invoice"
                      title="חשבונית מהירה"
                      subtitle="טיוטה · לא שודרה לרשויות"
                      badge="Draft"
                      initialOffset={{ x: 8, y: 36 }}
                      onDismiss={() => setInvoiceDismissed(true)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-cyan-200" aria-hidden />
                            <span className="text-xs font-semibold text-white/85">לקוח: קבוצת אורון בע״מ</span>
                          </div>
                          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-100 ring-1 ring-amber-300/30">
                            ממתין לאישור
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <label className="block text-[11px] font-medium text-white/50" htmlFor="inv-desc">
                            תיאור שורה
                          </label>
                          <input
                            id="inv-desc"
                            defaultValue="התקנת מערכת איסוף קונסטרוקציה + ליווי שטח"
                            className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-[11px] text-white/45" htmlFor="inv-qty">
                                כמות
                              </label>
                              <input
                                id="inv-qty"
                                type="number"
                                defaultValue={120}
                                className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] text-white/45" htmlFor="inv-rate">
                                תעריף (₪)
                              </label>
                              <input
                                id="inv-rate"
                                type="number"
                                defaultValue={185}
                                className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 px-3 py-2 ring-1 ring-white/10">
                            <span className="text-xs text-white/55">סה״כ לפני מע״מ</span>
                            <span className="text-base font-semibold tracking-tight text-white">₪22,200</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-cyan-400/90 to-sky-500/90 px-3 py-2 text-xs font-bold text-zinc-950 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-100/40 transition hover:brightness-105"
                          >
                            שמירת טיוטה
                          </button>
                          <button
                            type="button"
                            className="inline-flex flex-1 items-center justify-center rounded-xl bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10"
                          >
                            שליחה ללקוח
                          </button>
                        </div>
                      </div>
                    </AdaptiveWidgetShell>
                  ) : null}
                </AnimatePresence>

                {!visibleProject && !visibleInvoice ? (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="max-w-md text-sm text-white/55">
                      הקנבס ריק מרכיבים. שלחו בקשה עם <span className="text-white/80">פרויקט</span>,{" "}
                      <span className="text-white/80">אתר</span> או <span className="text-white/80">חשבונית</span> — או כל ניסוח
                      כללי — והמערכת תצייר כאן את הרכיבים המתאימים.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      <Omnibar
        value={draft}
        onChange={setDraft}
        onSubmit={send}
        voiceActive={voice}
        onVoiceToggle={() => setVoice((v) => !v)}
        busy={busy}
        footnote="הקש Enter לשליחה, Shift+Enter לשורה חדשה. מצב קולי הוא הדגמת UI בלבד."
      />
    </div>
  );
}
