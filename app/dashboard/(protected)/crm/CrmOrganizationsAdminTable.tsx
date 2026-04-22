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
import PortalToBody, { WORKSPACE_OVERLAY_Z_CLASS } from "@/components/portal/PortalToBody";
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
  industry: string;
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
        <thead className="bg-teal-500/[0.12] text-xs font-bold text-teal-300">
          <tr>
            <th className="px-6 py-4 sm:px-8">שם הלקוח</th>
            <th className="px-6 py-4 sm:px-8 text-center sm:px-8">תוכנית</th>
            <th className="px-6 py-4 sm:px-8 text-center sm:px-8">מקצוע / תחום</th>
            <th className="px-6 py-4 sm:px-8">סה״כ חשבוניות</th>
            <th className="px-6 py-4 text-center sm:px-8">Intelligence</th>
            <th className="px-6 py-4 sm:px-8">ניהול</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {organizations.length === 0 && (
            <tr>
              <td colSpan={5} className="px-8 py-16 text-center">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                  <Sparkles className="text-gray-300" size={36} strokeWidth={1.25} aria-hidden />
                  <p className="font-bold text-gray-500">אין ארגונים להצגה</p>
                  <p className="text-sm text-gray-400">הטבלה תתמלא כשייווצרו לקוחות במערכת.</p>
                </div>
              </td>
            </tr>
          )}
          {organizations.map((org) => (
            <tr key={org.id} className="hover:bg-white transition-all group">
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
                  className="bg-teal-500/15 text-teal-300 px-3 py-1.5 rounded-xl text-[10px] font-black border border-teal-500/25 outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer transition-all disabled:opacity-50"
                >
                  <option value="FREE">FREE — חינם</option>
                  <option value="HOUSEHOLD">HOUSEHOLD</option>
                  <option value="DEALER">DEALER</option>
                  <option value="COMPANY">COMPANY</option>
                  <option value="CORPORATE">CORPORATE</option>
                </select>
              </td>
              <td className="px-8 py-6 text-center">
                 <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600 border border-slate-200 uppercase tracking-widest">
                   {org.industry || "GENERAL"}
                 </span>
              </td>
              <td className="px-8 py-6 font-black text-gray-900">
                ₪{org.invoiceTotalAmount.toLocaleString("he-IL", { maximumFractionDigits: 2 })}
              </td>
              <td className="px-8 py-6 text-center">
                <button
                  type="button"
                  onClick={() => void handleAnalyze(org)}
                  disabled={loadingId === org.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-[11px] font-black text-white shadow-md shadow-teal-500/20 transition hover:bg-teal-400 disabled:opacity-50"
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
                      href={`/app/settings/billing?tab=control&orgId=${encodeURIComponent(org.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 text-sm font-bold text-teal-300 transition hover:border-teal-500/40 hover:bg-teal-500/20"
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
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-400 hover:text-teal-300 disabled:opacity-50 px-2 py-1.5 rounded-xl hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20"
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
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-400 hover:text-rose-300 disabled:opacity-50 px-2 py-1.5 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
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
        <PortalToBody>
        <div className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-center justify-center bg-black/60 p-4`}>
          <div
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/60"
            dir={dir}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-ai-modal-title"
          >
            <div className="h-1 w-full shrink-0 bg-gradient-to-l from-teal-500 to-teal-400" />
            <button
              type="button"
              onClick={() => setAiModal(null)}
              className="absolute end-4 top-5 z-10 rounded-xl p-2.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="סגור"
            >
              <X size={22} />
            </button>

            <div className="px-8 pt-8 pb-5 border-b border-gray-100 shrink-0 bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-teal-500 p-3.5 text-white shadow-lg shadow-teal-500/25">
                    <Sparkles size={26} strokeWidth={2} aria-hidden />
                  </div>
                  <div>
                    <h3
                      id="crm-ai-modal-title"
                      className="text-2xl font-black text-gray-900 tracking-tight"
                    >
                      ניתוח לקוח חכם
                    </h3>
                    <p className="text-sm text-gray-500 font-semibold mt-0.5">
                      {aiModal.orgName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-black px-3 py-1.5 border border-emerald-500/25">
                    <Zap size={14} className="shrink-0" />
                    Gemini 2.5 Flash
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 border border-gray-200">
                    <Percent size={14} />
                    PayPlus: 1.2% + ‎₪1.20
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
              {aiModal.loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                  <Loader2 className="animate-spin text-teal-400" size={44} />
                  <p className="font-bold text-gray-500">מנתח עם Gemini 2.5 Flash…</p>
                </div>
              ) : aiModal.error ? (
                <div
                  className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.08] px-5 py-4 text-rose-300 text-sm flex items-start gap-3"
                  role="alert"
                >
                  <AlertTriangle className="shrink-0 text-rose-400 mt-0.5" size={22} />
                  <span className="leading-relaxed font-medium">{aiModal.error}</span>
                </div>
              ) : aiModal.data ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                      <div className="flex items-center gap-2 text-emerald-300 font-black text-xs uppercase tracking-wide mb-3">
                        <TrendingUp size={18} strokeWidth={2.25} />
                        סיכום
                      </div>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {aiModal.data.summary}
                      </p>
                    </section>

                    <section className="rounded-2xl border border-teal-500/25 bg-teal-500/[0.07] p-5">
                      <div className="flex items-center gap-2 text-teal-300 font-black text-xs uppercase tracking-wide mb-3">
                        <AlertTriangle size={18} strokeWidth={2.25} />
                        התראות
                      </div>
                      {aiModal.data.alerts.length === 0 ? (
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                          <CheckCircle className="text-emerald-400 shrink-0" size={18} />
                          אין התראות פעילות
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {aiModal.data.alerts.map((a, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-sm text-gray-600 leading-snug"
                            >
                              <AlertTriangle
                                className="shrink-0 text-teal-400 mt-0.5"
                                size={16}
                              />
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-5">
                      <div className="flex items-center gap-2 text-emerald-300 font-black text-xs uppercase tracking-wide mb-3">
                        <CheckCircle size={18} strokeWidth={2.25} />
                        המלצה
                      </div>
                      <p className="text-gray-600 leading-relaxed text-sm font-medium">
                        {aiModal.data.recommendation}
                      </p>
                    </section>
                  </div>

                  <section className="rounded-2xl border border-gray-100 bg-white p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                        <Receipt className="text-teal-400" size={22} />
                        תשלומים ועמלות PayPlus
                      </h4>
                      <p className="text-xs text-gray-400 font-semibold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 inline-flex items-center gap-2">
                        <Percent size={14} className="text-teal-400" />
                        לכל עסקה: ‎1.2% × ברוטו + ‎₪1.20 — הנטו מחושב בשרת
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden overflow-x-auto">
                      <table className="w-full text-sm text-right min-w-[560px]">
                        <thead>
                          <tr className="bg-teal-500/[0.10] text-[11px] font-black uppercase tracking-wider text-teal-300">
                            <th className="px-4 py-3.5 font-semibold">תאריך</th>
                            <th className="px-4 py-3.5 font-semibold">תיאור</th>
                            <th className="px-4 py-3.5 font-semibold">ברוטו</th>
                            <th className="px-4 py-3.5 font-semibold">עמלה</th>
                            <th className="px-4 py-3.5 font-semibold">נטו</th>
                            <th className="px-4 py-3.5 font-semibold">סטטוס</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {aiModal.data.tableData.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-10 text-center text-gray-400 font-medium"
                              >
                                אין חשבוניות להצגה
                              </td>
                            </tr>
                          ) : (
                            aiModal.data.tableData.map((row: ClientAiTableRow) => (
                              <tr
                                key={row.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-[13px]">
                                  {row.date}
                                </td>
                                <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate text-[13px] font-medium">
                                  {row.label}
                                </td>
                                <td className="px-4 py-3 font-semibold tabular-nums text-gray-900">
                                  {formatMoney(row.amountGross)}
                                </td>
                                <td className="px-4 py-3 tabular-nums text-teal-300 font-semibold">
                                  {formatMoney(row.feePayPlus)}
                                </td>
                                <td className="px-4 py-3 font-bold tabular-nums text-emerald-300">
                                  {formatMoney(row.net)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg border border-gray-200">
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {aiModal.data.tableData.length > 0 ? (
                          <tfoot>
                            <tr className="bg-gray-50 border-t-2 border-gray-200">
                              <td
                                colSpan={2}
                                className="px-4 py-3.5 text-sm font-black text-gray-900"
                              >
                                סה״כ ({aiModal.data.tableData.length} עסקאות)
                              </td>
                              <td className="px-4 py-3.5 text-sm font-black tabular-nums text-gray-900">
                                {formatMoney(
                                  payPlusTableTotals(aiModal.data.tableData).gross,
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-sm font-black tabular-nums text-teal-300">
                                {formatMoney(
                                  payPlusTableTotals(aiModal.data.tableData).fee,
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-sm font-black tabular-nums text-emerald-300">
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

            <div className="px-8 pb-8 pt-2 shrink-0 border-t border-gray-100 bg-white">
              <button type="button" onClick={() => setAiModal(null)} className="btn-primary w-full py-3.5">
                סגור
              </button>
            </div>
          </div>
        </div>
        </PortalToBody>
      ) : null}
    </div>
  );
}
