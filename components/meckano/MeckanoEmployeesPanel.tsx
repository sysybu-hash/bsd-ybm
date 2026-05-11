"use client";

import {
  Search,
  RefreshCw,
  Loader2,
  UserPlus,
  Mail,
  Phone,
  Hash,
  ArrowRight,
  Users,
  CalendarDays,
  Car,
  Clock,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { tsToDate, tsToTime } from "./api";
import { LoadingSpinner, MeckanoEmptyHint } from "./ui";
import type { MeckanoEmployee } from "./types";

type Props = {
  inputCls: string;
  employees: MeckanoEmployee[];
  empSearch: string;
  setEmpSearch: (v: string) => void;
  empLoading: boolean;
  empError: string | null;
  loadEmployees: () => void | Promise<void>;
  syncToCrm: () => void | Promise<void>;
  syncPending: boolean;
  syncMsg: string | null;
  empExpanded: number | null;
  setEmpExpanded: (id: number | null) => void;
};

export default function MeckanoEmployeesPanel({
  inputCls,
  employees,
  empSearch,
  setEmpSearch,
  empLoading,
  empError,
  loadEmployees,
  syncToCrm,
  syncPending,
  syncMsg,
  empExpanded,
  setEmpExpanded,
}: Props) {
  const activeEmployees = employees.filter((e) => e.activeState === 1);
  const filtered = activeEmployees.filter((e) => {
    const q = empSearch.toLowerCase();
    const name = `${e.firstName ?? ""} ${e.lastName ?? ""} ${e.email ?? ""} ${e.workerTag ?? ""}`.toLowerCase();
    return name.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            placeholder="חיפוש עובד..."
            className={`${inputCls} w-full pe-9`}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadEmployees()}
            disabled={empLoading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={14} className={empLoading ? "animate-spin" : ""} /> רענון
          </button>
          <button
            type="button"
            onClick={() => void syncToCrm()}
            disabled={syncPending || !employees.length}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {syncPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            סנכרן עובדים ל-CRM
          </button>
        </div>
      </div>

      {syncMsg && (
        <p
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
            syncMsg.startsWith("✓")
              ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
              : "bg-rose-500/[0.08] border-rose-500/25 text-rose-300"
          }`}
        >
          {syncMsg}
        </p>
      )}

      {empLoading ? (
        <LoadingSpinner />
      ) : empError ? (
        <div className="rounded-xl border border-red-100 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">{empError}</div>
      ) : filtered.length === 0 ? (
        <MeckanoEmptyHint message="לא נמצאו עובדים" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 divide-y divide-white/[0.05]">
          {filtered.map((emp) => {
            const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.workerTag || `#${emp.id}`;
            const isOpen = empExpanded === emp.id;
            return (
              <div key={emp.id}>
                <button
                  type="button"
                  onClick={() => setEmpExpanded(isOpen ? null : emp.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-end transition hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-sm font-black text-teal-300">
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{name}</p>
                    <p className="truncate text-xs text-gray-400">{emp.email ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {emp.department && (
                      <span className="hidden rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400 sm:inline">
                        {emp.department.name}
                      </span>
                    )}
                    {(() => {
                      const now = Date.now() / 1000;
                      const isIn = emp.lastCheckState === 1 && emp.lastCheckTime && now - emp.lastCheckTime < 86400;
                      const isOut = emp.lastCheckState === 2;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                            isIn
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isOut
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                              isIn ? "bg-emerald-500/15 animate-pulse" : isOut ? "bg-orange-400" : "bg-gray-200"
                            }`}
                          />
                          {isIn ? "בעבודה" : isOut ? "יצא" : "לא פעיל"}
                        </span>
                      );
                    })()}
                    {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                      {emp.email && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Mail size={13} className="text-teal-400 shrink-0" />
                          <span className="truncate" dir="ltr">
                            {emp.email}
                          </span>
                        </div>
                      )}
                      {emp.phone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone size={13} className="text-emerald-400 shrink-0" />
                          {emp.phone}
                        </div>
                      )}
                      {emp.idNum && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Hash size={13} className="text-gray-400 shrink-0" />
                          ת.ז: {emp.idNum}
                        </div>
                      )}
                      {emp.city && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <ArrowRight size={13} className="text-gray-400 shrink-0" />
                          עיר: {emp.city}
                        </div>
                      )}
                      {emp.role && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users size={13} className="text-gray-400 shrink-0" />
                          תפקיד: {emp.role}
                        </div>
                      )}
                      {emp.employedFrom_dt && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <CalendarDays size={13} className="text-gray-400 shrink-0" />
                          תחילת עבודה: {emp.employedFrom_dt}
                        </div>
                      )}
                      {emp.hasCar && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Car size={13} className="text-gray-400 shrink-0" />
                          יש רכב
                        </div>
                      )}
                      {emp.lastCheckTime && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          נוכחות אחרונה: {tsToDate(emp.lastCheckTime)} {tsToTime(emp.lastCheckTime)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-start text-xs text-gray-400">
        {filtered.length} עובדים פעילים מוצגים (מתוך {employees.length} סה״כ)
      </p>
    </div>
  );
}
