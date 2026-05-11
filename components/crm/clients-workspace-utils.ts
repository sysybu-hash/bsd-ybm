import { STATUS_BADGE_CLASS } from "./clients-workspace-constants";

export function getStatusBadgeClass(status: string) {
  return STATUS_BADGE_CLASS[status as keyof typeof STATUS_BADGE_CLASS] ?? "bg-slate-100 text-slate-700";
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}
