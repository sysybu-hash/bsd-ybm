"use client";

import { startTransition, useDeferredValue, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Filter,
  LayoutGrid,
  ListFilter,
  Loader2,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";

type BillingDocumentRecord = {
  id: string;
  number: number;
  type: string;
  clientName: string;
  total: number;
  status: string;
  date: string;
  dueDate: string | null;
  contactId: string | null;
};

type Props = Readonly<{
  documents: BillingDocumentRecord[];
}>;

const statusMeta = {
  PENDING: { label: "ממתין לתשלום", className: "bg-amber-100 text-amber-700" },
  PAID: { label: "שולם", className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "בוטל", className: "bg-slate-200 text-slate-600" },
} as const;

const typeMeta = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס/קבלה",
  CREDIT_NOTE: "זיכוי",
} as const;

function daysUntil(dateValue: string | null) {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function DocumentCard({ document }: { document: BillingDocumentRecord }) {
  const badge = statusMeta[document.status as keyof typeof statusMeta] ?? {
    label: document.status,
    className: "bg-slate-100 text-slate-700",
  };
  const dueInDays = daysUntil(document.dueDate);

  return (
    <article className="v2-panel overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[color:var(--v2-ink)]">
            {typeMeta[document.type as keyof typeof typeMeta] ?? document.type} #{document.number}
          </p>
          <p className="mt-2 text-lg font-black text-[color:var(--v2-ink)]">{document.clientName}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${badge.className}`}>{badge.label}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">סכום כולל</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{formatCurrencyILS(document.total)}</p>
        </div>
        <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-3">
          <p className="text-xs font-bold text-[color:var(--v2-muted)]">תאריך</p>
          <p className="mt-2 text-base font-black text-[color:var(--v2-ink)]">{formatShortDate(document.date)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--v2-line)] bg-white/76 px-4 py-3">
        <p className="text-xs font-bold text-[color:var(--v2-muted)]">סטטוס גבייה</p>
        <p className="mt-2 text-sm font-semibold text-[color:var(--v2-ink)]">
          {document.status === "PAID"
            ? "המסמך שולם ומסומן כסגור."
            : dueInDays == null
              ? "אין תאריך יעד מוגדר."
              : dueInDays < 0
                ? `עברו ${Math.abs(dueInDays)} ימים ממועד התשלום.`
                : dueInDays === 0
                  ? "מועד התשלום הוא היום."
                  : `נותרו ${dueInDays} ימים עד מועד התשלום.`}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href="/app/documents/erp" className="v2-button v2-button-primary">
          ניהול מלא ב-ERP
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href={
            document.contactId
              ? `/app/documents/issue?client=${encodeURIComponent(document.clientName)}&contactId=${document.contactId}`
              : "/app/documents/issue"
          }
          className="v2-button v2-button-secondary"
        >
          שכפול / הפקת מסמך
          <ReceiptText className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export default function BillingWorkspaceV2({ documents }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [view, setView] = useState<"overview" | "collections">("overview");
  const [isPending, startFilterTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredDocuments = documents.filter((document) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      document.clientName.toLowerCase().includes(normalizedSearch) ||
      document.number.toString().includes(normalizedSearch);
    const matchesStatus = statusFilter === "ALL" || document.status === statusFilter;
    const matchesType = typeFilter === "ALL" || document.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalAmount = filteredDocuments.reduce((sum, document) => sum + document.total, 0);
  const paidAmount = filteredDocuments
    .filter((document) => document.status === "PAID")
    .reduce((sum, document) => sum + document.total, 0);
  const pendingAmount = filteredDocuments
    .filter((document) => document.status === "PENDING")
    .reduce((sum, document) => sum + document.total, 0);
  const overdueDocuments = filteredDocuments.filter(
    (document) => document.status === "PENDING" && (daysUntil(document.dueDate) ?? 1) < 0,
  );
  const dueSoonDocuments = filteredDocuments.filter((document) => {
    const days = daysUntil(document.dueDate);
    return document.status === "PENDING" && days != null && days >= 0 && days <= 7;
  });

  return (
    <div className="grid gap-6" dir="rtl">
      <section className="v2-panel v2-panel-soft overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="v2-eyebrow">Billing Workspace</span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[color:var(--v2-ink)] sm:text-5xl">
              חלון חיוב רגוע, ברור ומדויק שמרכז תזרים, גבייה ומסמכים פיננסיים.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--v2-muted)] sm:text-lg">
              רואים קודם מה פתוח, מה דורש גבייה, ומה כבר נסגר. כל המידע הפיננסי החשוב נגיש בלי עומס מיותר ובלי
              מעבר מתיש בין מסכים.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/app/documents/erp" className="v2-button v2-button-primary">
                פתיחת ERP מלא
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/app/documents/issue" className="v2-button v2-button-secondary">
                הפקת מסמך חדש
                <Sparkles className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "מסמכים מסוננים", value: filteredDocuments.length.toString(), icon: ReceiptText },
              { label: "מחזור בתצוגה", value: formatCurrencyILS(totalAmount), icon: CircleDollarSign },
              { label: "שולם", value: formatCurrencyILS(paidAmount), icon: CheckCircle2 },
              { label: "ממתין לתשלום", value: formatCurrencyILS(pendingAmount), icon: CreditCard },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="v2-panel p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-soft)] text-[color:var(--v2-accent)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-bold text-[color:var(--v2-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--v2-ink)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          <div className="v2-panel p-5">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_auto]">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">חיפוש</span>
                <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3">
                  <Filter className="h-4 w-4 text-[color:var(--v2-muted)]" aria-hidden />
                  <input
                    value={search}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      startFilterTransition(() => setSearch(nextValue));
                    }}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--v2-muted)]"
                    placeholder="חיפוש לפי לקוח או מספר מסמך"
                  />
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[color:var(--v2-accent)]" aria-hidden /> : null}
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">סטטוס</span>
                <select
                  value={statusFilter}
                  onChange={(event) => startFilterTransition(() => setStatusFilter(event.target.value))}
                  className="rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                >
                  <option value="ALL">כל הסטטוסים</option>
                  <option value="PENDING">ממתין לתשלום</option>
                  <option value="PAID">שולם</option>
                  <option value="CANCELLED">בוטל</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">סוג מסמך</span>
                <select
                  value={typeFilter}
                  onChange={(event) => startFilterTransition(() => setTypeFilter(event.target.value))}
                  className="rounded-2xl border border-[color:var(--v2-line)] bg-white/86 px-4 py-3 text-sm font-semibold text-[color:var(--v2-ink)] outline-none"
                >
                  <option value="ALL">כל הסוגים</option>
                  {Object.entries(typeMeta).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--v2-muted)]">תצוגה</span>
                <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--v2-canvas)] p-1">
                  <button
                    type="button"
                    onClick={() => startTransition(() => setView("overview"))}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      view === "overview" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                    סקירה
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(() => setView("collections"))}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      view === "collections" ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"
                    }`}
                  >
                    <ListFilter className="h-4 w-4" aria-hidden />
                    גבייה
                  </button>
                </div>
              </div>
            </div>
          </div>

          {view === "overview" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredDocuments.length === 0 ? (
                <div className="v2-panel col-span-full p-8 text-center">
                  <p className="text-2xl font-black text-[color:var(--v2-ink)]">אין מסמכים שמתאימים לסינון הנוכחי.</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--v2-muted)]">
                    אפשר לשנות את הסינון או להפיק מסמך חדש מתוך ה-ERP.
                  </p>
                </div>
              ) : null}
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="v2-panel p-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                  <h2 className="text-xl font-black text-[color:var(--v2-ink)]">באיחור</h2>
                </div>
                <div className="mt-4 grid gap-3">
                  {overdueDocuments.length === 0 ? (
                    <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                      אין כרגע מסמכים באיחור בתצוגה המסוננת.
                    </div>
                  ) : null}
                  {overdueDocuments.map((document) => (
                    <div key={document.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                      <p className="font-black text-[color:var(--v2-ink)]">{document.clientName}</p>
                      <p className="mt-2 text-sm text-[color:var(--v2-muted)]">{formatCurrencyILS(document.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="v2-panel p-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[color:var(--v2-accent)]" aria-hidden />
                  <h2 className="text-xl font-black text-[color:var(--v2-ink)]">יעד תשלום קרוב</h2>
                </div>
                <div className="mt-4 grid gap-3">
                  {dueSoonDocuments.length === 0 ? (
                    <div className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4 text-sm text-[color:var(--v2-muted)]">
                      אין כרגע מסמכים שמועד התשלום שלהם קרוב.
                    </div>
                  ) : null}
                  {dueSoonDocuments.map((document) => (
                    <div key={document.id} className="rounded-2xl bg-[color:var(--v2-canvas)] px-4 py-4">
                      <p className="font-black text-[color:var(--v2-ink)]">{document.clientName}</p>
                      <p className="mt-2 text-sm text-[color:var(--v2-muted)]">
                        {document.dueDate ? formatShortDate(document.dueDate) : "ללא תאריך יעד"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
