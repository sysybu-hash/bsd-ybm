import type { ApiResult } from "./types";

export async function meckanoFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<ApiResult<T>> {
  const url = new URL(`/api/meckano/${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    return { status: false, error: err.error ?? `שגיאה ${res.status}` };
  }
  return res.json() as Promise<ApiResult<T>>;
}

export function tsToDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("he-IL");
}

export function tsToTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}
