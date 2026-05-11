export const STATUS_BADGE_CLASS = {
  LEAD: "bg-[color:var(--state-info-soft)] text-[color:var(--state-info)]",
  ACTIVE: "bg-[color:var(--axis-clients-soft)] text-[color:var(--axis-clients-ink)]",
  PROPOSAL: "bg-[color:var(--state-warning-soft)] text-[color:var(--state-warning)]",
  CLOSED_WON: "bg-[color:var(--state-success-soft)] text-[color:var(--state-success)]",
  CLOSED_LOST: "bg-[color:var(--state-danger-soft)] text-[color:var(--state-danger)]",
} as const;

export const statusOrder = ["LEAD", "PROPOSAL", "ACTIVE", "CLOSED_WON"] as const;

export const ALL_STATUS_OPTIONS = [...statusOrder, "CLOSED_LOST"] as const;
