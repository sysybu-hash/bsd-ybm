"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resolvePriceAlertLineItemsAction } from "@/app/actions/erp-line-items";
import { useI18n } from "@/components/I18nProvider";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { WORKSPACE_OVERLAY_Z_CLASS } from "@/components/portal/PortalToBody";

export type PendingPriceAlertLine = {
  id: string;
  description: string;
  quantity: number | null;
  supplierName: string | null;
  documentFileName: string;
};

type Props = {
  open: boolean;
  onDismiss: () => void;
  lines: PendingPriceAlertLine[];
  /** סה״כ שורות עם דגל (מה-DB) — יכול להיות גדול מ-lines.length בגלל מגבלת טעינה */
  totalPendingCount: number;
};

export default function PriceAlertResolveModal({ open, onDismiss, lines, totalPendingCount }: Props) {
  const { t, dir } = useI18n();
  const router = useRouter();
  const { pending, run } = useAsyncAction();
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setPrices(Object.fromEntries(lines.map((l) => [l.id, ""])));
    }
  }, [open, lines]);

  const handleSave = async () => {
    const updates: { id: string; unitPrice: number }[] = [];
    for (const line of lines) {
      const raw = (prices[line.id] ?? "").trim().replace(/,/g, ".");
      const v = parseFloat(raw);
      if (!Number.isFinite(v) || v <= 0) {
        toast.error(t("erpDash.priceAlertValidate"));
        return;
      }
      updates.push({ id: line.id, unitPrice: v });
    }

    const res = await run(() => resolvePriceAlertLineItemsAction({ updates }), {
      successToast: t("erpDash.priceAlertSaved", { count: String(updates.length) }),
    });

    if (res && typeof res === "object" && "ok" in res && res.ok === true) {
      router.refresh();
      onDismiss();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onDismiss();
      }}
      className={`relative ${WORKSPACE_OVERLAY_Z_CLASS}`}
    >
      <DialogBackdrop
        transition
        className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} bg-slate-900/40 backdrop-blur-sm transition data-[closed]:opacity-0`}
      />
      <div className={`fixed inset-0 ${WORKSPACE_OVERLAY_Z_CLASS} flex items-end justify-center p-4 sm:items-center sm:p-6`}>
        <DialogPanel
          transition
          className="flex max-h-[min(88vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/10 bg-white/85 shadow-xl backdrop-blur-xl backdrop-saturate-150 transition data-[closed]:scale-95 data-[closed]:opacity-0"
          dir={dir}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/60 px-5 py-4">
            <DialogTitle className="text-start text-base font-black text-slate-900">
              {t("erpDash.priceAlertModalTitle")}
            </DialogTitle>
            <button
              type="button"
              onClick={onDismiss}
              disabled={pending}
              className="rounded-xl border border-slate-200/80 bg-white/90 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              aria-label={t("erpDash.priceAlertDismiss")}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="shrink-0 space-y-2 px-5 pb-2">
            <p className="text-xs font-semibold leading-relaxed text-slate-600">
              {t("erpDash.priceAlertModalHint")}
            </p>
            {totalPendingCount > lines.length ? (
              <p className="rounded-lg bg-amber-100/80 px-3 py-2 text-[11px] font-bold text-amber-950">
                {t("erpDash.priceAlertModalTruncated", {
                  shown: String(lines.length),
                  total: String(totalPendingCount),
                })}
              </p>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
            <ul className="space-y-3">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="rounded-xl border border-slate-200/50 bg-white/70 p-3 shadow-sm ring-1 ring-slate-100/80"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {line.documentFileName}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">{line.description}</p>
                  {line.supplierName ? (
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{line.supplierName}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="flex min-w-[7rem] flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-slate-500">
                        {t("erpDash.priceAlertQuantity")}
                      </span>
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold tabular-nums text-slate-800">
                        {line.quantity != null && line.quantity > 0
                          ? String(line.quantity)
                          : "—"}
                      </span>
                    </label>
                    <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-slate-500">
                        {t("erpDash.priceAlertUnitPrice")}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={prices[line.id] ?? ""}
                        onChange={(e) =>
                          setPrices((prev) => ({ ...prev, [line.id]: e.target.value }))
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold tabular-nums text-slate-900 outline-none ring-slate-200 transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                        dir="ltr"
                        placeholder="0.00"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200/60 bg-white/60 px-5 py-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={onDismiss}
              disabled={pending}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t("erpDash.priceAlertDismiss")}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={pending || lines.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {t("erpDash.priceAlertSave")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
