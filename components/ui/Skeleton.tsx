type SkeletonProps = {
  className?: string;
  /** תפקיד לנגישות — ברירת מחדל presentation כדי שלא יוכרז כטקסט */
  role?: "presentation" | "status";
  "aria-label"?: string;
};

export function Skeleton({ className = "", role = "presentation", ...rest }: SkeletonProps) {
  return (
    <div
      role={role}
      className={`animate-pulse rounded-xl bg-[color:var(--canvas-sunken)] ${className}`}
      {...rest}
    />
  );
}
