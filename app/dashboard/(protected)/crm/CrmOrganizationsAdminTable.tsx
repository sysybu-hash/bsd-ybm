"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Sparkles,
  Trash2,
  Edit3,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Percent,
  Zap,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import {
  analyzeClientAI,
  deleteOrganization,
  updateOrgPlan,
  updateOrganizationName,
  type ClientAiResult,
  type ClientAiTableRow,
} from "./actions";

export type CrmAdminOrganizationRow = {
  id: string;
  name: string;
  plan: string;
  users: { email: string }[];
  /** סכום כל החשבוניות (Invoice) בארגון — מחושב בשרת */
  invoiceTotalAmount: number;
};

type AiModalState =
  | null
  | {
      orgId: string;
      orgName: string;
      loading?: boolean;
      error?: string;
      data?: Extract<ClientAiResult, { ok: true }>;
    };

function formatMoney(n: number) {
  return `₪${n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function payPlusTableTotals(rows: ClientAiTableRow[]) {
  return rows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.amountGross,
      fee: acc.fee + r.feePayPlus,
      net: acc.net + r.net,
    }),
    { gross: 0, fee: 0, net: 0 },
  );
}

export default function CrmOrganizationsAdminTable({
  organizations,
  showUnifiedBillingLinks = false,
}: {
  organizations: CrmAdminOrganizationRow[];
  showUnifiedBillingLinks?: boolean;
}) {
  const { dir } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [aiModal, setAiModal] = useState<AiModalState>(null);

  const handleAnalyze = async (org: CrmAdminOrganizationRow) => {
    setLoadingId(org.id);
    setAiModal({
      orgId: org.id,
      orgName: org.name,
      loading: true,
    });
    try {
      const result = await analyzeClientAI(org.id);
      if (!result.ok) {
        setAiModal({
          orgId: org.id,
          orgName: org.name,
          error: result.error,
        });
      } else {
        setAiModal({
          orgId: org.id,
          orgName: org.name,
          data: result,
        });
      }
    } catch {
      setAiModal({
        orgId: org.id,
        orgName: org.name,
        error: "שגיאה בטעינת הניתוח",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (
      !confirm("האם אתה בטוח שברצונך למחוק את הלקוח? כל הנתונים יימחקו לצמיתות.")
    ) {
      return;
    }
    startTransition(async () => {
      const r = await deleteOrganization(id);
      if ("error" in r && r.error) {
        window.alert(r.error);
        return;
      }
      router.refresh();
    });
  };

  const handleEdit = (org: CrmAdminOrganizationRow) => {
    const next = window.prompt("שם ארגון / לקוח:", org.name);
    if (next === null) return;
    startTransition(async () => {
      const r = await updateOrganizationName(org.id, next);
      if ("error" in r && r.error) {
        window.alert(r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="card-avenue relative overflow-hidden" dir={dir}>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-start">
        <thead className="bg-indigo-50/90 text-xs font-bold text-indigo-900">
          <tr>
            <th className="px-6 py-4 sm:px-8">שם הלקוח</th>
            <th className="px-6 py-4 sm:px-8">תוכנית</th>
            <th className="px-6 py-4 sm:px-8">סה״כ חשבוניות</th>
            <th className="px-6 py-4 text-center sm:px-8">Intelligence</th>
            <th className="px-6 py-4 sm:px-8">ניהול</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {organizations.length === 0 && (
            <tr>
              <td colSpan={5} className="px-8 py-16 text-center">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                  <Sparkles className="text-gray-200" size={36} strokeWidth={1.25} aria-hidden />
                  <p className="font-bold text-gray-600">אין ארגונים להצגה</p>
                  <p className="text-sm text-gray-400">הטבלה תתמלא כשייווצרו לקוחות במערכת.</p>
                </div>
              </td>
            </tr>
          )}
          {organizations.map((org) => (
            <tr key={org.id} className="hover:bg-gray-50/80 transition-all group">
              <td className="px-8 py-6">
                <div className="font-bold text-gray-900">
                  {org.name || "ארגון ללא שם"}
                </div>
                <div className="text-xs text-gray-400">
                  {org.users[0]?.email || "—"}
                </div>
              </td>
              <td className="px-8 py-6">
                <select
                  defaultValue={org.plan || "FREE"}
                  disabled={pending}
                  onChange={(e) => {
                    startTransition(async () => {
                      await updateOrgPlan(org.id, e.target.value);
                      router.refresh();
                    });
                  }}
                  className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black border-none outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer transition-all disabled:opacity-50"
                >
                  <option value="FREE">FREE — חינם</option>
                  <option value="HOUSEHOLD">HOUSEHOLD</option>
                  <option value="DEALER">DEALER</option>
                  <option value="COMPANY">COMPANY</option>
                  <option value="CORPORATE">CORPORATE</option>
                </select>
              </td>
              <td className="px-8 py-6 font-black text-gray-900">
                ₪{org.invoiceTotalAmount.toLocaleString("he-IL", { maximumFractionDigits: 2 })}
              </td>
              <td className="px-8 py-6 text-center">
                <button
                  type="button"
                  onClick={() => void handleAnalyze(org)}
                  disabled={loadingId === org.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[11px] font-black text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loadingId === org.id ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  סיכום AI
                </button>
              </td>
              <td className="px-8 py-6">
                <div className="flex flex-wrap items-center gap-3">
                  {showUnifiedBillingLinks ? (
                    <Link
                      href={`/dashboard/billing?tab=control&orgId=${encodeURIComponent(org.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200/90 bg-indigo-50/90 px-3 py-1.5 text-sm font-bold text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100"
                    >
                      <CreditCard size={16} />
                      מנוי
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    title="עריכת שם ארגון"
                    aria-label={`עריכת ${org.name}`}
                    disabled={pending}
                    onClick={() => handleEdit(org)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 px-2 py-1.5 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                  >
                    <Edit3 size={16} />
                    ערוך
                  </button>
                  <button
                    type="button"
                    title="מחיקת ארגון"
                    aria-label={`מחיקת ${org.name}`}
                    disabled={pending}
                    onClick={() => handleDelete(org.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50 px-2 py-1.5 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100"
                  >
                    <Trash2 size={16} />
                    מחק
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {aiModal ? (
        <div className="fixed inset-0 bg-gray-200/70 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-900/15"
            dir={dir}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-ai-modal-title"
          >
            <div className="h-1 w-full shrink-0 bg-gradient-to-l from-indigo-600 to-indigo-500" />
            <button
              type="button"
              onClick={() => setAiModal(null)}
              className="absolute end-4 top-5 z-10 rounded-xl p-2.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800"
              aria-label="סגור"
            >
              <X size={22} />
            </button>

            <div className="px-8 pt-8 pb-5 border-b border-gray-100 shrink-0 bg-gradient-to-b from-gray-50/80 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-indigo-600 p-3.5 text-white shadow-lg shadow-indigo-600/25">
                    <Sparkles size={26} strokeWidth={2} aria-hidden />
                  </div>
                  <div>
                    <h3
                      id="crm-ai-modal-title"
                      className="text-2xl font-black text-gray-900 tracking-tight"
                    >
                      ניתוח לקוח חכם
                    </h3>
                    <p className="text-sm text-gray-600 font-semibold mt-0.5">
                      {aiModal.orgName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1.5 border border-emerald-200/80">
                    <Zap size={14} className="shrink-0" />
                    Gemini 2.5 Flash
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 border border-gray-200">
                    <Percent size={14} />
                    PayPlus: 1.2% + ‎₪1.20
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
              {aiModal.loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
                  <Loader2 className="animate-spin text-indigo-600" size={44} />
                  <p className="font-bold text-gray-600">מנתח עם Gemini 2.5 Flash…</p>
                </div>
              ) : aiModal.error ? (
                <div
                  className="rounded-2xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-rose-950 text-sm flex items-start gap-3"
                  role="alert"
                >
                  <AlertTriangle className="shrink-0 text-rose-600 mt-0.5" size={22} />
                  <span className="leading-relaxed font-medium">{aiModal.error}</span>
                </div>
              ) : aiModal.data ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <section className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm ring-1 ring-gray-100/80">
                      <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wide mb-3">
                        <TrendingUp size={18} strokeWidth={2.25} />
                        סיכום
                      </div>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {aiModal.data.summary}
                      </p>
                    </section>

                    <section className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-indigo-800 font-black text-xs uppercase tracking-wide mb-3">
                        <AlertTriangle size={18} strokeWidth={2.25} />
                        התראות
                      </div>
                      {aiModal.data.alerts.length === 0 ? (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                          אין התראות פעילות
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {aiModal.data.alerts.map((a, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-sm text-indigo-900 leading-snug"
                            >
                              <AlertTriangle
                                className="shrink-0 text-indigo-600 mt-0.5"
                                size={16}
                              />
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/35 p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wide mb-3">
                        <CheckCircle size={18} strokeWidth={2.25} />
                        המלצה
                      </div>
                      <p className="text-gray-800 leading-relaxed text-sm font-medium">
                        {aiModal.data.recommendation}
                      </p>
                    </section>
                  </div>

                  <section className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                        <Receipt className="text-indigo-600" size={22} />
                        תשלומים ועמלות PayPlus
                      </h4>
                      <p className="text-xs text-gray-600 font-semibold bg-white px-3 py-2 rounded-xl border border-gray-200 inline-flex items-center gap-2">
                        <Percent size={14} className="text-indigo-600" />
                        לכל עסקה: ‎1.2% × ברוטו + ‎₪1.20 — הנטו מחושב בשרת
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden overflow-x-auto shadow-inner">
                      <table className="w-full text-sm text-right min-w-[560px]">
                        <thead>
                          <tr className="bg-indigo-50 text-[11px] font-black uppercase tracking-wider text-indigo-900">
                            <th className="px-4 py-3.5 font-semibold">תאריך</th>
                            <th className="px-4 py-3.5 font-semibold">תיאור</th>
                            <th className="px-4 py-3.5 font-semibold">ברוטו</th>
                            <th className="px-4 py-3.5 font-semibold">עמלה</th>
                            <th className="px-4 py-3.5 font-semibold">נטו</th>
                            <th className="px-4 py-3.5 font-semibold">סטטוס</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {aiModal.data.tableData.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-10 text-center text-gray-500 font-medium"
                              >
                                אין חשבוניות להצגה
                              </td>
                            </tr>
                          ) : (
                            aiModal.data.tableData.map((row: ClientAiTableRow) => (
                              <tr
                                key={row.id}
                                className="hover:bg-gray-50/90 transition-colors"
                              >
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-[13px]">
                                  {row.date}
                                </td>
                                <td className="px-4 py-3 text-gray-800 max-w-[220px] truncate text-[13px] font-medium">
                                  {row.label}
                                </td>
                                <td className="px-4 py-3 font-semibold tabular-nums text-gray-900">
                                  {formatMoney(row.amountGross)}
                                </td>
                                <td className="px-4 py-3 tabular-nums text-indigo-700 font-semibold">
                                  {formatMoney(row.feePayPlus)}
                                </td>
                                <td className="px-4 py-3 font-bold tabular-nums text-emerald-700">
                                  {formatMoney(row.net)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[10px] font-black bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200/80">
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {aiModal.data.tableData.length > 0 ? (
                          <tfoot>
                            <tr className="bg-gray-100/90 border-t-2 border-gray-300">
                              <td
                                colSpan={2}
                                className="px-4 py-3.5 text-sm font-black text-gray-800"
                              >
                                סה״כ ({aiModal.data.tableData.length} עסקאות)
                              </td>
                              <td className="px-4 py-3.5 text-sm font-black tabular-nums text-gray-900">
                                {formatMoney(
                                  payPlusTableTotals(aiModal.data.tableData).gross,
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-sm font-black tabular-nums text-indigo-700">
                                {formatMoney(
                                  payPlusTableTotals(aiModal.data.tableData).fee,
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-sm font-black tabular-nums text-emerald-800">
                                {formatMoney(
                                  payPlusTableTotals(aiModal.data.tableData).net,
                                )}
                              </td>
                              <td className="px-4 py-3.5" />
                            </tr>
                          </tfoot>
                        ) : null}
                      </table>
                    </div>
                  </section>
                </>
              ) : null}
            </div>

            <div className="px-8 pb-8 pt-2 shrink-0 border-t border-gray-100 bg-gray-50/40">
              <button type="button" onClick={() => setAiModal(null)} className="btn-primary w-full py-3.5">
                סגור
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
