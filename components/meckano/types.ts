export type MeckanoEmployee = {
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

export type MeckanoDepartment = {
  id: number;
  name: string;
  number?: number;
  parentId?: number | null;
  usersCount?: number;
};

export type MeckanoAttendance = {
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

export type MeckanoTask = {
  id: number;
  name: string;
  code?: string | null;
  isActive?: number;
  parentId?: number | null;
};

export type MeckanoTaskEntry = {
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

export type MeckanoZone = {
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

export type ApiResult<T> = { status: boolean; data?: T; error?: string };
