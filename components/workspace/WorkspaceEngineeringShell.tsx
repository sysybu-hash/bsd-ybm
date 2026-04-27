import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function WorkspaceEngineeringShell({ children, className = "" }: Props) {
  return (
    <div
      className={`cd-canvas mx-auto w-full max-w-[1240px] space-y-6 px-4 py-6 md:px-8 md:py-8 ${className}`}
    >
      {children}
    </div>
  );
}
