import { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {children}
    </div>
  );
}