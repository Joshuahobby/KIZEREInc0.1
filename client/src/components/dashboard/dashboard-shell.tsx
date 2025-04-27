import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className={cn("flex-1 container flex flex-col gap-8 py-8", className)}>
        {children}
      </div>
    </div>
  );
}