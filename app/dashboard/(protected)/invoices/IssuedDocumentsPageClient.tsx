"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ReceiptText,
  Settings2,
  Loader2,
} from "lucide-react";
import { getIssuedDocumentsAction } from "@/app/actions/get-issued-documents";
import { formatCurrencyILS } from "@/lib/ui-formatters";
import { BentoGrid, ProgressBar, Tile, TileHeader } from "@/components/ui/bento";
import {
  IssuedInvoicesWorkspace,
  type IssuedInvoice,
  type IssuedInvoiceUiStatus,
} from "@/components/invoices/IssuedInvoicesWorkspace";

type IssuedRow = {
  id: string;
  displayId: string;
  client: string;
  date: string;
  dateIso: string;
  dueDateIso?: string | null;
  statusKey: string;
  status: string;
  amount: string;
  total: number;
  vat: number;
  allocation: string;
  type: string;
  docType: string;
};

function deriveInvoiceUiStatus(d: IssuedRow): IssuedInvoiceUiStatus {
  if (d.statusKey === "CANCELLED") return "CANCELLED";
  if (d.statusKey === "PAID") return "PAID";
  if (d.statusKey === "PENDING") {
    if (d.dueDateIso) {
      const due = new Date(d.dueDateIso);
      if (!Number.isNaN(due.getTime()) && due < new Date()) return "OVERDUE";
    }
    return "PENDING";
  }
  return "PENDING";
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function IssuedDocumentsPageClient() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [documents, setDocuments] = useState<IssuedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await getIssuedDocumentsAction();
        if (res.success && res.documents) {
          setDocuments(res.documents as IssuedRow[]);
        }
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const issuedWorkspace = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    let totalBilledThisMonth = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    for (const d of documents) {
      const docDate = new Date(d.dateIso);
      if (d.statusKey !== "CANCELLED" && docDate >= thisMonthStart) {
        totalBilledThisMonth += d.total;
      }
      if (d.statusKey === "CANCELLED" || d.statusKey === "PAID") continue;
      if (d.statusKey === "PENDING") {
        const due = d.dueDateIso ? new Date(d.dueDateIso) : null;
        if (due && !Number.isNaN(due.getTime()) && due < now) overdueAmount += d.total;
        else pendingAmount += d.total;
      }
    }
    const recentInvoices: IssuedInvoice[] = documents.slice(0, 12).map((d) => ({
      id: d.id,
      invoiceNumber: d.displayId.replace(/^INV-/, ""),
      clientName: d.client,
      issueDate: d.dateIso,
      amount: d.total,
      currency: "ILS",
      status: deriveInvoiceUiStatus(d),
    }));
    return { totalBilledThisMonth, pendingAmount, overdueAmount, recentInvoices };
  }, [documents]);

  const metrics = useMemo(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = startOfMonth(now);

    let monthTotal = 0;
    let prevMonthTotal = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let vatPending = 0;

    for (const d of documents) {
      const t = new Date(d.dateIso);
      if (t >= thisMonthStart) monthTotal += d.total;
      if (t >= prevMonth && t < thisMonthStart) prevMonthTotal += d.total;
      if (d.statusKey === "PENDING") {
        pendingCount += 1;
        vatPending += d.vat;
      }
      if (d.statusKey === "PAID") paidCount += 1;
    }

    const trendPct =
      prevMonthTotal > 0 ? Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100) : monthTotal > 0 ? 100 : 0;

    const paidRatio = documents.length > 0 ? Math.round((paidCount / documents.length) * 100) : 0;

    return {
      monthTotal,
      prevMonthTotal,
      trendPct,
      trendUp: trendPct >= 0,
      pendingCount,
      paidRatio,
      vatPending,
      allocCount: documents.filter((d) => d.allocation !== "-").length,
    };
  }, [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (d) =>
        d.displayId.toLowerCase().includes(q) ||
        d.client.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q),
    );
  }, [documents, query]);

  const listForTab = activeTab === "invoices" ? filtered : [];

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <IssuedInvoicesWorkspace
        totalBilledThisMonth={issuedWorkspace.totalBilledThisMonth}
        pendingAmount={issuedWorkspace.pendingAmount}
        overdueAmount={issuedWorkspace.overdueAmount}
        recentInvoices={issuedWorkspace.recentInvoices}
      />

      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-gray-100 pb-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2.5 text-sm font-bold text-[color:var(--ink-700)] shadow-[var(--shadow-xs)] transition hover:bg-[color:var(--canvas-sunken)]"
        >
          <Download size={18} />
          <span>ייצוא דוחות</span>
        </button>
        <Link
          href="/app/documents/issue"
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--axis-clients)] px-6 py-2.5 text-sm font-black text-white shadow-[var(--shadow-sm)] transition hover:bg-[color:var(--axis-clients-strong)]"
        >
          <Plus size={18} />
          <span>מסמך חדש</span>
        </Link>
      </div>

      <BentoGrid>
        <Tile tone="finance" span={3}>
          <TileHeader eyebrow="החודש" />
          <div className="mt-2 flex items-start justify-between gap-2">
            <p className="text-2xl font-black tabular-nums text-[color:var(--axis-finance-ink)]">
              {documents.length === 0 ? "—" : formatCurrencyILS(metrics.monthTotal)}
            </p>
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black ${
                documents.length === 0
                  ? "bg-[color:var(--canvas-sunken)] text-[color:var(--ink-500)]"
                  : metrics.trendUp
                    ? "bg-[color:var(--state-success-soft)] text-[color:var(--state-success)]"
                    : "bg-[color:var(--state-warning-soft)] text-[color:var(--state-warning)]"
              }`}
            >
              {documents.length === 0 ? (
                "—"
              ) : metrics.prevMonthTotal > 0 ? (
                <>
                  {metrics.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {metrics.trendPct > 0 ? "+" : ""}
                  {metrics.trendPct}%
                </>
              ) : (
                "חודש ראשון"
              )}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-[color:var(--ink-500)]">סה״כ מסמכים בתקופה הנוכחית</p>
        </Tile>

        <Tile tone="rose" span={3}>
          <TileHeader eyebrow="ממתינים" />
          <p className="mt-2 text-2xl font-black tabular-nums text-[color:var(--ink-900)]">{metrics.pendingCount}</p>
          <p className="mt-2 text-[11px] font-bold text-[color:var(--ink-500)]">מסמכים ללא סימון שולם</p>
          <div className="mt-3">
            <ProgressBar
              value={documents.length ? Math.round((metrics.pendingCount / documents.length) * 100) : 0}
              axis="warning"
            />
          </div>
        </Tile>

        <Tile tone="clients" span={3}>
          <TileHeader eyebrow="שיעור שילום" />
          <div className="mt-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[color:var(--axis-clients)]" />
            <p className="text-2xl font-black tabular-nums text-[color:var(--ink-900)]">{documents.length ? `${metrics.paidRatio}%` : "—"}</p>
          </div>
          <p className="mt-2 text-[11px] font-bold text-[color:var(--ink-500)]">לפי מסמכים במערכת (מצטבר)</p>
        </Tile>

        <Tile tone="neutral" span={3}>
          <TileHeader eyebrow="מע״מ תשומות (ממתין)" />
          <p className="mt-2 text-2xl font-black tabular-nums text-[color:var(--ink-900)]">
            {metrics.vatPending > 0 ? formatCurrencyILS(metrics.vatPending) : "—"}
          </p>
          <p className="mt-2 text-[11px] font-bold text-[color:var(--ink-500)]">הערכה מסכומי מע״מ במסמכים פתוחים</p>
        </Tile>
      </BentoGrid>

      <div className="tile overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:var(--canvas-raised)] shadow-[var(--shadow-xs)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[color:var(--axis-clients-strong)] to-[#0f172a] p-6 text-white sm:p-8">
          <div className="absolute end-0 top-0 h-48 w-48 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl text-start">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                רגולציה 2026
              </div>
              <h2 className="text-2xl font-black sm:text-3xl">דיווח והקצאות — מעקב אחרי הסטטוס</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-teal-100/90">
                מסמכים עם הקצאה: {metrics.allocCount} מתוך {documents.length}. השלימו חיבור והגדרות במסך ההגדרות לפי הצורך.
              </p>
            </div>
            <Link
              href="/app/settings"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-teal-950 shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Settings2 size={18} />
              <span>הגדרות ארגון</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 border-b border-[color:var(--line)] px-4 sm:px-8">
          {(
            [
              { id: "invoices", label: "חשבוניות", count: documents.length },
              { id: "proforma", label: "חשבון עסקה", count: 0 },
              { id: "allocations", label: "הקצאות", count: metrics.allocCount },
              { id: "clients", label: "לקוחות", count: new Set(documents.map((d) => d.client)).size },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-4 text-sm font-black transition ${
                activeTab === tab.id ? "text-[color:var(--axis-clients)]" : "text-[color:var(--ink-400)] hover:text-[color:var(--ink-700)]"
              }`}
            >
              {tab.label}
              <span className="ms-2 rounded-md border border-[color:var(--line)] bg-[color:var(--canvas-sunken)] px-1.5 py-0.5 text-[10px] text-[color:var(--ink-500)]">
                {tab.count}
              </span>
              {activeTab === tab.id ? (
                <div className="absolute bottom-0 start-0 end-0 h-1 rounded-full bg-[color:var(--axis-clients)]" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 bg-[color:var(--canvas-sunken)]/40 p-4 sm:flex-row sm:items-center sm:px-8">
          <div className="relative w-full flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-400)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="חיפוש לפי מספר, לקוח או סוג..."
              className="w-full rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] py-3 pe-10 ps-4 text-sm outline-none transition focus:border-[color:var(--axis-clients)]"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-3 text-sm font-bold text-[color:var(--ink-600)]"
          >
            <Filter size={18} />
            סינון
          </button>
        </div>

        <div className="min-h-[280px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-[color:var(--ink-500)]">
              <Loader2 className="h-8 w-8 animate-spin text-[color:var(--axis-clients)]" />
              <p className="text-sm font-bold">טוען מסמכים…</p>
            </div>
          ) : activeTab !== "invoices" ? (
            <div className="p-10 text-center text-sm font-semibold text-[color:var(--ink-500)]">בקרוב: תוכן מפורט ללשונית זו.</div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--canvas-sunken)]">
                <ReceiptText className="h-8 w-8 text-[color:var(--ink-300)]" />
              </div>
              <p className="font-black text-[color:var(--ink-900)]">אין מסמכים עדיין</p>
              <p className="max-w-sm text-sm text-[color:var(--ink-500)]">התחילו מהנפקה או סנכרון מסמכים כדי לראות נתונים כאן.</p>
              <Link href="/app/documents/issue" className="mt-2 text-sm font-black text-[color:var(--axis-clients)] hover:underline">
                הפק מסמך ראשון
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-start">
                  <thead className="border-b border-[color:var(--line)] bg-[color:var(--canvas-sunken)]/60">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[color:var(--ink-400)] sm:px-6">
                        מספר / סוג
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[color:var(--ink-400)] sm:px-6">
                        לקוח
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[color:var(--ink-400)] sm:px-6">
                        תאריך
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[color:var(--ink-400)] sm:px-6">
                        סטטוס
                      </th>
                      <th className="px-4 py-3 text-end text-[10px] font-black uppercase tracking-wider text-[color:var(--ink-400)] sm:px-6">
                        סכום
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--line)]">
                    {listForTab.map((row) => (
                      <tr key={row.id} className="group hover:bg-[color:var(--canvas-sunken)]/50">
                        <td className="px-4 py-4 sm:px-6">
                          <span className="text-sm font-black text-[color:var(--ink-900)]">{row.displayId}</span>
                          <span className="mt-0.5 block text-[10px] font-bold uppercase text-[color:var(--ink-400)]">{row.type}</span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-[color:var(--ink-800)] sm:px-6">{row.client}</td>
                        <td className="px-4 py-4 text-sm text-[color:var(--ink-500)] sm:px-6">{row.date}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                row.statusKey === "PAID" ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            <span className="text-xs font-black">{row.status}</span>
                            {row.allocation !== "-" ? (
                              <span className="rounded bg-[color:var(--canvas-sunken)] px-1.5 py-0.5 font-mono text-[9px] text-[color:var(--ink-500)]">
                                #{row.allocation}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-end text-sm font-black tabular-nums text-[color:var(--ink-900)] sm:px-6">{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {listForTab.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--canvas-raised)] p-4 shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-[color:var(--ink-900)]">{row.displayId}</p>
                        <p className="text-[11px] text-[color:var(--ink-500)]">{row.client}</p>
                      </div>
                      <p className="text-sm font-black tabular-nums text-[color:var(--ink-900)]">{row.amount}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[color:var(--ink-500)]">
                      <span>{row.date}</span>
                      <span>·</span>
                      <span>{row.status}</span>
                      {row.allocation !== "-" ? <span className="font-mono">#{row.allocation}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
