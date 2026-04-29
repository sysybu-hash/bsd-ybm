"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteProjectAction, updateProjectAction } from "@/app/actions/crm";
import { toastClientActionFeedback } from "@/lib/polish/action-response-toast";
import { formatCurrencyILS, formatShortDate } from "@/lib/ui-formatters";
import { inputClass, SubmitButton } from "@/components/settings/settings-form-primitives";
import { Surface } from "@/components/ui/claude";
import { useI18n } from "@/components/I18nProvider";
import QuickClientForm from "@/components/crm/QuickClientForm";

type ContactRow = {
  id: string;
  name: string;
  status: string;
  value: number | null;
  totalBilled: number;
  totalPending: number;
};

export type ProjectExpenseRow = {
  id: string;
  vendorName: string;
  total: number;
  expenseDate: string;
  status: string;
};

export type ProjectIssuedRow = {
  id: string;
  type: string;
  number: number;
  date: string;
  total: number;
  status: string;
  clientName: string;
};

type MeckanoZoneOption = { id: string; name: string };

type Props = {
  project: {
    id: string;
    name: string;
    isActive: boolean;
    activeFrom: string | null;
    activeTo: string | null;
    meckanoZoneId: string | null;
  };
  contacts: ContactRow[];
  expensesPostedTotal: number;
  expenseRows: ProjectExpenseRow[];
  issuedRows: ProjectIssuedRow[];
  allProjects: { id: string; name: string }[];
  meckanoZones: MeckanoZoneOption[];
};

