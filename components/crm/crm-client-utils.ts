import { AVATAR_COLORS, STATUS_COLUMNS } from "./crm-client-constants";

export function statusMeta(s: string) {
  return STATUS_COLUMNS.find((c) => c.key === s) ?? STATUS_COLUMNS[0];
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function fmtMoney(v: number) {
  return `₪${v.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
}

export function formatRange(from: string | null, to: string | null): string {
  if (!from && !to) return "";
  const a = from
    ? new Date(from).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "—";
  const b = to
    ? new Date(to).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "עתיד";
  return `${a} – ${b}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function avatarColor(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h << 5) + h + id.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
