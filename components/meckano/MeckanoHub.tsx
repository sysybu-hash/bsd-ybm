"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Clock,
  CheckSquare,
  BarChart2,
  Settings,
  RefreshCw,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  Key,
  CalendarDays,
  Phone,
  Mail,
  Hash,
  Car,
  Globe,
  Briefcase,
  Activity,
  UserCheck,
  UserX,
  FileText,
  Info,
} from "lucide-react";
import { updateMeckanoApiKeyAction } from "@/app/actions/org-settings";

// ─── Types ────────────────────────────────────────────────────────────────────

type MeckanoEmployee = {
  id: number;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  workerTag?: string | null;
  role?: string | null;
  departmentId?: number;
  department?: { id: number; name: string; number: number } | null;
  activeState?: number;
  lastCheckState?: number;
  lastCheckTime?: number | null;
  userType?: number;
  city?: string | null;
  idNum?: string | null;
  hasCar?: boolean;
  employedFrom_dt?: string | null;
  employedUntil_dt?: string | null;
};

type MeckanoDepartment = {
  id: number;
  name: string;
  number?: number;
  parentId?: number | null;
  usersCount?: number;
};

type MeckanoAttendance = {
  id: number;
  userId: number;
  uts: number;
  ts: number;
  mts: number | null;
  isOut: boolean;
  flag: number;
  disabled: boolean;
  companyId: number;
  userName?: string;
  workerTag?: string;
  dateStr?: string;
  timeStr?: string;
};

type MeckanoTask = {
  id: number;
  name: string;
  code?: string | null;
  isActive?: number;
  parentId?: number | null;
};

type MeckanoTaskEntry = {
  id: number;
  userId: number;
  taskId: number;
  ts: number;
  duration?: number;
  note?: string | null;
  dateStr?: string;
  taskName?: string;
  userName?: string;
};

