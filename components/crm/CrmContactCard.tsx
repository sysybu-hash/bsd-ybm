"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, Mail, MoreVertical, Phone, ReceiptText } from "lucide-react";
import { STATUS_COLUMNS } from "./crm-client-constants";
import type { ContactRow, StatusKey } from "./crm-client-types";
import { avatarColor, fmtMoney, initials, statusMeta } from "./crm-client-utils";

type Props = {
  contact: ContactRow;
  onEdit: (c: ContactRow) => void;
  onStatusChange: (id: string, status: StatusKey) => void;
};

export default function CrmContactCard({ contact, onEdit, onStatusChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = statusMeta(contact.status);

  return (
    <div
      className="group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
      onClick={() => onEdit(contact)}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm"
            style={{ backgroundColor: avatarColor(contact.id) }}
          >
            {initials(contact.name)}
          </div>
          <div>
            <p className="text-sm font-black leading-tight text-slate-900 transition group-hover:text-blue-700">
              {contact.name}
            </p>
            {contact.project && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{contact.project.name}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-800 group-hover:opacity-100"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <div
          className={`flex flex-1 justify-center rounded-md py-1.5 text-[11px] font-black tracking-wide ${meta.bg} ${meta.text}`}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          {meta.label}
        </div>

        {contact.value != null ? (
          <span className="w-14 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-center text-xs font-black text-slate-800 tabular-nums">
            {fmtMoney(contact.value)}
          </span>
        ) : (
          <span className="w-14 rounded-md border border-dashed border-slate-200 px-2.5 py-1.5 text-center text-xs font-black text-slate-400">
            —
          </span>
        )}
      </div>

      {(contact.email || contact.phone) && (
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {contact.phone && (
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500" dir="ltr">
              <div className="rounded bg-slate-100 p-1">
                <Phone size={10} className="text-slate-600" />
              </div>{" "}
              {contact.phone}
            </div>
          )}
          {contact.email && (
            <div className="flex max-w-full items-center gap-2 truncate text-[11px] font-medium text-slate-500" dir="ltr">
              <div className="rounded bg-slate-100 p-1">
                <Mail size={10} className="text-slate-600" />
              </div>{" "}
              {contact.email}
            </div>
          )}
        </div>
      )}

      {(contact.erp?.invoiceCount ?? 0) > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-700">
            <ReceiptText size={12} />
            <span>{contact.erp!.invoiceCount} ח-ניות</span>
          </div>
          {contact.erp!.totalPending > 0 ? (
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              חוב {fmtMoney(contact.erp!.totalPending)}
            </span>
          ) : (
            <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">הכל שולם</span>
          )}
        </div>
      )}

      {menuOpen && (
        <div
          className="absolute start-2 top-12 z-20 min-w-[180px] rounded-xl border border-slate-200 bg-white py-2 text-start shadow-xl shadow-black/10"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-1 border-b border-slate-100 px-3 py-1 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            שינוי סטטוס
          </p>
          {STATUS_COLUMNS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                onStatusChange(contact.id, s.key);
                setMenuOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 border-s-2 px-3 py-2 text-xs font-bold transition hover:bg-slate-50 ${
                contact.status === s.key
                  ? "border-blue-600 bg-blue-50 text-blue-800"
                  : "border-transparent text-slate-700"
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-sm shadow-sm ${s.bg}`} /> {s.label}
            </button>
          ))}
          <div className="mt-2 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => {
                onEdit(contact);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Edit3 size={14} /> פתיחת כרטיס מלא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
