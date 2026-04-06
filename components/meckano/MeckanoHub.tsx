"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
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
  Trash2,
} from "lucide-react";
import { updateMeckanoApiKeyAction } from "@/app/actions/org-settings";

// Dynamic import for Leaflet map (no SSR)
const MeckanoMap = dynamic(() => import("./MeckanoMap"), { ssr: false, loading: () => <LoadingSpinner /> });

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

type MeckanoZone = {
  id: string;
  name: string;
  address: string;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
  radius: number;
  isActive: boolean;
  syncedToCrm: boolean;
  managerName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budgetHours?: number | null;
  hourlyRate?: number | null;
  projectNotes?: string | null;
  assignedEmployeeIds?: number[];
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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.08] text-white/45"}`}>
      {active ? "פעיל" : "לא פעיל"}
    </span>
  );
}

function CheckStateBadge({ state }: { state: number }) {
  const map: Record<number, { label: string; cls: string }> = {
    0: { label: "לא נרשם", cls: "bg-white/[0.08] text-white/45" },
    1: { label: "כניסה", cls: "bg-indigo-500/15 text-indigo-300" },
    2: { label: "יציאה", cls: "bg-orange-500/20 text-orange-400" },
  };
  const info = map[state] ?? map[0];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${info.cls}`}>{info.label}</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-white/35">
      <AlertCircle size={36} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "employees", label: "עובדים", Icon: Users },
  { id: "departments", label: "מחלקות", Icon: Building2 },
  { id: "attendance", label: "נוכחות", Icon: Clock },
  { id: "locations", label: "אזורי דיווח", Icon: Globe },
  { id: "live-map", label: "מפה חיה", Icon: Activity },
  { id: "tasks", label: "משימות", Icon: CheckSquare },
  { id: "task-entries", label: "דיווח משימות", Icon: BarChart2 },
  { id: "reports", label: "דוחות", Icon: FileText },
  { id: "settings", label: "הגדרות", Icon: Settings },
] as const;
type TabId = (typeof TABS)[number]["id"];
type ReportType = "attendance" | "task-entries" | "summary" | "project-cost" | "locations";

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

  // ── Zones / Locations ──
  const [zones, setZones] = useState<MeckanoZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [zoneSyncMsg, setZoneSyncMsg] = useState<string | null>(null);
  const [zoneSyncPending, setZoneSyncPending] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", address: "", description: "", radius: "150" });
  const [addingZone, setAddingZone] = useState(false);
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);
  const [editZone, setEditZone] = useState<Record<string, Partial<MeckanoZone> & { assignedEmployeeIds: number[] }>>({});
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null);

  // ── Reports ──
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [reportFrom, setReportFrom] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [reportTo, setReportTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reportEmployeeId, setReportEmployeeId] = useState<string>("");
  const [reportDeptId, setReportDeptId] = useState<string>("");
  const [reportZoneId, setReportZoneId] = useState<string>("");
  const [reportAttendance, setReportAttendance] = useState<MeckanoAttendance[]>([]);
  const [reportTaskEntries, setReportTaskEntries] = useState<MeckanoTaskEntry[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportLocationsMode, setReportLocationsMode] = useState<"daily" | "monthly">("daily");
  const [reportDate, setReportDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

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

  const loadZones = useCallback(async () => {
    setZonesLoading(true); setZonesError(null);
    try {
      const res = await fetch("/api/meckano/zones");
      const data = await res.json() as { status: boolean; data?: MeckanoZone[]; error?: string };
      if (data.status && data.data) setZones(data.data);
      else setZonesError(data.error ?? "שגיאה בטעינת אזורים");
    } catch { setZonesError("שגיאת רשת"); }
    setZonesLoading(false);
  }, []);

  const deleteZone = async (id: string) => {
    await fetch(`/api/meckano/zones/${id}`, { method: "DELETE" });
    setZones(z => z.filter(x => x.id !== id));
  };

  const addZone = async () => {
    if (!newZone.name || !newZone.address) return;
    setAddingZone(true);
    try {
      const res = await fetch("/api/meckano/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newZone, radius: parseInt(newZone.radius) || 150 }),
      });
      const data = await res.json() as { status: boolean; data?: MeckanoZone };
      if (data.status && data.data) {
        setZones(z => [...z, data.data!]);
        setNewZone({ name: "", address: "", description: "", radius: "150" });
        setShowAddZone(false);
      }
    } finally { setAddingZone(false); }
  };

  const syncZonesToCrm = async () => {
    setZoneSyncPending(true); setZoneSyncMsg(null);
    try {
      const res = await fetch("/api/meckano/sync/zones-to-crm", { method: "POST" });
      const data = await res.json() as { synced?: number; message?: string; error?: string };
      if (res.ok) {
        setZoneSyncMsg(`✓ ${data.message ?? `סונכרנו ${data.synced} אזורים`}`);
        loadZones();
      } else setZoneSyncMsg(`שגיאה: ${data.error ?? "לא ידוע"}`);
    } catch { setZoneSyncMsg("שגיאת רשת"); }
    setZoneSyncPending(false);
  };

  // Auto-load on mount: employees, departments and zones needed everywhere
  useEffect(() => {
    if (!connected) return;
    if (employees.length === 0) loadEmployees();
    if (departments.length === 0) loadDepartments();
    if (zones.length === 0) loadZones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // Auto-load on tab switch
  useEffect(() => {
    if (!connected) return;
    if (activeTab === "attendance") loadAttendance();
    if (activeTab === "tasks" && tasks.length === 0) loadTasks();
    if (activeTab === "task-entries") loadTaskEntries();
    if (activeTab === "settings" && employees.length === 0) {
      setOverviewLoading(true);
      loadEmployees().finally(() => setOverviewLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, connected]);

  const saveZoneDetails = async (id: string) => {
    const edits = editZone[id];
    if (!edits) return;
    setSavingZoneId(id);
    try {
      const res = await fetch(`/api/meckano/zones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edits),
      });
      const data = await res.json() as { status: boolean; data?: MeckanoZone };
      if (data.status && data.data) {
        setZones(z => z.map(x => x.id === id ? { ...x, ...data.data } : x));
        setExpandedZoneId(null);
      }
    } finally { setSavingZoneId(null); }
  };

  const initEditZone = (zone: MeckanoZone) => {
    setEditZone(prev => ({
      ...prev,
      [zone.id]: {
        name: zone.name,
        address: zone.address,
        description: zone.description ?? "",
        radius: zone.radius,
        managerName: zone.managerName ?? "",
        startDate: zone.startDate ? zone.startDate.slice(0, 10) : "",
        endDate: zone.endDate ? zone.endDate.slice(0, 10) : "",
        budgetHours: zone.budgetHours ?? undefined,
        hourlyRate: zone.hourlyRate ?? undefined,
        projectNotes: zone.projectNotes ?? "",
        assignedEmployeeIds: zone.assignedEmployeeIds ?? [],
      },
    }));
    setExpandedZoneId(zone.id);
  };

  const toggleEmployeeInZone = (zoneId: string, empId: number) => {
    setEditZone(prev => {
      const cur = prev[zoneId]?.assignedEmployeeIds ?? [];
      return {
        ...prev,
        [zoneId]: {
          ...prev[zoneId],
          assignedEmployeeIds: cur.includes(empId) ? cur.filter(x => x !== empId) : [...cur, empId],
        },
      };
    });
  };

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

  const generateReport = useCallback(async () => {
    setReportLoading(true); setReportError(null); setReportGenerated(false);
    // For locations daily mode, use reportDate as both from and to
    const effectiveFrom = (reportType === "locations" && reportLocationsMode === "daily") ? reportDate : reportFrom;
    const effectiveTo   = (reportType === "locations" && reportLocationsMode === "daily") ? reportDate : reportTo;
    const from = Math.floor(new Date(effectiveFrom).getTime() / 1000);
    const to = Math.floor(new Date(effectiveTo + "T23:59:59").getTime() / 1000);
    const filterEmpIds = new Set<number>();
    if (reportEmployeeId) {
      filterEmpIds.add(parseInt(reportEmployeeId));
    } else if (reportDeptId) {
      employees.filter(e => e.activeState === 1 && String(e.departmentId) === reportDeptId).forEach(e => filterEmpIds.add(e.id));
    } else if (reportZoneId) {
      // Use employees assigned to the selected project/zone
      const selectedZone = zones.find(z => z.id === reportZoneId);
      if (selectedZone?.assignedEmployeeIds?.length) {
        selectedZone.assignedEmployeeIds.forEach(id => filterEmpIds.add(id));
      }
    }
    if (reportType === "attendance" || reportType === "summary" || reportType === "project-cost" || reportType === "locations") {
      const r = await meckanoFetch<MeckanoAttendance[]>("time-entry", { from: String(from), to: String(to) });
      if (r.status && r.data) {
        let data = r.data;
        if (filterEmpIds.size > 0) data = data.filter(row => filterEmpIds.has(row.userId));
        setReportAttendance(data);
      } else { setReportError(r.error ?? "שגיאה בטעינת נתונים"); }
    } else {
      const r = await meckanoFetch<MeckanoTaskEntry[]>("task-entry", { from: String(from), to: String(to) });
      if (r.status && r.data) {
        let data = r.data;
        if (filterEmpIds.size > 0) data = data.filter(row => filterEmpIds.has(row.userId));
        setReportTaskEntries(data);
      } else { setReportError(r.error ?? "שגיאה בטעינת נתונים"); }
    }
    setReportLoading(false);
    setReportGenerated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, reportLocationsMode, reportDate, reportFrom, reportTo, reportEmployeeId, reportDeptId, reportZoneId, employees, zones]);

  const exportCsv = () => {
    const zoneName = reportZoneId ? (zones.find(z => z.id === reportZoneId)?.name ?? "") : "";
    const periodLabel = (reportType === "locations" && reportLocationsMode === "daily") ? reportDate : `${reportFrom} – ${reportTo}`;
    const typeLabel = reportType === "attendance" ? "נוכחות" : reportType === "task-entries" ? "משימות" : reportType === "project-cost" ? "עלויות פרויקט" : reportType === "locations" ? `דוח מיקומים (${reportLocationsMode === "daily" ? "יומי" : "חודשי"})` : "סיכום שעות";
    const header = `# דוח מקאנו · ${typeLabel} · ${periodLabel}${zoneName ? ` · אזור: ${zoneName}` : ""}\n`;
    let body = "";
    if (reportType === "attendance") {
      body = "עובד,מס׳,תאריך,שעה,כניסה/יציאה\n";
      reportAttendance.forEach(row => {
        body += `"${row.userName ?? row.userId}","${row.workerTag ?? ""}","${row.dateStr ?? tsToDate(row.ts)}","${row.timeStr ?? tsToTime(row.ts)}","${row.isOut ? "יציאה" : "כניסה"}"\n`;
      });
    } else if (reportType === "summary") {
      body = "עובד,מס׳,ימי עבודה,שעות,רשומות\n";
      const byUser: Record<number, MeckanoAttendance[]> = {};
      reportAttendance.forEach(row => { if (!byUser[row.userId]) byUser[row.userId] = []; byUser[row.userId].push(row); });
      Object.values(byUser).forEach(rows => {
        const sorted = [...rows].sort((a, b) => a.ts - b.ts);
        const days = new Set(sorted.map(r => r.dateStr ?? tsToDate(r.ts))).size;
        let minutes = 0; let pendingIn: number | null = null;
        sorted.forEach(row => {
          if (!row.isOut && pendingIn === null) pendingIn = row.ts;
          else if (row.isOut && pendingIn !== null) { minutes += Math.round((row.ts - pendingIn) / 60); pendingIn = null; }
        });
        body += `"${sorted[0].userName ?? sorted[0].userId}","${sorted[0].workerTag ?? ""}","${days}","${(minutes / 60).toFixed(1)}","${sorted.length}"\n`;
      });
    } else if (reportType === "project-cost") {
      const selectedZone = reportZoneId ? zones.find(z => z.id === reportZoneId) : null;
      const rate = selectedZone?.hourlyRate ?? 0;
      body = "עובד,מס׳,ימי עבודה,שעות,תעריף (₪/ש׳),עלות (₪)\n";
      const byUser2: Record<number, MeckanoAttendance[]> = {};
      reportAttendance.forEach(row => { if (!byUser2[row.userId]) byUser2[row.userId] = []; byUser2[row.userId].push(row); });
      Object.values(byUser2).forEach(rows => {
        const sorted = [...rows].sort((a, b) => a.ts - b.ts);
        const days = new Set(sorted.map(r => r.dateStr ?? tsToDate(r.ts))).size;
        let minutes = 0; let pendingIn: number | null = null;
        sorted.forEach(row => {
          if (!row.isOut && pendingIn === null) pendingIn = row.ts;
          else if (row.isOut && pendingIn !== null) { minutes += Math.round((row.ts - pendingIn) / 60); pendingIn = null; }
        });
        const hrs = minutes / 60;
        body += `"${sorted[0].userName ?? sorted[0].userId}","${sorted[0].workerTag ?? ""}","${days}","${hrs.toFixed(1)}","${rate.toFixed(2)}","${(hrs * rate).toFixed(2)}"\n`;
      });
    } else if (reportType === "locations") {
      // Build empId→zone map
      const empZoneMap: Record<number, string> = {};
      zones.forEach(z => { (z.assignedEmployeeIds ?? []).forEach(eid => { if (!empZoneMap[eid]) empZoneMap[eid] = z.name; }); });
      body = "אזור/פרויקט,עובד,מס׳,תאריך,כניסה,יציאה,שעות\n";
      // Group by zone→employee→date
      const byZone: Record<string, Record<number, MeckanoAttendance[]>> = {};
      reportAttendance.forEach(row => {
        const zn = empZoneMap[row.userId] ?? "ללא אזור";
        if (!byZone[zn]) byZone[zn] = {};
        if (!byZone[zn][row.userId]) byZone[zn][row.userId] = [];
        byZone[zn][row.userId].push(row);
      });
      Object.entries(byZone).forEach(([zn, empMap]) => {
        Object.values(empMap).forEach(rows => {
          const sorted = [...rows].sort((a, b) => a.ts - b.ts);
          const byDay: Record<string, MeckanoAttendance[]> = {};
          sorted.forEach(r => { const d = r.dateStr ?? tsToDate(r.ts); if (!byDay[d]) byDay[d] = []; byDay[d].push(r); });
          Object.entries(byDay).forEach(([d, dayRows]) => {
            const ins = dayRows.filter(r => !r.isOut); const outs = dayRows.filter(r => r.isOut);
            const inTime = ins[0] ? (ins[0].timeStr ?? tsToTime(ins[0].ts)) : "";
            const outTime = outs[outs.length - 1] ? (outs[outs.length - 1].timeStr ?? tsToTime(outs[outs.length - 1].ts)) : "";
            let mins = 0; let pendingIn: number | null = null;
            dayRows.sort((a, b) => a.ts - b.ts).forEach(r => {
              if (!r.isOut && pendingIn === null) pendingIn = r.ts;
              else if (r.isOut && pendingIn !== null) { mins += Math.round((r.ts - pendingIn) / 60); pendingIn = null; }
            });
            body += `"${zn}","${sorted[0].userName ?? sorted[0].userId}","${sorted[0].workerTag ?? ""}","${d}","${inTime}","${outTime}","${(mins / 60).toFixed(2)}"\n`;
          });
        });
      });
    } else {
      body = "עובד,משימה,תאריך,משך (דק׳),הערה\n";
      reportTaskEntries.forEach(row => {
        body += `"${row.userName ?? row.userId}","${row.taskName ?? row.taskId}","${row.dateStr ?? tsToDate(row.ts)}","${row.duration ?? ""}","${row.note ?? ""}"\n`;
      });
    }
    const blob = new Blob(["\uFEFF" + header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `meckano-${reportType}-${periodLabel.replace(" – ", "-")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls = "rounded-xl border border-white/[0.10] bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20";
  // Only show active employees (activeState === 1)
  const activeEmployees = employees.filter(e => e.activeState === 1);
  const filtered = activeEmployees.filter(e => {
    const q = empSearch.toLowerCase();
    const name = `${e.firstName ?? ""} ${e.lastName ?? ""} ${e.email ?? ""} ${e.workerTag ?? ""}`.toLowerCase();
    return name.includes(q);
  });

  // ── Not connected ──
  if (!connected) {
    return (
      <div className="mx-auto max-w-lg py-12" dir="rtl">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0b14]">
          <div className="h-1 bg-indigo-600" />
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15">
              <Key size={28} className="text-indigo-400" />
            </div>
            <h1 className="mb-2 text-xl font-black text-white">חיבור מקאנו</h1>
            <p className="mb-6 text-sm leading-relaxed text-white/55">
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {pendingKey ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                חבר מקאנו
              </button>
            </form>
            {keyMsg && (
              <p className={`mt-3 text-sm ${keyMsg.ok ? "text-emerald-400" : "text-rose-400"}`}>{keyMsg.msg}</p>
            )}
            <p className="mt-4 text-xs text-white/35">
              ניתן גם{" "}
              <Link href="/dashboard/settings?tab=integrations" className="text-indigo-400 hover:underline">
                להגדיר בדף ההגדרות
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-white" dir="rtl">
      {/* Premium Header */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0b14] px-6 py-6 md:px-8">
        <div className="absolute inset-y-0 start-0 w-1.5 bg-indigo-600" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-[11px] font-bold text-indigo-300">
              <Clock size={11} /> מקאנו — ניהול נוכחות ומשימות
            </span>
            <h1 className="mt-2.5 flex items-center gap-2.5 text-2xl font-black tracking-tight text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-sm shadow-indigo-600/30">M</span>
              מקאנו
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={13} />
            מחובר ופעיל
          </div>
        </div>
      </section>

      {/* Tabs panel */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0b14]">
        <nav className="flex gap-0 overflow-x-auto border-b border-white/[0.08] px-2">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === id
                  ? "border-indigo-600 text-indigo-400"
                  : "border-transparent text-white/45 hover:border-white/35 hover:text-white/70"
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
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    placeholder="חיפוש עובד..."
                    className={`${inputCls} pr-9 w-full`}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={loadEmployees} disabled={empLoading} className="flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/65 transition hover:bg-white/[0.08] disabled:opacity-50">
                    <RefreshCw size={14} className={empLoading ? "animate-spin" : ""} /> רענון
                  </button>
                  <button onClick={syncToCrm} disabled={syncPending || !employees.length} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                    {syncPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    סנכרן עובדים ל-CRM
                  </button>
                </div>
              </div>

              {syncMsg && (
                <p className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${syncMsg.startsWith("✓") ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-rose-500/[0.08] border-rose-500/25 text-rose-300"}`}>
                  {syncMsg}
                </p>
              )}

              {empLoading ? <LoadingSpinner /> : empError ? (
                <div className="rounded-xl border border-red-100 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">{empError}</div>
              ) : filtered.length === 0 ? (
                <EmptyState message="לא נמצאו עובדים" />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] divide-y divide-white/[0.05]">
                  {filtered.map(emp => {
                    const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.workerTag || `#${emp.id}`;
                    const isOpen = empExpanded === emp.id;
                    return (
                      <div key={emp.id}>
                        <button
                          type="button"
                          onClick={() => setEmpExpanded(isOpen ? null : emp.id)}
                          className="flex w-full items-center gap-4 px-5 py-4 text-right transition hover:bg-white/[0.03]"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-black text-indigo-300">
                            {name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">{name}</p>
                            <p className="truncate text-xs text-white/45">{emp.email ?? "—"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {emp.department && (
                              <span className="hidden rounded-lg bg-white/[0.08] px-2 py-1 text-xs text-white/45 sm:inline">
                                {emp.department.name}
                              </span>
                            )}
                            {/* Real-time status: green dot if checked in within last 24h */}
                            {(() => {
                              const now = Date.now() / 1000;
                              const isIn = emp.lastCheckState === 1 && emp.lastCheckTime && now - emp.lastCheckTime < 86400;
                              const isOut = emp.lastCheckState === 2;
                              return (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                                  isIn ? "bg-emerald-500/20 text-emerald-400" : isOut ? "bg-orange-500/20 text-orange-400" : "bg-white/[0.08] text-white/35"
                                }`}>
                                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${isIn ? "bg-emerald-500/15 animate-pulse" : isOut ? "bg-orange-400" : "bg-white/25"}`} />
                                  {isIn ? "בעבודה" : isOut ? "יצא" : "לא פעיל"}
                                </span>
                              );
                            })()}
                            {isOpen ? <ChevronUp size={14} className="text-white/35" /> : <ChevronDown size={14} className="text-white/35" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-white/[0.07] bg-white/[0.03] px-5 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                              {emp.email && (
                                <div className="flex items-center gap-2 text-white/55">
                                  <Mail size={13} className="text-indigo-400 shrink-0" />
                                  <span className="truncate" dir="ltr">{emp.email}</span>
                                </div>
                              )}
                              {emp.phone && (
                                <div className="flex items-center gap-2 text-white/55">
                                  <Phone size={13} className="text-emerald-400 shrink-0" />
                                  {emp.phone}
                                </div>
                              )}
                              {emp.idNum && (
                                <div className="flex items-center gap-2 text-white/55">
                                  <Hash size={13} className="text-white/35 shrink-0" />
                                  ת.ז: {emp.idNum}
                                </div>
                              )}
                              {emp.city && (
                                <div className="flex items-center gap-2 text-white/55">
                                  <ArrowRight size={13} className="text-white/35 shrink-0" />
                                  עיר: {emp.city}
                                </div>
                              )}
                              {emp.role && (
                                <div className="flex items-center gap-2 text-white/55">
                                  <Users size={13} className="text-white/35 shrink-0" />
                                  תפקיד: {emp.role}
                                </div>
                              )}
                              {emp.employedFrom_dt && (
                                <div className="flex items-center gap-2 text-white/55">
                                  <CalendarDays size={13} className="text-white/35 shrink-0" />
                                  תחילת עבודה: {emp.employedFrom_dt}
                                </div>
                              )}
                              {emp.hasCar && (
                                <div className="flex items-center gap-2 text-white/55">
                                  <Car size={13} className="text-white/35 shrink-0" />
                                  יש רכב
                                </div>
                              )}
                              {emp.lastCheckTime && (
                                <div className="flex items-center gap-2 text-white/55">
                                  <Clock size={13} className="text-white/35 shrink-0" />
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
              <p className="text-left text-xs text-white/35">{filtered.length} עובדים פעילים מוצגים (מתוך {employees.length} סה״כ)</p>
            </div>
          )}

          {/* ── DEPARTMENTS ── */}
          {activeTab === "departments" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={loadDepartments} disabled={deptLoading} className="flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/65 transition hover:bg-white/[0.08] disabled:opacity-50">
                  <RefreshCw size={14} className={deptLoading ? "animate-spin" : ""} /> רענון
                </button>
              </div>
              {deptLoading ? <LoadingSpinner /> : deptError ? (
                <div className="rounded-xl border border-red-100 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">{deptError}</div>
              ) : departments.length === 0 ? (
                <EmptyState message="לא נמצאו מחלקות" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map(dept => (
                    <div key={dept.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-black text-indigo-300">
                          {dept.number ?? "—"}
                        </div>
                        <p className="text-sm font-bold text-white">{dept.name}</p>
                      </div>
                      <p className="text-xs text-white/45">ID: {dept.id}</p>
                      {dept.usersCount !== undefined && (
                        <p className="mt-1 text-xs text-white/45">{dept.usersCount} עובדים</p>
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
                  <label className="mb-1 block text-xs font-bold text-white/55">מתאריך</label>
                  <input type="date" value={attFrom} onChange={e => setAttFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/55">עד תאריך</label>
                  <input type="date" value={attTo} onChange={e => setAttTo(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/55">סינון עובד</label>
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
                <button onClick={loadAttendance} disabled={attLoading} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                  <RefreshCw size={14} className={attLoading ? "animate-spin" : ""} /> טעינה
                </button>
              </div>

              {attLoading ? <LoadingSpinner /> : attError ? (
                <div className="rounded-xl border border-red-100 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">{attError}</div>
              ) : attendance.length === 0 ? (
                <EmptyState message="אין רשומות נוכחות בטווח שנבחר" />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/[0.07] bg-white/[0.04]">
                      <tr>
                        {["עובד", "מספר", "תאריך", "שעה", "כניסה/יציאה"].map(h => (
                          <th key={h} className="px-4 py-3 text-right text-xs font-bold text-white/45">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {(attUserId ? attendance.filter(r => String(r.userId) === attUserId) : attendance).map(row => (
                        <tr key={row.id} className="transition hover:bg-white/[0.03]">
                          <td className="px-4 py-3 font-medium text-white">{row.userName ?? `#${row.userId}`}</td>
                          <td className="px-4 py-3 font-mono text-xs text-white/45">{row.workerTag ?? "—"}</td>
                          <td className="px-4 py-3 text-white/55">{row.dateStr ?? tsToDate(row.ts)}</td>
                          <td className="px-4 py-3 text-white/55" dir="ltr">{row.timeStr ?? tsToTime(row.ts)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                              row.isOut ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400"
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
              <p className="text-left text-xs text-white/35">
                {attUserId ? attendance.filter(r => String(r.userId) === attUserId).length : attendance.length} רשומות
              </p>
            </div>
          )}

          {/* ── LOCATIONS / AUTHORIZED ZONES ── */}
          {activeTab === "locations" && (
            <div className="space-y-4" dir="rtl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white">פרויקטים ואזורי דיווח</h3>
                  <p className="mt-0.5 text-xs text-white/45">
                    הגדר פרטי פרויקט, שייך עובדים, וסנכרן ל-CRM ו-ERP
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadZones} disabled={zonesLoading} className="flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/65 transition hover:bg-white/[0.08] disabled:opacity-50">
                    <RefreshCw size={14} className={zonesLoading ? "animate-spin" : ""} /> רענון
                  </button>
                  <button onClick={syncZonesToCrm} disabled={zoneSyncPending || zones.length === 0} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                    {zoneSyncPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    סנכרן ל-CRM ופרויקטים
                  </button>
                  <button onClick={() => setShowAddZone(v => !v)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
                    <Hash size={14} /> הוסף פרויקט
                  </button>
                </div>
              </div>

              {zoneSyncMsg && (
                <p className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${zoneSyncMsg.startsWith("✓") ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-rose-500/[0.08] border-rose-500/25 text-rose-300"}`}>
                  {zoneSyncMsg}
                </p>
              )}

              {/* Add Zone Form */}
              {showAddZone && (
                <div className="space-y-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.08] p-5">
                  <h4 className="text-sm font-black text-white">הוספת פרויקט / אזור דיווח</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-white/55">שם הפרויקט *</label>
                      <input value={newZone.name} onChange={e => setNewZone(z => ({ ...z, name: e.target.value }))} placeholder='שנלר, תנובה, ממילא...' className={inputCls + " w-full"} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-white/55">כתובת מלאה *</label>
                      <input value={newZone.address} onChange={e => setNewZone(z => ({ ...z, address: e.target.value }))} placeholder="שנלר, ירושלים" className={inputCls + " w-full"} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-white/55">תיאור</label>
                      <input value={newZone.description} onChange={e => setNewZone(z => ({ ...z, description: e.target.value }))} placeholder="תיאור קצר" className={inputCls + " w-full"} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-white/55">רדיוס (מטרים)</label>
                      <input type="number" value={newZone.radius} onChange={e => setNewZone(z => ({ ...z, radius: e.target.value }))} min={10} max={1000} className={inputCls + " w-full"} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addZone} disabled={addingZone || !newZone.name || !newZone.address} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                      {addingZone ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} שמור
                    </button>
                    <button onClick={() => setShowAddZone(false)} className="rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-2 text-sm font-bold text-white/65 transition hover:bg-white/[0.08]">ביטול</button>
                  </div>
                </div>
              )}

              {/* Info banner */}
              <div className="rounded-xl border border-amber-100 bg-amber-500/15 px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
                <Info size={13} className="mt-0.5 shrink-0" />
                <span>לחץ על פרויקט להגדרת פרטים: מנהל, תאריכים, תקציב שעות ושיוך עובדים. הדוח לפי פרויקט מחשב שעות לפי העובדים המשויכים.</span>
              </div>

              {zonesLoading ? <LoadingSpinner /> : zonesError ? (
                <div className="rounded-xl border border-red-100 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">{zonesError}</div>
              ) : zones.length === 0 ? (
                <EmptyState message="אין פרויקטים — הוסף את אתרי העבודה שלך" />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] divide-y divide-white/[0.05]">
                  {zones.map(zone => {
                    const isExpanded = expandedZoneId === zone.id;
                    const edit = editZone[zone.id];
                    const assignedCount = zone.assignedEmployeeIds?.length ?? 0;
                    return (
                      <div key={zone.id}>
                        {/* Header row */}
                        <button
                          type="button"
                          onClick={() => isExpanded ? setExpandedZoneId(null) : initEditZone(zone)}
                          className="flex w-full items-center gap-4 px-5 py-4 text-right transition hover:bg-white/[0.03]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
                            <Globe size={18} className="text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-black text-white">{zone.name}</p>
                              {zone.syncedToCrm && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 text-indigo-300 px-2 py-0.5 text-xs font-bold">
                                  <CheckCircle2 size={10} /> CRM
                                </span>
                              )}
                              {assignedCount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-300">
                                  <Users size={10} /> {assignedCount} עובדים
                                </span>
                              )}
                              {zone.managerName && (
                                <span className="text-xs text-white/45">{zone.managerName}</span>
                              )}
                              {!zone.isActive && <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs font-bold text-white/45">לא פעיל</span>}
                            </div>
                            <p className="mt-0.5 text-xs text-white/45">{zone.address}</p>
                            {(zone.startDate || zone.endDate) && (
                              <p className="text-xs text-white/35">
                                {zone.startDate ? new Date(zone.startDate).toLocaleDateString("he-IL") : ""}
                                {zone.endDate ? ` ← ${new Date(zone.endDate).toLocaleDateString("he-IL")}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {zone.budgetHours && (
                              <div className="text-right">
                                <p className="text-sm font-black text-indigo-400">{zone.budgetHours}ש׳</p>
                                <p className="text-xs text-white/35">תקציב</p>
                              </div>
                            )}
                            <div className="text-right">
                              <p className="text-sm font-bold text-white/65">{zone.radius}מ׳</p>
                              <p className="text-xs text-white/35">רדיוס</p>
                            </div>
                            {isExpanded ? <ChevronUp size={15} className="text-white/35" /> : <ChevronDown size={15} className="text-white/35" />}
                          </div>
                        </button>

                        {/* Expanded: project detail form */}
                        {isExpanded && edit && (
                          <div className="space-y-5 border-t border-white/[0.07] bg-white/[0.03] p-5">
                            <h4 className="flex items-center gap-2 text-sm font-black text-white">
                              <Briefcase size={14} className="text-indigo-400" /> פרטי פרויקט: {zone.name}
                            </h4>

                            {/* Basic fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">שם הפרויקט *</label>
                                <input
                                  value={edit.name ?? ""}
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], name: e.target.value } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">כתובת</label>
                                <input
                                  value={edit.address ?? ""}
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], address: e.target.value } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">מנהל פרויקט</label>
                                <input
                                  value={edit.managerName ?? ""}
                                  placeholder="שם המנהל"
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], managerName: e.target.value } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">רדיוס (מטרים)</label>
                                <input
                                  type="number"
                                  value={edit.radius ?? 150}
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], radius: parseInt(e.target.value) || 150 } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">תאריך התחלה</label>
                                <input
                                  type="date"
                                  value={typeof edit.startDate === "string" ? edit.startDate.slice(0, 10) : ""}
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], startDate: e.target.value } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">תאריך סיום מתוכנן</label>
                                <input
                                  type="date"
                                  value={typeof edit.endDate === "string" ? edit.endDate.slice(0, 10) : ""}
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], endDate: e.target.value } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">תקציב שעות</label>
                                <input
                                  type="number"
                                  value={edit.budgetHours ?? ""}
                                  placeholder="0"
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], budgetHours: parseFloat(e.target.value) || undefined } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">תעריף שעתי (₪)</label>
                                <input
                                  type="number"
                                  value={edit.hourlyRate ?? ""}
                                  placeholder="0.00"
                                  step="0.01"
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], hourlyRate: parseFloat(e.target.value) || undefined } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-white/55">תיאור</label>
                                <input
                                  value={edit.description ?? ""}
                                  onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], description: e.target.value } }))}
                                  className={inputCls + " w-full"}
                                />
                              </div>
                            </div>

                            {/* Notes */}
                            <div>
                              <label className="mb-1 block text-xs font-bold text-white/55">הערות פרויקט</label>
                              <textarea
                                rows={3}
                                value={edit.projectNotes ?? ""}
                                onChange={e => setEditZone(p => ({ ...p, [zone.id]: { ...p[zone.id], projectNotes: e.target.value } }))}
                                className={inputCls + " w-full resize-none"}
                                placeholder="הערות חופשיות..."
                              />
                            </div>

                            {/* Employee assignment */}
                            <div>
                              <label className="mb-2 block text-xs font-bold text-white/55">שיוך עובדים לפרויקט</label>
                              {activeEmployees.length === 0 ? (
                                <p className="text-xs text-white/35">טוען עובדים...</p>
                              ) : (
                                <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-white/[0.10] bg-white/[0.04] p-3 sm:grid-cols-3 lg:grid-cols-4">
                                  {activeEmployees.map(emp => {
                                    const empName = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.workerTag || `#${emp.id}`;
                                    const isAssigned = (edit.assignedEmployeeIds ?? []).includes(emp.id);
                                    return (
                                      <button
                                        key={emp.id}
                                        type="button"
                                        onClick={() => toggleEmployeeInZone(zone.id, emp.id)}
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                          isAssigned
                                            ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                                            : "border-white/[0.10] text-white/55 hover:bg-white/[0.05]"
                                        }`}
                                      >
                                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                          isAssigned ? "bg-indigo-500/15 text-white" : "bg-white/[0.08] text-white/45"
                                        }`}>{empName.charAt(0)}</span>
                                        <span className="truncate">{empName}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              <p className="mt-1 text-xs text-white/35">{(edit.assignedEmployeeIds ?? []).length} עובדים משויכים</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => saveZoneDetails(zone.id)} disabled={savingZoneId === zone.id}
                                className="flex items-center gap-2 rounded-xl bg-indigo-500/15 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50"
                              >
                                {savingZoneId === zone.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} שמור פרטים
                              </button>
                              <button
                                onClick={() => {
                                  const z = zones.find(x => x.id === zone.id);
                                  if (!z) return;
                                  setReportZoneId(zone.id);
                                  if (z.startDate) setReportFrom(z.startDate.slice(0, 10));
                                  if (z.endDate) setReportTo(z.endDate.slice(0, 10));
                                  setReportType("summary");
                                  setReportGenerated(false);
                                  setActiveTab("reports");
                                }}
                                className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-5 py-2.5 text-sm font-bold text-indigo-300 hover:bg-indigo-500/25 transition"
                              >
                                <BarChart2 size={14} /> הפק דוח לפרויקט
                              </button>
                              <button
                                onClick={() => { if (confirm("למחוק?")) deleteZone(zone.id); }}
                                className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-red-100 transition"
                              >
                                <Trash2 size={14} /> מחק
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-left text-xs text-white/35">{zones.filter(z => z.isActive).length} פרויקטים פעילים</p>
            </div>
          )}

          {/* ── LIVE MAP ── */}
          {activeTab === "live-map" && (
            <div className="space-y-4" dir="rtl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-black text-white">
                    <Activity size={16} className="text-emerald-400" /> מפה חיה
                  </h3>
                  <p className="mt-0.5 text-xs text-white/45">
                    אזורי דיווח על המפה + סטטוס נוכחות עובדים בזמן אמת
                  </p>
                </div>
                <button onClick={() => { loadEmployees(); loadZones(); }} disabled={empLoading || zonesLoading} className="flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/65 transition hover:bg-white/[0.08] disabled:opacity-50">
                  <RefreshCw size={14} className={empLoading || zonesLoading ? "animate-spin" : ""} /> רענן
                </button>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-white/55">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500/15" />
                  בעבודה ({activeEmployees.filter(e => e.lastCheckState === 1).length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full bg-white/30" />
                  לא פעיל ({activeEmployees.filter(e => e.lastCheckState !== 1).length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-5 w-5 rounded-full border-2 border-indigo-500/40 bg-indigo-100" />
                  אזור דיווח ({zones.filter(z => z.isActive).length})
                </span>
              </div>

              {/* CSS for leaflet */}
              <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

              {empLoading || zonesLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
                  <MeckanoMap
                    zones={zones}
                    activeEmployees={activeEmployees.map(e => ({
                      id: e.id,
                      name: [e.firstName, e.lastName].filter(Boolean).join(" ") || e.workerTag || `#${e.id}`,
                      workerTag: e.workerTag,
                      lastCheckState: e.lastCheckState ?? 0,
                      lastCheckTime: e.lastCheckTime ?? null,
                    }))}
                  />
                </div>
              )}

              {/* Employee list overlay */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {activeEmployees.map(emp => {
                  const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.workerTag || `#${emp.id}`;
                  const now = Date.now() / 1000;
                  const isIn = emp.lastCheckState === 1 && emp.lastCheckTime && now - emp.lastCheckTime < 86400;
                  return (
                    <div key={emp.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isIn ? "border-emerald-500/25 bg-emerald-500/[0.08]" : "border-white/[0.08] bg-white/[0.03]"}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black text-sm text-white ${isIn ? "bg-emerald-500/15" : "bg-white/25"}`}>
                        {name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-white">{name}</p>
                        <p className="text-xs text-white/45">
                          {isIn
                            ? `בעבודה מ-${emp.lastCheckTime ? tsToTime(emp.lastCheckTime) : "—"}`
                            : emp.lastCheckState === 2
                            ? `יצא ב-${emp.lastCheckTime ? tsToTime(emp.lastCheckTime) : "—"}`
                            : "לא מחותם"}
                        </p>
                      </div>
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${isIn ? "bg-emerald-500/15 animate-pulse" : "bg-white/25"}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TASKS ── */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={loadTasks} disabled={tasksLoading} className="flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/65 transition hover:bg-white/[0.08] disabled:opacity-50">
                  <RefreshCw size={14} className={tasksLoading ? "animate-spin" : ""} /> רענון
                </button>
              </div>
              {tasksLoading ? <LoadingSpinner /> : tasksError ? (
                <div className="rounded-xl border border-red-100 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">{tasksError}</div>
              ) : tasks.length === 0 ? (
                <EmptyState message="לא נמצאו משימות" />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] divide-y divide-white/[0.05]">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-400 font-black text-xs">
                        {task.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{task.name}</p>
                        {task.code && <p className="text-xs text-white/45">קוד: {task.code}</p>}
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
                  <label className="mb-1 block text-xs font-bold text-white/55">מתאריך</label>
                  <input type="date" value={teFrom} onChange={e => setTeFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/55">עד תאריך</label>
                  <input type="date" value={teTo} onChange={e => setTeTo(e.target.value)} className={inputCls} />
                </div>
                <button onClick={loadTaskEntries} disabled={teLoading} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                  <RefreshCw size={14} className={teLoading ? "animate-spin" : ""} /> טעינה
                </button>
              </div>
              {teLoading ? <LoadingSpinner /> : teError ? (
                <div className="rounded-xl border border-red-100 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">{teError}</div>
              ) : taskEntries.length === 0 ? (
                <EmptyState message="אין דיווחי משימות בטווח שנבחר" />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/[0.07] bg-white/[0.04]">
                      <tr>
                        {["עובד", "משימה", "תאריך", "משך (דק׳)", "הערה"].map(h => (
                          <th key={h} className="px-4 py-3 text-right text-xs font-bold text-white/45">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {taskEntries.map(entry => (
                        <tr key={entry.id} className="transition hover:bg-white/[0.03]">
                          <td className="px-4 py-3 font-medium text-white">{entry.userName ?? `#${entry.userId}`}</td>
                          <td className="px-4 py-3 text-white/65">{entry.taskName ?? `#${entry.taskId}`}</td>
                          <td className="px-4 py-3 text-white/55">{entry.dateStr ?? tsToDate(entry.ts)}</td>
                          <td className="px-4 py-3 font-mono text-white/55">{entry.duration ?? "—"}</td>
                          <td className="max-w-[180px] truncate px-4 py-3 text-white/45">{entry.note ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-left text-xs text-white/35">{taskEntries.length} רשומות</p>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === "reports" && (
            <div className="space-y-5" dir="rtl">
              <div>
                <h3 className="text-base font-black text-white">מחולל דוחות</h3>
                <p className="mt-0.5 text-xs text-white/45">הפק דוחות נוכחות, שעות ומשימות לפי עובד, מחלקה ואתר</p>
              </div>

              {/* Filter card */}
              <div className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-5">
                {/* Report type selection */}
                <div>
                  <p className="mb-2 text-xs font-black text-white/55">סוג דוח</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      { id: "attendance" as ReportType, label: "נוכחות", desc: "כניסות ויציאות לפי יום" },
                      { id: "summary" as ReportType, label: "סיכום שעות", desc: "שעות מחושבות לפי עובד" },
                      { id: "task-entries" as ReportType, label: "דיווח משימות", desc: "דיווח שעות לפי משימה" },
                      { id: "project-cost" as ReportType, label: "עלויות פרויקט", desc: "שעות × תעריף לפי עובד" },
                      { id: "locations" as ReportType, label: "דוח מיקומים", desc: "נוכחות מקובצת לפי אזור" },
                    ]).map(({ id, label, desc }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setReportType(id); setReportGenerated(false); }}
                        className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-right transition ${
                          reportType === id ? "border-indigo-500/60 bg-indigo-500/15" : "border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.08]"
                        }`}
                      >
                        <span className={`text-sm font-black ${reportType === id ? "text-indigo-300" : "text-white"}`}>{label}</span>
                        <span className={`text-xs ${reportType === id ? "text-indigo-500" : "text-white/35"}`}>{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily/Monthly toggle for locations report */}
                {reportType === "locations" && (
                  <div>
                    <p className="mb-2 text-xs font-black text-white/55">תצוגה</p>
                    <div className="inline-flex overflow-hidden rounded-xl border border-white/[0.10] bg-[#0d0e1c]">
                      {(["daily", "monthly"] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => { setReportLocationsMode(mode); setReportGenerated(false); }}
                          className={`px-5 py-2 text-xs font-black transition ${
                            reportLocationsMode === mode ? "bg-indigo-500/15 text-white" : "text-white/45 hover:bg-white/[0.08]"
                          }`}
                        >
                          {mode === "daily" ? "יומי" : "חודשי"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date range */}
                {reportType === "locations" && reportLocationsMode === "daily" ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-white/55">תאריך</label>
                      <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className={inputCls} />
                    </div>
                    <div className="flex flex-wrap gap-2 items-end pb-0.5">
                      <button type="button" onClick={() => { const d = new Date(); setReportDate(d.toISOString().slice(0, 10)); setReportGenerated(false); }} className="rounded-xl border border-white/[0.10] bg-[#1e2035] px-3 py-2 text-xs font-bold text-white/65 transition hover:border-indigo-500/50 hover:bg-indigo-500/15 hover:text-indigo-300">היום</button>
                      <button type="button" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 1); setReportDate(d.toISOString().slice(0, 10)); setReportGenerated(false); }} className="rounded-xl border border-white/[0.10] bg-[#1e2035] px-3 py-2 text-xs font-bold text-white/65 transition hover:border-indigo-500/50 hover:bg-indigo-500/15 hover:text-indigo-300">אתמול</button>
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/55">מתאריך</label>
                    <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className={inputCls + " w-full"} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/55">עד תאריך</label>
                    <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className={inputCls + " w-full"} />
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap gap-2 items-end pb-0.5">
                    {([{ label: "שבוע", days: 7 }, { label: "חודש", days: 30 }, { label: "רבעון", days: 90 }]).map(({ label, days }) => (
                      <button
                        key={days} type="button"
                        onClick={() => {
                          const to = new Date(); const from = new Date();
                          from.setDate(from.getDate() - days);
                          setReportTo(to.toISOString().slice(0, 10));
                          setReportFrom(from.toISOString().slice(0, 10));
                        }}
                        className="rounded-xl border border-white/[0.10] bg-[#1e2035] px-3 py-2 text-xs font-bold text-white/65 transition hover:border-indigo-500/50 hover:bg-indigo-500/15 hover:text-indigo-300"
                      >{label}</button>
                    ))}
                  </div>
                </div>
                )}

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/55">עובד</label>
                    <select value={reportEmployeeId} onChange={e => setReportEmployeeId(e.target.value)} className={inputCls + " w-full"}>
                      <option value="">כל העובדים הפעילים ({activeEmployees.length})</option>
                      {activeEmployees.map(e => (
                        <option key={e.id} value={String(e.id)}>
                          {[e.firstName, e.lastName].filter(Boolean).join(" ") || e.workerTag || `#${e.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/55">מחלקה</label>
                    <select value={reportDeptId} onChange={e => setReportDeptId(e.target.value)} className={inputCls + " w-full"}>
                      <option value="">כל המחלקות</option>
                      {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-white/55">אזור / פרויקט</label>
                    <select value={reportZoneId} onChange={e => setReportZoneId(e.target.value)} className={inputCls + " w-full"}>
                      <option value="">כל האזורים</option>
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>
                          {z.name}{z.assignedEmployeeIds?.length ? ` (${z.assignedEmployeeIds.length} עובדים)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button" onClick={generateReport} disabled={reportLoading}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {reportLoading ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
                    הפק דוח
                  </button>
                  {reportGenerated && (reportAttendance.length > 0 || reportTaskEntries.length > 0) && (
                    <button
                      type="button" onClick={exportCsv}
                      className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-2.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/25 transition"
                    >
                      <Download size={14} /> ייצוא CSV
                    </button>
                  )}
                </div>
              </div>

              {reportError && (
                <div className="rounded-xl border border-red-100 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-300">{reportError}</div>
              )}

              {/* Zone context */}
              {reportZoneId && (() => {
                const selectedZone = zones.find(z => z.id === reportZoneId);
                if (!selectedZone) return null;
                const assignedEmps = activeEmployees.filter(e => selectedZone.assignedEmployeeIds?.includes(e.id));
                return (
                  <div className="space-y-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.08] p-4">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="shrink-0 text-indigo-400" />
                      <span className="text-sm font-black text-white">{selectedZone.name}</span>
                      {selectedZone.syncedToCrm && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-300">CRM</span>}
                    </div>
                    <p className="text-xs text-indigo-400">{selectedZone.address}</p>
                    {selectedZone.managerName && <p className="text-xs text-indigo-300"><strong>מנהל:</strong> {selectedZone.managerName}</p>}
                    {(selectedZone.startDate || selectedZone.endDate) && (
                      <p className="text-xs text-indigo-300">
                        {selectedZone.startDate ? new Date(selectedZone.startDate).toLocaleDateString("he-IL") : ""}
                        {selectedZone.endDate ? ` ← ${new Date(selectedZone.endDate).toLocaleDateString("he-IL")}` : ""}
                      </p>
                    )}
                    {assignedEmps.length > 0 ? (
                      <div>
                        <p className="mb-1 text-xs font-bold text-indigo-800">עובדים משויכים ({assignedEmps.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {assignedEmps.map(e => (
                            <span key={e.id} className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-300">
                              {[e.firstName, e.lastName].filter(Boolean).join(" ") || e.workerTag || `#${e.id}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-400">לא שויכו עובדים לפרויקט זה — הדוח יציג את כל העובדים. שייך עובדים בלשונית &quot;פרויקטים&quot;.</p>
                    )}
                  </div>
                );
              })()}

              {/* Results */}
              {reportLoading ? (
                <LoadingSpinner />
              ) : reportGenerated && reportType === "attendance" && reportAttendance.length === 0 ? (
                <EmptyState message="אין נתוני נוכחות בטווח שנבחר" />
              ) : reportGenerated && reportType === "task-entries" && reportTaskEntries.length === 0 ? (
                <EmptyState message="אין דיווחי משימות בטווח שנבחר" />
              ) : reportGenerated && reportType === "summary" && reportAttendance.length === 0 ? (
                <EmptyState message="אין נתוני נוכחות לסיכום" />
              ) : reportGenerated && reportType === "attendance" && reportAttendance.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-white/45">{reportAttendance.length} רשומות נוכחות</p>
                  <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                    <table className="w-full text-sm">
                      <thead className="border-b border-white/[0.07] bg-white/[0.04]">
                        <tr>{["עובד", "מס׳", "תאריך", "שעה", "כניסה/יציאה"].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-bold text-white/45">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.07]">
                        {reportAttendance.map(row => (
                          <tr key={row.id} className="transition hover:bg-white/[0.03]">
                            <td className="px-4 py-3 font-medium text-white">{row.userName ?? `#${row.userId}`}</td>
                            <td className="px-4 py-3 font-mono text-xs text-white/45">{row.workerTag ?? "—"}</td>
                            <td className="px-4 py-3 text-white/55">{row.dateStr ?? tsToDate(row.ts)}</td>
                            <td className="px-4 py-3 text-white/55" dir="ltr">{row.timeStr ?? tsToTime(row.ts)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                row.isOut ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400"
                              }`}>{row.isOut ? "יציאה" : "כניסה"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : reportGenerated && reportType === "task-entries" && reportTaskEntries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-white/45">{reportTaskEntries.length} רשומות</p>
                  <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                    <table className="w-full text-sm">
                      <thead className="border-b border-white/[0.07] bg-white/[0.04]">
                        <tr>{["עובד", "משימה", "תאריך", "משך (דק׳)", "הערה"].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-bold text-white/45">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.07]">
                        {reportTaskEntries.map(entry => (
                          <tr key={entry.id} className="transition hover:bg-white/[0.03]">
                            <td className="px-4 py-3 font-medium text-white">{entry.userName ?? `#${entry.userId}`}</td>
                            <td className="px-4 py-3 text-white/65">{entry.taskName ?? `#${entry.taskId}`}</td>
                            <td className="px-4 py-3 text-white/55">{entry.dateStr ?? tsToDate(entry.ts)}</td>
                            <td className="px-4 py-3 font-mono text-white/55">{entry.duration ?? "—"}</td>
                            <td className="max-w-[180px] truncate px-4 py-3 text-white/45">{entry.note ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : reportGenerated && reportType === "summary" && reportAttendance.length > 0 ? (
                (() => {
                  const byUser: Record<number, MeckanoAttendance[]> = {};
                  reportAttendance.forEach(row => { if (!byUser[row.userId]) byUser[row.userId] = []; byUser[row.userId].push(row); });
                  const summaryRows = Object.values(byUser).map(rows => {
                    const sorted = [...rows].sort((a, b) => a.ts - b.ts);
                    const name = sorted[0].userName ?? `#${sorted[0].userId}`;
                    const tag = sorted[0].workerTag ?? "";
                    const days = new Set(sorted.map(r => r.dateStr ?? tsToDate(r.ts))).size;
                    let minutes = 0; let pendingIn: number | null = null;
                    sorted.forEach(row => {
                      if (!row.isOut && pendingIn === null) pendingIn = row.ts;
                      else if (row.isOut && pendingIn !== null) { minutes += Math.round((row.ts - pendingIn) / 60); pendingIn = null; }
                    });
                    return { userId: sorted[0].userId, name, tag, days, hours: (minutes / 60).toFixed(1), entries: sorted.length };
                  }).sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));
                  return (
                    <div className="space-y-2">
                      <p className="text-xs text-white/45">סיכום {summaryRows.length} עובדים · {reportFrom} עד {reportTo}</p>
                      <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                        <table className="w-full text-sm">
                          <thead className="border-b border-white/[0.07] bg-white/[0.04]">
                            <tr>{["עובד", "מס׳", "ימי עבודה", "שעות", "רשומות"].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-bold text-white/45">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.07]">
                            {summaryRows.map(row => (
                              <tr key={row.userId} className="transition hover:bg-white/[0.03]">
                                <td className="px-4 py-3 font-bold text-white">{row.name}</td>
                                <td className="px-4 py-3 font-mono text-xs text-white/45">{row.tag}</td>
                                <td className="px-4 py-3 text-white/65">{row.days}</td>
                                <td className="px-4 py-3 text-lg font-black text-indigo-400">{row.hours}</td>
                                <td className="px-4 py-3 text-white/45">{row.entries}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
              ) : reportGenerated && reportType === "project-cost" && reportAttendance.length === 0 ? (
                <EmptyState message="אין נתוני נוכחות לחישוב עלויות" />
              ) : reportGenerated && reportType === "project-cost" && reportAttendance.length > 0 ? (
                (() => {
                  const selectedZone = reportZoneId ? zones.find(z => z.id === reportZoneId) : null;
                  const rate = selectedZone?.hourlyRate ?? 0;
                  const byUser: Record<number, MeckanoAttendance[]> = {};
                  reportAttendance.forEach(row => { if (!byUser[row.userId]) byUser[row.userId] = []; byUser[row.userId].push(row); });
                  const costRows = Object.values(byUser).map(rows => {
                    const sorted = [...rows].sort((a, b) => a.ts - b.ts);
                    const name = sorted[0].userName ?? `#${sorted[0].userId}`;
                    const tag = sorted[0].workerTag ?? "";
                    const days = new Set(sorted.map(r => r.dateStr ?? tsToDate(r.ts))).size;
                    let minutes = 0; let pendingIn: number | null = null;
                    sorted.forEach(row => {
                      if (!row.isOut && pendingIn === null) pendingIn = row.ts;
                      else if (row.isOut && pendingIn !== null) { minutes += Math.round((row.ts - pendingIn) / 60); pendingIn = null; }
                    });
                    const hours = minutes / 60;
                    const cost = hours * rate;
                    return { userId: sorted[0].userId, name, tag, days, hours, cost };
                  }).sort((a, b) => b.cost - a.cost);
                  const totalHours = costRows.reduce((s, r) => s + r.hours, 0);
                  const totalCost = costRows.reduce((s, r) => s + r.cost, 0);
                  return (
                    <div className="space-y-4">
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-4 text-center">
                          <p className="text-2xl font-black text-white">{costRows.length}</p>
                          <p className="mt-0.5 text-xs text-white/45">עובדים</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-4 text-center">
                          <p className="text-2xl font-black text-indigo-400">{totalHours.toFixed(1)}</p>
                          <p className="mt-0.5 text-xs text-white/45">שעות כולל</p>
                        </div>
                        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-4 text-center">
                          <p className="text-2xl font-black text-white/65">{rate > 0 ? `₪${rate.toFixed(0)}` : "—"}</p>
                          <p className="mt-0.5 text-xs text-white/45">תעריף לשעה</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/15 p-4 text-center">
                          <p className="text-2xl font-black text-emerald-400">{rate > 0 ? `₪${totalCost.toLocaleString("he-IL", { maximumFractionDigits: 0 })}` : "—"}</p>
                          <p className="text-xs text-emerald-400 mt-0.5">עלות כוללת</p>
                        </div>
                      </div>
                      {rate === 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-500/15 px-4 py-3 text-xs text-amber-800">
                          לא הוגדר תעריף שעתי לפרויקט זה — הגדר תעריף בלשונית &quot;פרויקטים&quot; כדי לחשב עלויות.
                        </div>
                      )}
                      {/* Per-employee table */}
                      <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                        <table className="w-full text-sm">
                          <thead className="border-b border-white/[0.07] bg-white/[0.04]">
                            <tr>{["עובד", "מס׳", "ימי עבודה", "שעות", "תעריף (₪)", "עלות (₪)"].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-bold text-white/45">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.07]">
                            {costRows.map(row => (
                              <tr key={row.userId} className="transition hover:bg-white/[0.03]">
                                <td className="px-4 py-3 font-bold text-white">{row.name}</td>
                                <td className="px-4 py-3 font-mono text-xs text-white/45">{row.tag}</td>
                                <td className="px-4 py-3 text-white/65">{row.days}</td>
                                <td className="px-4 py-3 font-black text-indigo-400">{row.hours.toFixed(1)}</td>
                                <td className="px-4 py-3 text-white/55">{rate > 0 ? `₪${rate.toFixed(2)}` : "—"}</td>
                                <td className="px-4 py-3 font-black text-emerald-400">{rate > 0 ? `₪${row.cost.toLocaleString("he-IL", { maximumFractionDigits: 0 })}` : "—"}</td>
                              </tr>
                            ))}
                            {/* Totals row */}
                            <tr className="bg-white/[0.05] font-black">
                              <td className="px-4 py-3 text-white" colSpan={2}>סה״כ</td>
                              <td className="px-4 py-3 text-white/65">—</td>
                              <td className="px-4 py-3 text-indigo-300">{totalHours.toFixed(1)}</td>
                              <td className="px-4 py-3 text-white/55">—</td>
                              <td className="px-4 py-3 text-emerald-400">{rate > 0 ? `₪${totalCost.toLocaleString("he-IL", { maximumFractionDigits: 0 })}` : "—"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
              ) : reportGenerated && reportType === "locations" && reportAttendance.length === 0 ? (
                <EmptyState message="אין נתוני נוכחות בטווח שנבחר" />
              ) : reportGenerated && reportType === "locations" && reportAttendance.length > 0 ? (
                (() => {
                  // Build empId→zone map (first matching zone per employee)
                  const empZoneMap: Record<number, { id: string; name: string; managerName?: string | null }> = {};
                  zones.forEach(z => { (z.assignedEmployeeIds ?? []).forEach(eid => { if (!empZoneMap[eid]) empZoneMap[eid] = { id: z.id, name: z.name, managerName: z.managerName }; }); });

                  // Group by zone → employee → date → rows
                  type DayEntry = { date: string; inTime: string; outTime: string; hours: number; raw: MeckanoAttendance[] };
                  type EmpSection = { userId: number; name: string; tag: string; days: DayEntry[]; totalHours: number };
                  type ZoneSection = { zoneId: string; zoneName: string; managerName?: string | null; employees: EmpSection[]; totalHours: number };

                  const zoneMap: Record<string, { emps: Record<number, MeckanoAttendance[]>; zoneId: string; zoneName: string; managerName?: string | null }> = {};
                  reportAttendance.forEach(row => {
                    const zInfo = empZoneMap[row.userId] ?? { id: "none", name: "ללא אזור" };
                    if (!zoneMap[zInfo.id]) zoneMap[zInfo.id] = { zoneId: zInfo.id, zoneName: zInfo.name, managerName: zInfo.managerName, emps: {} };
                    if (!zoneMap[zInfo.id].emps[row.userId]) zoneMap[zInfo.id].emps[row.userId] = [];
                    zoneMap[zInfo.id].emps[row.userId].push(row);
                  });

                  const zoneSections: ZoneSection[] = Object.values(zoneMap).map(zs => {
                    const employees: EmpSection[] = Object.entries(zs.emps).map(([, rows]) => {
                      const sorted = [...rows].sort((a, b) => a.ts - b.ts);
                      const name = sorted[0].userName ?? `#${sorted[0].userId}`;
                      const tag = sorted[0].workerTag ?? "";
                      const byDay: Record<string, MeckanoAttendance[]> = {};
                      sorted.forEach(r => { const d = r.dateStr ?? tsToDate(r.ts); if (!byDay[d]) byDay[d] = []; byDay[d].push(r); });
                      const days: DayEntry[] = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayRows]) => {
                        const ins = dayRows.filter(r => !r.isOut); const outs = dayRows.filter(r => r.isOut);
                        const inTime = ins[0] ? (ins[0].timeStr ?? tsToTime(ins[0].ts)) : "—";
                        const outTime = outs[outs.length - 1] ? (outs[outs.length - 1].timeStr ?? tsToTime(outs[outs.length - 1].ts)) : "—";
                        let mins = 0; let pendingIn: number | null = null;
                        [...dayRows].sort((a, b) => a.ts - b.ts).forEach(r => {
                          if (!r.isOut && pendingIn === null) pendingIn = r.ts;
                          else if (r.isOut && pendingIn !== null) { mins += Math.round((r.ts - pendingIn) / 60); pendingIn = null; }
                        });
                        return { date, inTime, outTime, hours: mins / 60, raw: dayRows };
                      });
                      const totalHours = days.reduce((s, d) => s + d.hours, 0);
                      return { userId: sorted[0].userId, name, tag, days, totalHours };
                    }).sort((a, b) => a.name.localeCompare(b.name, "he"));
                    const totalHours = employees.reduce((s, e) => s + e.totalHours, 0);
                    return { zoneId: zs.zoneId, zoneName: zs.zoneName, managerName: zs.managerName, employees, totalHours };
                  }).sort((a, b) => a.zoneName.localeCompare(b.zoneName, "he"));

                  const grandTotal = zoneSections.reduce((s, z) => s + z.totalHours, 0);
                  const periodLabel = reportLocationsMode === "daily" ? reportDate : `${reportFrom} – ${reportTo}`;

                  return (
                    <div className="space-y-4">
                      {/* Header bar */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-sm text-white/45">
                          {reportLocationsMode === "daily" ? `דוח יומי · ${new Date(reportDate).toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : `דוח חודשי · ${periodLabel}`}
                          {" · "}{zoneSections.length} אזורים · {zoneSections.reduce((s, z) => s + z.employees.length, 0)} עובדים
                        </p>
                        <div className="flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.08] px-4 py-2">
                          <span className="text-xs font-bold text-indigo-400">סה״כ שעות:</span>
                          <span className="text-lg font-black text-indigo-300">{grandTotal.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Zone sections */}
                      {zoneSections.map(zs => (
                        <div key={zs.zoneId} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0b14]">
                          {/* Zone header */}
                          <div className="flex items-center justify-between gap-3 bg-white/[0.05] px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Globe size={14} className="shrink-0 text-indigo-500" />
                              <span className="text-sm font-black text-white">{zs.zoneName}</span>
                              {zs.managerName && <span className="text-xs text-white/45">· מנהל: {zs.managerName}</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/45">
                              <span>{zs.employees.length} עובדים</span>
                              <span className="font-black text-indigo-300">{zs.totalHours.toFixed(1)} ש׳</span>
                            </div>
                          </div>

                          {/* Employees */}
                          {zs.employees.map((emp, ei) => (
                            <div key={emp.userId} className={ei > 0 ? "border-t border-white/[0.07]" : ""}>
                              {/* Employee sub-header */}
                              <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.03] px-5 py-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                                  {(emp.name[0] ?? "?").toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-white">{emp.name}</span>
                                {emp.tag && <span className="font-mono text-xs text-white/35">{emp.tag}</span>}
                                <span className="mr-auto text-xs text-white/45">{emp.days.length} ימים · <strong className="text-indigo-400">{emp.totalHours.toFixed(1)} ש׳</strong></span>
                              </div>

                              {/* Day rows */}
                              <table className="w-full text-sm">
                                <thead className="border-b border-white/[0.05] bg-[#0d0e1c]">
                                  <tr>
                                    {(reportLocationsMode === "monthly" ? ["תאריך", "שעת כניסה", "שעת יציאה", "שעות"] : ["שעת כניסה", "שעת יציאה", "שעות"]).map(h => (
                                      <th key={h} className="px-5 py-2 text-right text-xs font-bold text-white/35">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                  {emp.days.map(day => (
                                    <tr key={day.date} className="transition hover:bg-indigo-500/[0.08]">
                                      {reportLocationsMode === "monthly" && (
                                        <td className="px-5 py-2.5 font-mono text-xs text-white/55">{day.date}</td>
                                      )}
                                      <td className="px-5 py-2.5">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/15 shrink-0" />
                                          {day.inTime}
                                        </span>
                                      </td>
                                      <td className="px-5 py-2.5">
                                        {day.outTime !== "—" ? (
                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500/15 shrink-0" />
                                            {day.outTime}
                                          </span>
                                        ) : <span className="text-xs text-white/35">—</span>}
                                      </td>
                                      <td className="px-5 py-2.5 text-sm font-black text-indigo-400">
                                        {day.hours > 0 ? day.hours.toFixed(2) : <span className="text-xs font-normal text-white/35">—</span>}
                                      </td>
                                    </tr>
                                  ))}
                                  {/* Employee total row (monthly only) */}
                                  {reportLocationsMode === "monthly" && emp.days.length > 1 && (
                                    <tr className="bg-white/[0.05]">
                                      <td className="px-5 py-2 text-xs font-black text-white/55" colSpan={3}>סה״כ עובד</td>
                                      <td className="px-5 py-2 font-black text-indigo-300">{emp.totalHours.toFixed(2)}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          ))}

                          {/* Zone total footer */}
                          <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.05] px-5 py-2.5">
                            <span className="text-xs font-black text-white/55">סה״כ אזור</span>
                            <span className="font-black text-indigo-300">{zs.totalHours.toFixed(2)} שעות</span>
                          </div>
                        </div>
                      ))}

                      {/* Grand total */}
                      <div className="flex items-center justify-between rounded-2xl border border-indigo-500/40 bg-indigo-600 px-6 py-4">
                        <span className="font-black text-white">סה״כ כללי — כל האזורים</span>
                        <span className="text-2xl font-black text-white">{grandTotal.toFixed(2)} שעות</span>
                      </div>
                    </div>
                  );
                })()
              ) : null}
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
                  <h3 className="mb-3 flex items-center gap-2 text-base font-black text-white">
                    <Info size={16} className="text-indigo-400" /> סקירת חברה
                  </h3>
                  {overviewLoading || empLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Company name + ID */}
                      <div className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
                          <Briefcase size={18} className="text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="mb-0.5 text-xs text-white/45">שם חברה</p>
                          <p className="text-sm font-black leading-snug text-white">{companyName}</p>
                          <p className="mt-1 font-mono text-xs text-white/35">ID: {companyId}</p>
                        </div>
                      </div>
                      {/* Employees */}
                      <div className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
                          <Users size={18} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="mb-0.5 text-xs text-white/45">סה״כ עובדים</p>
                          <p className="text-2xl font-black leading-none text-white">{totalEmp}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                              <UserCheck size={11} /> {active} פעילים
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-white/45">
                              <UserX size={11} /> {inactive} לא פעילים
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Timezone & Calendar */}
                      <div className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                          <Globe size={18} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="mb-0.5 text-xs text-white/45">אזור זמן</p>
                          <p className="text-sm font-bold text-white" dir="ltr">{timezone}</p>
                          <p className="mt-1 text-xs text-white/45">{calendarLabel}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contract Distribution */}
                {contracts.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-base font-black text-white">
                      <FileText size={16} className="text-indigo-400" /> חוזי עבודה
                    </h3>
                    <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
                      {contracts.map(([name, count]) => {
                        const pct = totalEmp > 0 ? Math.round((count / totalEmp) * 100) : 0;
                        return (
                          <div key={name} className="flex items-center gap-4 border-b border-white/[0.07] px-5 py-4 transition last:border-0 hover:bg-white/[0.03]">
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-bold text-white">{name}</p>
                              <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.10]">
                                <div
                                  className="h-1.5 rounded-full bg-indigo-400 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-lg font-black text-white">{count}</span>
                              <span className="mr-1 text-xs text-white/35">עובדים</span>
                              <p className="text-xs text-white/35">{pct}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Activity indicator */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-base font-black text-white">
                    <Activity size={16} className="text-emerald-400" /> סטטוס אינטגרציה
                  </h3>
                  <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#0a0b14] p-5">
                    {[
                      { label: "עובדים ↔ CRM אנשי קשר", desc: "סנכרון ידני מלשונית עובדים", ok: true },
                      { label: "נוכחות — time-entry", desc: "צפייה לפי טווח תאריכים (Unix timestamps)", ok: true },
                      { label: "מחלקות", desc: "עדכון בזמן אמת", ok: true },
                      { label: "משימות ודיווח שעות", desc: "צפייה מלאה + פילוח לפי עובד", ok: true },
                    ].map(({ label, desc, ok }) => (
                      <div key={label} className="flex items-start gap-3">
                        <CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${ok ? "text-emerald-500" : "text-white/25"}`} />
                        <div>
                          <p className="text-sm font-bold text-white">{label}</p>
                          <p className="text-xs text-white/45">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <h3 className="mb-1 flex items-center gap-2 text-base font-black text-white">
                    <Key size={16} className="text-indigo-400" /> מפתח API
                  </h3>
                  <p className="mb-4 text-sm text-white/45">
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
                      className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-500/15 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50"
                    >
                      {pendingKey ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                      עדכן
                    </button>
                  </form>
                  {keyMsg && (
                    <p className={`mt-3 text-sm ${keyMsg.ok ? "text-emerald-400" : "text-rose-400"}`}>{keyMsg.msg}</p>
                  )}
                </div>

                {/* Docs link */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.08] p-5">
                  <div>
                    <p className="text-sm font-bold text-white">תיעוד API מקאנו</p>
                    <p className="mt-0.5 text-xs text-indigo-300">כלים למתכנתים — REST API</p>
                  </div>
                  <a
                    href="https://www.meckano.co.il/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-3 py-2 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/25"
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