type ApiResult<T> = { status: boolean; data?: T; error?: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function meckanoFetch<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
  const url = new URL(`/api/meckano/${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    return { status: false, error: err.error ?? `שגיאה ${res.status}` };
  }
  return res.json() as Promise<ApiResult<T>>;
}

function tsToDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("he-IL");
}
function tsToTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      {active ? "פעיל" : "לא פעיל"}
    </span>
  );
}

function CheckStateBadge({ state }: { state: number }) {
  const map: Record<number, { label: string; cls: string }> = {
    0: { label: "לא נרשם", cls: "bg-slate-100 text-slate-500" },
    1: { label: "כניסה", cls: "bg-blue-100 text-blue-700" },
    2: { label: "יציאה", cls: "bg-orange-100 text-orange-700" },
  };
  const info = map[state] ?? map[0];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${info.cls}`}>{info.label}</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <AlertCircle size={36} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "employees", label: "עובדים", Icon: Users },
  { id: "departments", label: "מחלקות", Icon: Building2 },
  { id: "attendance", label: "נוכחות", Icon: Clock },
  { id: "tasks", label: "משימות", Icon: CheckSquare },
  { id: "task-entries", label: "דיווח משימות", Icon: BarChart2 },
  { id: "settings", label: "הגדרות", Icon: Settings },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function MeckanoHub({ hasMeckanoKey }: { hasMeckanoKey: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>("employees");
  const [connected, setConnected] = useState(hasMeckanoKey);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keyMsg, setKeyMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pendingKey, startKeyTransition] = useTransition();

  // ── Employees ──
  const [employees, setEmployees] = useState<MeckanoEmployee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState<string | null>(null);
  const [empSearch, setEmpSearch] = useState("");
  const [empExpanded, setEmpExpanded] = useState<number | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncPending, setSyncPending] = useState(false);

  // ── Departments ──
  const [departments, setDepartments] = useState<MeckanoDepartment[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // ── Attendance ──
  const [attendance, setAttendance] = useState<MeckanoAttendance[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState<string | null>(null);
  const [attFrom, setAttFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [attTo, setAttTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [attUserId, setAttUserId] = useState<string>("");

  // ── Tasks ──
  const [tasks, setTasks] = useState<MeckanoTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // ── Task entries ──
  const [taskEntries, setTaskEntries] = useState<MeckanoTaskEntry[]>([]);
  const [teLoading, setTeLoading] = useState(false);
  const [teError, setTeError] = useState<string | null>(null);
  const [teFrom, setTeFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [teTo, setTeTo] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // ── Overview (derived from employees once loaded) ──
  const [overviewLoading, setOverviewLoading] = useState(false);

  // ── Load helpers ──
  const loadEmployees = useCallback(async () => {
    setEmpLoading(true); setEmpError(null);
    const r = await meckanoFetch<MeckanoEmployee[]>("users");
    setEmpLoading(false);
    if (r.status && r.data) setEmployees(r.data);
    else setEmpError(r.error ?? "שגיאה בטעינת עובדים");
  }, []);

  const loadDepartments = useCallback(async () => {
    setDeptLoading(true); setDeptError(null);
    const r = await meckanoFetch<MeckanoDepartment[]>("departments");
    setDeptLoading(false);
    if (r.status && r.data) setDepartments(r.data);
    else setDeptError(r.error ?? "שגיאה בטעינת מחלקות");
  }, []);

  const loadAttendance = useCallback(async () => {
    setAttLoading(true); setAttError(null);
    const from = Math.floor(new Date(attFrom).getTime() / 1000);
    const to = Math.floor(new Date(attTo + "T23:59:59").getTime() / 1000);
    const r = await meckanoFetch<MeckanoAttendance[]>("time-entry", { from: String(from), to: String(to) });
    setAttLoading(false);
    if (r.status && r.data) setAttendance(r.data);
    else setAttError(r.error ?? "שגיאה בטעינת נוכחות");
  }, [attFrom, attTo]);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true); setTasksError(null);
    const r = await meckanoFetch<MeckanoTask[]>("tasks");
    setTasksLoading(false);
    if (r.status && r.data) setTasks(r.data);
    else setTasksError(r.error ?? "שגיאה בטעינת משימות");
  }, []);

  const loadTaskEntries = useCallback(async () => {
    setTeLoading(true); setTeError(null);
    const from = Math.floor(new Date(teFrom).getTime() / 1000);
    const to = Math.floor(new Date(teTo + "T23:59:59").getTime() / 1000);
    const r = await meckanoFetch<MeckanoTaskEntry[]>("task-entry", { from: String(from), to: String(to) });
    setTeLoading(false);
    if (r.status && r.data) setTaskEntries(r.data);
    else setTeError(r.error ?? "שגיאה בטעינת דיווחי משימות");
  }, [teFrom, teTo]);

  // Auto-load on tab switch
  useEffect(() => {
    if (!connected) return;
    if (activeTab === "employees" && employees.length === 0) loadEmployees();
    if (activeTab === "departments" && departments.length === 0) loadDepartments();
    if (activeTab === "attendance") loadAttendance();
    if (activeTab === "tasks" && tasks.length === 0) loadTasks();
    if (activeTab === "task-entries") loadTaskEntries();
    if (activeTab === "settings" && employees.length === 0) {
      setOverviewLoading(true);
      loadEmployees().finally(() => setOverviewLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, connected]);

  // ── Sync employees to CRM ──
  const syncToCrm = async () => {
    if (!employees.length) return;
    setSyncPending(true); setSyncMsg(null);
    try {
      const res = await fetch("/api/meckano/sync/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees }),
      });
      const data = await res.json() as { synced?: number; error?: string };
      if (res.ok) setSyncMsg(`✓ סונכרנו ${data.synced ?? 0} אנשי קשר ל-CRM`);
      else setSyncMsg(`שגיאה: ${data.error ?? "לא ידוע"}`);
    } catch {
      setSyncMsg("שגיאת רשת");
    } finally {
      setSyncPending(false);
    }
  };

  const inputCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 transition";
  const filtered = employees.filter(e => {
    const q = empSearch.toLowerCase();
    const name = `${e.firstName ?? ""} ${e.lastName ?? ""} ${e.email ?? ""} ${e.workerTag ?? ""}`.toLowerCase();
    return name.includes(q);
  });

  // ── Not connected ──
  if (!connected) {
    return (
      <div className="mx-auto max-w-lg py-12" dir="rtl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-blue-600" />
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <Key size={28} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-black text-slate-900 mb-2">חיבור מקאנו</h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              הזינו את מפתח ה-API מלוח הניהול של מקאנו כדי לסנכרן עובדים, נוכחות ומשימות.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("meckanoApiKey", apiKeyInput);
                startKeyTransition(async () => {
                  const r = await updateMeckanoApiKeyAction(fd);
                  if (r.ok) { setConnected(true); setKeyMsg(null); }
                  else setKeyMsg({ ok: false, msg: r.error ?? "שגיאה" });
                });
              }}
              className="space-y-3 text-right"
            >
              <input
                type="text"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="OFIUOILqHkqISR9K..."
                className={`${inputCls} w-full font-mono text-xs`}
                dir="ltr"
                required
              />
              <button
                type="submit"
                disabled={pendingKey || !apiKeyInput.trim()}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pendingKey ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                חבר מקאנו
              </button>
            </form>
            {keyMsg && (
              <p className={`mt-3 text-sm ${keyMsg.ok ? "text-emerald-700" : "text-red-600"}`}>{keyMsg.msg}</p>
            )}
            <p className="mt-4 text-xs text-slate-400">
              ניתן גם{" "}
              <Link href="/dashboard/settings?tab=integrations" className="text-blue-600 hover:underline">
                להגדיר בדף ההגדרות
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-900" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-black">M</span>
          מקאנו
        </h1>
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-bold">
          <CheckCircle2 size={13} />
          מחובר
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-2 gap-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-6">

          {/* ── EMPLOYEES ── */}
          {activeTab === "employees" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    placeholder="חיפוש עובד..."
                    className={`${inputCls} pr-9 w-full`}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={loadEmployees} disabled={empLoading} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50">
                    <RefreshCw size={14} className={empLoading ? "animate-spin" : ""} /> רענון
                  </button>
                  <button onClick={syncToCrm} disabled={syncPending || !employees.length} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 transition disabled:opacity-50">
                    {syncPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    סנכרן ל-CRM
                  </button>
                </div>
              </div>

              {syncMsg && (
                <p className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${syncMsg.startsWith("✓") ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  {syncMsg}
                </p>
              )}

              {empLoading ? <LoadingSpinner /> : empError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{empError}</div>
              ) : filtered.length === 0 ? (
                <EmptyState message="לא נמצאו עובדים" />
              ) : (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                  {filtered.map(emp => {
                    const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.workerTag || `#${emp.id}`;
                    const isOpen = empExpanded === emp.id;
                    return (
                      <div key={emp.id}>
                        <button
                          type="button"
                          onClick={() => setEmpExpanded(isOpen ? null : emp.id)}
                          className="w-full flex items-center gap-4 px-5 py-4 text-right hover:bg-slate-50 transition"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-black text-sm">
                            {name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm">{name}</p>
                            <p className="text-xs text-slate-500 truncate">{emp.email ?? "—"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {emp.department && (
                              <span className="hidden sm:inline text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                {emp.department.name}
                              </span>
                            )}
                            <CheckStateBadge state={emp.lastCheckState ?? 0} />
                            <StatusBadge active={emp.activeState === 1} />
                            {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="bg-slate-50 border-t border-slate-100 px-5 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                              {emp.email && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Mail size={13} className="text-blue-400 shrink-0" />
                                  <span className="truncate" dir="ltr">{emp.email}</span>
                                </div>
                              )}
                              {emp.phone && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Phone size={13} className="text-emerald-400 shrink-0" />
                                  {emp.phone}
                                </div>
                              )}
                              {emp.idNum && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Hash size={13} className="text-slate-400 shrink-0" />
                                  ת.ז: {emp.idNum}
                                </div>
                              )}
                              {emp.city && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <ArrowRight size={13} className="text-slate-400 shrink-0" />
                                  עיר: {emp.city}
                                </div>
                              )}
                              {emp.role && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Users size={13} className="text-slate-400 shrink-0" />
                                  תפקיד: {emp.role}
                                </div>
                              )}
                              {emp.employedFrom_dt && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <CalendarDays size={13} className="text-slate-400 shrink-0" />
                                  תחילת עבודה: {emp.employedFrom_dt}
                                </div>
                              )}
                              {emp.hasCar && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Car size={13} className="text-slate-400 shrink-0" />
                                  יש רכב
                                </div>
                              )}
                              {emp.lastCheckTime && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Clock size={13} className="text-slate-400 shrink-0" />
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
              <p className="text-xs text-slate-400 text-left">{filtered.length} עובדים מוצגים</p>
            </div>
          )}

          {/* ── DEPARTMENTS ── */}
          {activeTab === "departments" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={loadDepartments} disabled={deptLoading} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50">
                  <RefreshCw size={14} className={deptLoading ? "animate-spin" : ""} /> רענון
                </button>
              </div>
              {deptLoading ? <LoadingSpinner /> : deptError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{deptError}</div>
              ) : departments.length === 0 ? (
                <EmptyState message="לא נמצאו מחלקות" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map(dept => (
                    <div key={dept.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-black text-sm shrink-0">
                          {dept.number ?? "—"}
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{dept.name}</p>
                      </div>
                      <p className="text-xs text-slate-500">ID: {dept.id}</p>
                      {dept.usersCount !== undefined && (
                        <p className="text-xs text-slate-500 mt-1">{dept.usersCount} עובדים</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">מתאריך</label>
                  <input type="date" value={attFrom} onChange={e => setAttFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">עד תאריך</label>
                  <input type="date" value={attTo} onChange={e => setAttTo(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">סינון עובד</label>
                  <select
                    value={attUserId}
                    onChange={e => setAttUserId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">כל העובדים</option>
                    {employees.map(e => (
                      <option key={e.id} value={String(e.id)}>
                        {[e.firstName, e.lastName].filter(Boolean).join(" ") || e.workerTag || `#${e.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={loadAttendance} disabled={attLoading} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50">
                  <RefreshCw size={14} className={attLoading ? "animate-spin" : ""} /> טעינה
                </button>
              </div>

              {attLoading ? <LoadingSpinner /> : attError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{attError}</div>
              ) : attendance.length === 0 ? (
                <EmptyState message="אין רשומות נוכחות בטווח שנבחר" />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {["עובד", "מספר", "תאריך", "שעה", "כניסה/יציאה"].map(h => (
                          <th key={h} className="px-4 py-3 text-right text-xs font-bold text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(attUserId ? attendance.filter(r => String(r.userId) === attUserId) : attendance).map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.userName ?? `#${row.userId}`}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">{row.workerTag ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{row.dateStr ?? tsToDate(row.ts)}</td>
                          <td className="px-4 py-3 text-slate-600" dir="ltr">{row.timeStr ?? tsToTime(row.ts)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                              row.isOut ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {row.isOut ? "יציאה" : "כניסה"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-slate-400 text-left">
                {attUserId ? attendance.filter(r => String(r.userId) === attUserId).length : attendance.length} רשומות
              </p>
            </div>
          )}

          {/* ── TASKS ── */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={loadTasks} disabled={tasksLoading} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50">
                  <RefreshCw size={14} className={tasksLoading ? "animate-spin" : ""} /> רענון
                </button>
              </div>
              {tasksLoading ? <LoadingSpinner /> : tasksError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{tasksError}</div>
              ) : tasks.length === 0 ? (
                <EmptyState message="לא נמצאו משימות" />
              ) : (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-black text-xs">
                        {task.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{task.name}</p>
                        {task.code && <p className="text-xs text-slate-500">קוד: {task.code}</p>}
                      </div>
                      <StatusBadge active={task.isActive === 1} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TASK ENTRIES ── */}
          {activeTab === "task-entries" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">מתאריך</label>
                  <input type="date" value={teFrom} onChange={e => setTeFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">עד תאריך</label>
                  <input type="date" value={teTo} onChange={e => setTeTo(e.target.value)} className={inputCls} />
                </div>
                <button onClick={loadTaskEntries} disabled={teLoading} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50">
                  <RefreshCw size={14} className={teLoading ? "animate-spin" : ""} /> טעינה
                </button>
              </div>
              {teLoading ? <LoadingSpinner /> : teError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{teError}</div>
              ) : taskEntries.length === 0 ? (
                <EmptyState message="אין דיווחי משימות בטווח שנבחר" />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {["עובד", "משימה", "תאריך", "משך (דק׳)", "הערה"].map(h => (
                          <th key={h} className="px-4 py-3 text-right text-xs font-bold text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taskEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-medium text-slate-900">{entry.userName ?? `#${entry.userId}`}</td>
                          <td className="px-4 py-3 text-slate-700">{entry.taskName ?? `#${entry.taskId}`}</td>
                          <td className="px-4 py-3 text-slate-600">{entry.dateStr ?? tsToDate(entry.ts)}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono">{entry.duration ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{entry.note ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-slate-400 text-left">{taskEntries.length} רשומות</p>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === "settings" && (() => {
            // Derive company overview from loaded employees
            const companyName = employees.find(e => e.firstName || e.lastName)
              ? (employees[0] as unknown as { companyName?: string }).companyName ?? "—"
              : "—";
            const totalEmp = employees.length;
            const active = employees.filter(e => e.activeState === 1).length;
            const inactive = totalEmp - active;
            // Contract distribution
            type EmployeeWithContract = MeckanoEmployee & { contractName?: string | null };
            const contractMap: Record<string, number> = {};
            employees.forEach(e => {
              const cn = (e as EmployeeWithContract).contractName ?? "ללא חוזה";
              contractMap[cn] = (contractMap[cn] ?? 0) + 1;
            });
            const contracts = Object.entries(contractMap).sort((a, b) => b[1] - a[1]);
            // Timezone
            type EmpWithTz = MeckanoEmployee & { userTimezone?: string; userCalendar?: number; companyId?: number };
            const timezone = employees.length > 0 ? ((employees[0] as EmpWithTz).userTimezone ?? "—") : "—";
            const companyId = employees.length > 0 ? ((employees[0] as EmpWithTz).companyId ?? "—") : "—";
            const calendarNum = employees.length > 0 ? ((employees[0] as EmpWithTz).userCalendar ?? 1) : 1;
            const calendarLabel = calendarNum === 1 ? "לוח שנה עברי" : calendarNum === 2 ? "לוח שנה ערבי" : "לוח שנה גרגוריאני";

            return (
              <div className="space-y-6" dir="rtl">

                {/* Company Overview */}
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Info size={16} className="text-blue-600" /> סקירת חברה
                  </h3>
                  {overviewLoading || empLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Company name + ID */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          <Briefcase size={18} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 mb-0.5">שם חברה</p>
                          <p className="font-black text-slate-900 text-sm leading-snug">{companyName}</p>
                          <p className="text-xs text-slate-400 mt-1 font-mono">ID: {companyId}</p>
                        </div>
                      </div>
                      {/* Employees */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                          <Users size={18} className="text-violet-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">סה״כ עובדים</p>
                          <p className="font-black text-slate-900 text-2xl leading-none">{totalEmp}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                              <UserCheck size={11} /> {active} פעילים
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                              <UserX size={11} /> {inactive} לא פעילים
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Timezone & Calendar */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                          <Globe size={18} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">אזור זמן</p>
                          <p className="font-bold text-slate-900 text-sm" dir="ltr">{timezone}</p>
                          <p className="text-xs text-slate-500 mt-1">{calendarLabel}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contract Distribution */}
                {contracts.length > 0 && (
                  <div>
                    <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-indigo-600" /> חוזי עבודה
                    </h3>
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      {contracts.map(([name, count]) => {
                        const pct = totalEmp > 0 ? Math.round((count / totalEmp) * 100) : 0;
                        return (
                          <div key={name} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate">{name}</p>
                              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                                <div
                                  className="h-1.5 rounded-full bg-indigo-400 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-lg font-black text-slate-900">{count}</span>
                              <span className="text-xs text-slate-400 mr-1">עובדים</span>
                              <p className="text-xs text-slate-400">{pct}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Activity indicator */}
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-600" /> סטטוס אינטגרציה
                  </h3>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                    {[
                      { label: "עובדים ↔ CRM אנשי קשר", desc: "סנכרון ידני מלשונית עובדים", ok: true },
                      { label: "נוכחות — time-entry", desc: "צפייה לפי טווח תאריכים (Unix timestamps)", ok: true },
                      { label: "מחלקות", desc: "עדכון בזמן אמת", ok: true },
                      { label: "משימות ודיווח שעות", desc: "צפייה מלאה + פילוח לפי עובד", ok: true },
                    ].map(({ label, desc, ok }) => (
                      <div key={label} className="flex items-start gap-3">
                        <CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${ok ? "text-emerald-500" : "text-slate-300"}`} />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{label}</p>
                          <p className="text-xs text-slate-500">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
                    <Key size={16} className="text-blue-600" /> מפתח API
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    המפתח נשמר מוצפן בשרת ולעולם לא נחשף לצד-לקוח.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      startKeyTransition(async () => {
                        const r = await updateMeckanoApiKeyAction(fd);
                        setKeyMsg({ ok: r.ok, msg: r.ok ? "✓ מפתח עודכן בהצלחה" : (r.error ?? "שגיאה") });
                      });
                    }}
                    className="flex gap-3 max-w-lg"
                  >
                    <input
                      name="meckanoApiKey"
                      type="text"
                      placeholder="מפתח API חדש"
                      className={`${inputCls} flex-1 font-mono text-xs`}
                      dir="ltr"
                    />
                    <button
                      type="submit"
                      disabled={pendingKey}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shrink-0"
                    >
                      {pendingKey ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                      עדכן
                    </button>
                  </form>
                  {keyMsg && (
                    <p className={`mt-3 text-sm ${keyMsg.ok ? "text-emerald-700" : "text-red-600"}`}>{keyMsg.msg}</p>
                  )}
                </div>

                {/* Docs link */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-blue-900 text-sm">תיעוד API מקאנו</p>
                    <p className="text-xs text-blue-700 mt-0.5">כלים למתכנתים — REST API</p>
                  </div>
                  <a
                    href="https://www.meckano.co.il/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-xl px-3 py-2 hover:bg-blue-50 transition"
                  >
                    <Download size={12} /> פתח תיעוד
                  </a>
                </div>

              </div>
            );
          })()}


        </div>
      </div>
    </div>
  );
}
