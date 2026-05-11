export const DOC_TYPE_LABEL: Record<string, string> = {
  INVOICE: "חשבונית מס",
  RECEIPT: "קבלה",
  INVOICE_RECEIPT: "חשבונית מס/קבלה",
  CREDIT_NOTE: "זיכוי",
};

export const DOC_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "ממתין לתשלום", cls: "bg-amber-100 text-amber-800" },
  PAID: { label: "שולם", cls: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "מבוטל", cls: "bg-slate-100 text-slate-500" },
};

export const STATUS_COLUMNS = [
  { key: "LEAD", label: "ליד חדש", bg: "bg-sky-500", text: "text-white", border: "border-sky-600", dot: "bg-sky-200" },
  { key: "ACTIVE", label: "בתהליך", bg: "bg-blue-600", text: "text-white", border: "border-blue-700", dot: "bg-blue-200" },
  { key: "PROPOSAL", label: "הצעת מחיר", bg: "bg-amber-500", text: "text-white", border: "border-amber-600", dot: "bg-amber-200" },
  { key: "CLOSED_WON", label: "נסגר בהצלחה", bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", dot: "bg-emerald-200" },
  { key: "CLOSED_LOST", label: "לא רלוונטי", bg: "bg-rose-500", text: "text-white", border: "border-rose-600", dot: "bg-rose-200" },
] as const;

export const AVATAR_COLORS = [
  "#2563EB",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

export const crmInputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 transition-all";
