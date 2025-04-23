import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Basic skeleton component for loading states
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "h-5 w-full animate-pulse rounded-md bg-muted/60",
        className
      )}
      style={style}
    />
  );
}

/**
 * Skeleton for cards showing items or reports
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border p-4 shadow-sm", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center space-x-4 pt-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for profile/user information
 */
export function ProfileSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

/**
 * Skeleton for table rows (payments, transactions, etc.)
 */
export function TableRowSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex w-full items-center space-x-2 py-3", className)}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

/**
 * Skeleton for dashboard stats cards
 */
export function StatsSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border p-5", className)}>
      <div className="flex justify-between">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-12 w-1/2" />
      <Skeleton className="mt-3 h-4 w-2/3" />
    </div>
  );
}

/**
 * Skeleton for charts and graphs
 */
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-2 rounded-lg border p-6", className)}>
      <Skeleton className="h-8 w-1/3" />
      <div className="h-[200px] w-full">
        <div className="flex h-full w-full items-end justify-between space-x-2">
          {Array.from({ length: 12 }).map((_, i) => {
            // Generate random heights between 20% and 100% for the chart bars
            const randomHeight = 20 + Math.floor(Math.random() * 80);
            return (
              <Skeleton 
                key={i} 
                className={`w-full`}
                style={{ height: `${randomHeight}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the entire dashboard layout
 */
export function DashboardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
        <StatsSkeleton />
      </div>
      <ChartSkeleton className="h-[400px]" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="space-y-4">
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid gap-4 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}