export default function ProjectDetailWorkspace({
  project,
  contacts,
  expensesPostedTotal,
  expenseRows,
  issuedRows,
  allProjects,
  meckanoZones,
}: Props) {
  const router = useRouter();
  const { t, dir } = useI18n();
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);

  const activeFromInput = project.activeFrom ? project.activeFrom.slice(0, 10) : "";
  const activeToInput = project.activeTo ? project.activeTo.slice(0, 10) : "";

  const statusLabel = (s: string, kind: "doc" | "expense") => {
    if (kind === "doc") {
      const k = `workspaceClients.projectDetail.docStatus.${s}` as const;
      const v = t(k);
      return v === k ? s : v;
    }
    const k = `workspaceClients.projectDetail.expenseStatus.${s}` as const;
    const v = t(k);
    return v === k ? s : v;
  };

  const contactStatusLabel = (s: string) => {
    const k = `workspaceClients.status.${s}` as const;
    const v = t(k);
    return v === k ? s : v;
  };

  return (
    <div className="space-y-8" dir={dir}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">
            {t("workspaceClients.projectDetail.kpiExpensesPosted")}
          </p>
          <p className="mt-1 text-xl font-black tabular-nums text-[color:var(--axis-finance)]">
            {formatCurrencyILS(expensesPostedTotal)}
          </p>
          <Link
            href="/app/erp"
            className="mt-2 inline-block text-xs font-bold text-[color:var(--axis-finance)] hover:underline"
          >
            {t("workspaceClients.projectDetail.kpiFinanceLink")}
          </Link>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">
            {t("workspaceClients.projectDetail.kpiClientsInProject")}
          </p>
          <p className="mt-1 text-xl font-black tabular-nums">{contacts.length}</p>
        </Surface>
        <Surface className="!p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-500)]">
            {t("workspaceClients.projectDetail.kpiOpenBilling")}
          </p>
          <p className="mt-1 text-xl font-black tabular-nums text-[color:var(--state-warning)]">
            {formatCurrencyILS(contacts.reduce((s, c) => s + c.totalPending, 0))}
          </p>
        </Surface>
      </div>

      <Surface className="!p-5">
        <h3 className="text-sm font-black text-[color:var(--ink-900)]">{t("workspaceClients.projectDetail.quickTitle")}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/app/crm?projectId=${encodeURIComponent(project.id)}`}
            className="rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2 text-xs font-black text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
          >
            {t("workspaceClients.projectDetail.quickClientsInProject")}
          </Link>
          <Link
            href="/app/crm?hub=projects"
            className="rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2 text-xs font-black text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
          >
            {t("workspaceClients.projectDetail.quickProjectsHub")}
          </Link>
          <Link
            href="/app/erp"
            className="rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--canvas-raised)] px-4 py-2 text-xs font-black text-[color:var(--ink-800)] hover:bg-[color:var(--canvas-sunken)]"
          >
            {t("workspaceClients.projectDetail.quickErp")}
          </Link>
        </div>
      </Surface>

      <Surface className="!p-5">
        <h3 className="text-sm font-black text-[color:var(--ink-900)]">{t("workspaceClients.projectDetail.quickAddClientTitle")}</h3>
        <div className="mt-4">
          <QuickClientForm projects={allProjects} defaultProjectId={project.id} />
        </div>
      </Surface>

      <Surface className="!p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceClients.projectDetail.sectionDetails")}</h2>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line)] px-3 py-2 text-sm font-bold text-[color:var(--ink-700)] hover:bg-[color:var(--canvas-sunken)]"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {editing ? t("workspaceClients.projectDetail.closeEdit") : t("workspaceClients.projectDetail.edit")}
          </button>
        </div>

        {editing ? (
          <form
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void (async () => {
                setPending(true);
                try {
                  const r = await toastClientActionFeedback(() => updateProjectAction(fd), {
                    successMessage: t("workspaceClients.projectDetail.toastUpdateOk"),
                    loadingMessage: t("workspaceClients.projectDetail.toastUpdateLoading"),
                  });
                  if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                    setEditing(false);
                    router.refresh();
                  }
                } finally {
                  setPending(false);
                }
              })();
            }}
          >
            <input type="hidden" name="projectId" value={project.id} />
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">{t("workspaceClients.projectDetail.labelName")}</label>
              <input name="name" className={inputClass} defaultValue={project.name} required />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">
                {t("workspaceClients.projectDetail.labelPeriodStart")}
              </label>
              <input name="activeFrom" type="date" className={inputClass} defaultValue={activeFromInput} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">
                {t("workspaceClients.projectDetail.labelPeriodEnd")}
              </label>
              <input name="activeTo" type="date" className={inputClass} defaultValue={activeToInput} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold text-[color:var(--ink-500)]">
                {t("workspaceClients.projectDetail.labelMeckanoZone")}
              </label>
              <select name="meckanoZoneId" className={inputClass} defaultValue={project.meckanoZoneId ?? ""}>
                <option value="">{t("workspaceClients.projectDetail.meckanoZoneNone")}</option>
                {meckanoZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  name="isActive"
                  value="on"
                  defaultChecked={project.isActive}
                  className="rounded border-[color:var(--line-strong)]"
                />
                {t("workspaceClients.projectDetail.labelActiveProject")}
              </label>
              <SubmitButton busy={pending} label={t("workspaceClients.projectDetail.save")} />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                disabled={pending}
                onClick={() => {
                  if (!confirm(t("workspaceClients.projectDetail.deleteConfirm"))) return;
                  void (async () => {
                    setPending(true);
                    try {
                      const r = await toastClientActionFeedback(() => deleteProjectAction(project.id), {
                        successMessage: t("workspaceClients.projectDetail.toastDeleteOk"),
                        loadingMessage: t("workspaceClients.projectDetail.toastDeleteLoading"),
                      });
                      if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok) {
                        router.push("/app/crm?hub=projects");
                        router.refresh();
                      }
                    } finally {
                      setPending(false);
                    }
                  })();
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t("workspaceClients.projectDetail.delete")}
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-[color:var(--line-subtle)] py-2">
              <dt className="text-[color:var(--ink-500)]">{t("workspaceClients.projectDetail.statusLabel")}</dt>
              <dd className="font-bold">
                {project.isActive ? t("workspaceClients.projectDetail.statusActive") : t("workspaceClients.projectDetail.statusArchived")}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[color:var(--line-subtle)] py-2">
              <dt className="text-[color:var(--ink-500)]">{t("workspaceClients.projectDetail.periodLabel")}</dt>
              <dd className="font-bold tabular-nums">
                {activeFromInput || t("workspaceClients.projectDetail.dash")} — {activeToInput || t("workspaceClients.projectDetail.dash")}
              </dd>
            </div>
            {meckanoZones.length > 0 ? (
              <div className="flex justify-between gap-4 border-b border-[color:var(--line-subtle)] py-2">
                <dt className="text-[color:var(--ink-500)]">{t("workspaceClients.projectDetail.labelMeckanoZone")}</dt>
                <dd className="font-bold">
                  {project.meckanoZoneId
                    ? meckanoZones.find((z) => z.id === project.meckanoZoneId)?.name ?? t("workspaceClients.projectDetail.dash")
                    : t("workspaceClients.projectDetail.meckanoZoneNone")}
                </dd>
              </div>
            ) : null}
          </dl>
        )}
      </Surface>

      <Surface className="!p-5">
        <h3 className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceClients.projectDetail.sectionExpenses")}</h3>
        {expenseRows.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--ink-500)]">{t("workspaceClients.projectDetail.expensesEmpty")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-start text-sm">
              <thead>
                <tr className="border-b border-[color:var(--line)] text-[11px] font-black uppercase text-[color:var(--ink-500)]">
                  <th className="py-2 pe-3">{t("workspaceClients.projectDetail.colExpenseVendor")}</th>
                  <th className="py-2 pe-3">{t("workspaceClients.projectDetail.colExpenseDate")}</th>
                  <th className="py-2 pe-3">{t("workspaceClients.projectDetail.colExpenseTotal")}</th>
                  <th className="py-2">{t("workspaceClients.projectDetail.colExpenseStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((row) => (
                  <tr key={row.id} className="border-b border-[color:var(--line-subtle)]">
                    <td className="py-2 pe-3 font-semibold text-[color:var(--ink-900)]">{row.vendorName}</td>
                    <td className="py-2 pe-3 tabular-nums text-[color:var(--ink-600)]">{formatShortDate(row.expenseDate)}</td>
                    <td className="py-2 pe-3 font-black tabular-nums">{formatCurrencyILS(row.total)}</td>
                    <td className="py-2 text-xs font-bold">{statusLabel(row.status, "expense")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      <Surface className="!p-5">
        <h3 className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceClients.projectDetail.sectionIssued")}</h3>
        {issuedRows.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--ink-500)]">{t("workspaceClients.projectDetail.issuedEmpty")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-start text-sm">
              <thead>
                <tr className="border-b border-[color:var(--line)] text-[11px] font-black uppercase text-[color:var(--ink-500)]">
                  <th className="py-2 pe-3">{t("workspaceClients.projectDetail.colIssuedType")}</th>
                  <th className="py-2 pe-3">{t("workspaceClients.projectDetail.colIssuedClient")}</th>
                  <th className="py-2 pe-3">{t("workspaceClients.projectDetail.colIssuedDate")}</th>
                  <th className="py-2 pe-3">{t("workspaceClients.projectDetail.colIssuedTotal")}</th>
                  <th className="py-2">{t("workspaceClients.projectDetail.colIssuedStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {issuedRows.map((row) => (
                  <tr key={row.id} className="border-b border-[color:var(--line-subtle)]">
                    <td className="py-2 pe-3 font-semibold text-[color:var(--ink-900)]">
                      {row.type} #{row.number}
                    </td>
                    <td className="py-2 pe-3 text-[color:var(--ink-700)]">{row.clientName}</td>
                    <td className="py-2 pe-3 tabular-nums text-[color:var(--ink-600)]">{formatShortDate(row.date)}</td>
                    <td className="py-2 pe-3 font-black tabular-nums">{formatCurrencyILS(row.total)}</td>
                    <td className="py-2 text-xs font-bold">{statusLabel(row.status, "doc")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      <Surface className="!p-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[color:var(--axis-clients)]" aria-hidden />
          <h2 className="text-lg font-black text-[color:var(--ink-900)]">{t("workspaceClients.projectDetail.sectionClients")}</h2>
        </div>
        {contacts.length === 0 ? (
          <EmptyState
            variant="bare"
            icon={Users}
            title={t("workspaceClients.projectDetail.clientsEmptyTitle")}
            description={t("workspaceClients.projectDetail.clientsEmptyBody")}
            className="mt-4 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/70 py-8"
          />
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--line-subtle)]">
            {contacts.map((c) => (
              <li key={c.id} className="py-3">
                <Link
                  href={`/app/crm/client/${encodeURIComponent(c.id)}`}
                  className="flex flex-wrap items-center justify-between gap-2 transition hover:text-[color:var(--axis-clients)]"
                >
                  <span className="font-black text-[color:var(--ink-900)]">{c.name}</span>
                  <span className="text-xs text-[color:var(--ink-500)]">{contactStatusLabel(c.status)}</span>
                  <span className="w-full text-xs text-[color:var(--ink-400)] sm:w-auto">
                    {t("workspaceClients.projectDetail.clientLineExpected", { amount: formatCurrencyILS(c.value ?? 0) })}
                    {c.totalPending > 0
                      ? ` · ${t("workspaceClients.projectDetail.clientLineOpen", { amount: formatCurrencyILS(c.totalPending) })}`
                      : null}
                    {c.totalBilled > 0
                      ? ` · ${t("workspaceClients.projectDetail.clientLineIssued", { amount: formatCurrencyILS(c.totalBilled) })}`
                      : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
