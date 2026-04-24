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
      className={`bg-brand-surface flex flex-col rounded-3xl border border-gray-50 p-6 shadow-card ${className}`}
    >
      {(title || actionIcon) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
          {actionIcon && (
            <div className="cursor-pointer text-gray-400 transition-colors hover:text-brand">
              {actionIcon}
            </div>
          )}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
