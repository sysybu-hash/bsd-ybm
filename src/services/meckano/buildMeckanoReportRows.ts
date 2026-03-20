import { getAdminFirestore } from '@/lib/firebaseAdmin';
import {
  extractAttendanceRows,
  buildMeckanoTeamIndex,
  resolveTeamForRow,
  resolveHours,
  resolveProjectId,
  resolveHourlyRate,
} from '@/services/events/EventPipeline';
import {
  extractMeckanoUserList,
  indexMeckanoUsers,
  lookupMeckanoUser,
  pickEmployeeDisplayName,
} from '@/services/meckano/extractMeckanoUsers';

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return undefined;
}

function rowMeckanoId(row: Record<string, unknown>): string {
  return (
    pickString(
      row.user_id,
      row.userId,
      row.worker_id,
      row.workerId,
      row.employee_id,
      row.employeeId,
      row.id
    ) ?? '—'
  );
}

function resolveWorkDate(row: Record<string, unknown>): string {
  return (
    pickString(
      row.date,
      row.work_date,
      row.workDate,
      row.day,
      row.report_date,
      row.reportDate,
      row.attendance_date
    ) ?? '—'
  );
}

function resolveProjectOrDept(row: Record<string, unknown>, projectId: string | null): string {
  return (
    pickString(
      row.department,
      row.dept,
      row.department_name,
      row.project_name,
      row.projectName,
      row.site_name,
      row.siteName
    ) ?? projectId ?? '—'
  );
}

export type MeckanoReportRowDTO = {
  meckanoUserId: string;
  employeeName: string;
  workDate: string;
  totalHours: number;
  projectOrDept: string;
  projectId: string | null;
  calculatedCost: number;
  hourlyRate: number;
};

export type MeckanoReportByDate = Record<
  string,
  {
    distinctWorkers: number;
    workerIds: string[];
  }
>;

export type MeckanoReportPayload = {
  rows: MeckanoReportRowDTO[];
  byDate: MeckanoReportByDate;
};

/**
 * Joins Meckano attendance + users with Firestore team (rates, names, project defaults).
 */
export async function buildMeckanoReportPayload(
  companyId: string,
  rawAttendance: unknown,
  rawUsers: unknown,
  options?: { filterProjectId?: string }
): Promise<MeckanoReportPayload> {
  const db = getAdminFirestore();
  const teamSnap = await db.collection('companies').doc(companyId).collection('team').get();
  const teamIndex = buildMeckanoTeamIndex(teamSnap);

  const userList = extractMeckanoUserList(rawUsers);
  const userMap = indexMeckanoUsers(userList);

  const attendanceRows = extractAttendanceRows(rawAttendance);
  const rows: MeckanoReportRowDTO[] = [];
  const byDate: MeckanoReportByDate = {};

  for (const row of attendanceRows) {
    const hours = resolveHours(row);
    if (hours <= 0) continue;

    const team = resolveTeamForRow(row, teamIndex);
    const projectId = resolveProjectId(row, team) ?? null;

    if (options?.filterProjectId && projectId !== options.filterProjectId) {
      continue;
    }

    const meckanoUser = lookupMeckanoUser(row, userMap);
    const rate = resolveHourlyRate(row, team, meckanoUser);
    const cost = Math.round(hours * rate * 100) / 100;

    const mid = rowMeckanoId(row);
    const workDate = resolveWorkDate(row);
    const label = resolveProjectOrDept(row, projectId);

    rows.push({
      meckanoUserId: mid,
      employeeName: pickEmployeeDisplayName(meckanoUser, team?.displayName, mid),
      workDate,
      totalHours: hours,
      projectOrDept: label,
      projectId,
      calculatedCost: cost,
      hourlyRate: rate,
    });

    if (!byDate[workDate]) {
      byDate[workDate] = { distinctWorkers: 0, workerIds: [] };
    }
    const bucket = byDate[workDate];
    if (!bucket.workerIds.includes(mid)) {
      bucket.workerIds.push(mid);
      bucket.distinctWorkers = bucket.workerIds.length;
    }
  }

  rows.sort((a, b) => {
    const d = a.workDate.localeCompare(b.workDate);
    if (d !== 0) return d;
    return a.employeeName.localeCompare(b.employeeName, undefined, { sensitivity: 'base' });
  });

  return { rows, byDate };
}
