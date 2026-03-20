function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return undefined;
}

/** Normalises GET /users payloads into a flat user record list. */
export function extractMeckanoUserList(raw: unknown): Array<Record<string, unknown>> {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x) => asRecord(x)) as Array<Record<string, unknown>>;
  }
  const o = asRecord(raw);
  if (!o) return [];
  const candidates = ['users', 'data', 'records', 'items', 'employees', 'workers'];
  for (const key of candidates) {
    const v = o[key];
    if (Array.isArray(v)) return v.filter((x) => asRecord(x)) as Array<Record<string, unknown>>;
  }
  return [];
}

/** Map Meckano user id, idNum, and workerTag → user row (for rates / display names). */
export function indexMeckanoUsers(users: Array<Record<string, unknown>>): Map<string, Record<string, unknown>> {
  const m = new Map<string, Record<string, unknown>>();
  for (const u of users) {
    const id = pickString(u.id, u.user_id, u.userId, u.worker_id, u.workerId);
    if (id) m.set(id, u);
    const idNum = pickString(u.idNum, u.id_num, u.teudat_zeut, u.teudatZeut);
    if (idNum) m.set(`idn:${idNum}`, u);
    const tag = pickString(u.worker_tag, u.workerTag);
    if (tag) m.set(`tag:${tag}`, u);
  }
  return m;
}

export function lookupMeckanoUser(
  row: Record<string, unknown>,
  userMap: Map<string, Record<string, unknown>>
): Record<string, unknown> | null {
  const uid = pickString(
    row.user_id,
    row.userId,
    row.worker_id,
    row.workerId,
    row.employee_id,
    row.employeeId,
    row.id
  );
  if (uid && userMap.has(uid)) return userMap.get(uid)!;

  const idNum = pickString(row.idNum, row.id_num, row.teudat_zeut, row.teudatZeut);
  if (idNum && userMap.has(`idn:${idNum}`)) return userMap.get(`idn:${idNum}`)!;

  const workerTag = pickString(row.worker_tag, row.workerTag);
  if (workerTag && userMap.has(`tag:${workerTag}`)) return userMap.get(`tag:${workerTag}`)!;

  return null;
}

export function pickEmployeeDisplayName(
  meckanoUser: Record<string, unknown> | null,
  teamName: string | undefined,
  fallbackId: string
): string {
  const fromApi = pickString(
    meckanoUser?.name,
    meckanoUser?.full_name,
    meckanoUser?.fullName,
    meckanoUser?.worker_name,
    meckanoUser?.workerName
  );
  if (fromApi) return fromApi;
  if (teamName) return teamName;
  return fallbackId || '—';
}
