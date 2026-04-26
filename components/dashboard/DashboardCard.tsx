import React from "react";

interface DashboardCardProps {
  title?: string;
  actionIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, actionIcon, children, className = "" }: DashboardCardProps) {
  return (
    <div
      className={`dashboard-card flex flex-col rounded-[26px] border border-[color:var(--dash-line)] bg-[color:var(--dash-card)] p-5 shadow-[var(--dash-shadow)] ${className}`}
    >
      {(title || actionIcon) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h3 className="text-base font-black text-[color:var(--ink-900)]">{title}</h3>}
          {actionIcon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--dash-purple-soft)] text-[color:var(--dash-purple)] transition-colors hover:text-[color:var(--dash-purple-strong)]">
              {actionIcon}
            </div>
          )}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
