/**
 * Meckano REST API — `https://app.meckano.co.il/rest`
 *
 * - Auth: header `key` (company integrations doc) + `Accept: application/json`.
 * - Reports: `from_ts` / `to_ts` are Unix timestamps in **seconds** (UTC day boundaries recommended; see `meckanoDateRange`).
 * - Staff mapping: Meckano `workerTag` / `idNum` / user id align to BSD-YBM `companies/{id}/team` via
 *   `externalIds.workerTag`, `externalIds.idNum`, `externalIds.meckanoUserId` (see EventPipeline + extractMeckanoUsers).
 *
 * Use only on the server — never expose the API key to the browser.
 */

const MECKANO_REST_BASE = 'https://app.meckano.co.il/rest';

export type MeckanoClientOptions = {
  apiKey: string;
  /** Optional fetch override (tests). */
  fetchImpl?: typeof fetch;
};

function assertKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('Meckano API key is missing');
  }
}

export class MeckanoClient {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MeckanoClientOptions) {
    this.apiKey = options.apiKey.trim();
    assertKey(this.apiKey);
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private headers(): HeadersInit {
    return {
      key: this.apiKey,
      Accept: 'application/json',
    };
  }

  private async getJson(path: string, search?: URLSearchParams): Promise<unknown> {
    const q = search?.toString();
    const url = `${MECKANO_REST_BASE}${path}${q ? `?${q}` : ''}`;
    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: this.headers(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Meckano ${path} failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      return {};
    }
    return res.json() as Promise<unknown>;
  }

  /** GET /users — employees directory. */
  async getUsers(): Promise<unknown> {
    return this.getJson('/users');
  }

  /** GET /attendance/report — daily attendance logs; unix `from_ts` / `to_ts` (seconds). */
  async getAttendanceReport(fromTs: number, toTs: number): Promise<unknown> {
    const q = new URLSearchParams({
      from_ts: String(fromTs),
      to_ts: String(toTs),
    });
    return this.getJson('/attendance/report', q);
  }

  /** GET /tasks/report — task report for range (unix seconds). */
  async getTaskReport(fromTs: number, toTs: number): Promise<unknown> {
    const q = new URLSearchParams({
      from_ts: String(fromTs),
      to_ts: String(toTs),
    });
    return this.getJson('/tasks/report', q);
  }

  /** @deprecated Use {@link getTaskReport} (same endpoint). */
  async getTasksReport(fromTs: number, toTs: number): Promise<unknown> {
    return this.getTaskReport(fromTs, toTs);
  }
}
