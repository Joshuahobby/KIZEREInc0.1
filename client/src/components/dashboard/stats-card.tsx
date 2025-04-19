import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Link } from "wouter";

/**
 * StatsCard component for displaying metric data in dashboard
 * 
 * Features:
 * - Animated counter
 * - Trend indicator (up/down/neutral)
 * - Customizable appearance
 * - Loading state
 * - Link to detailed page
 */
interface StatsCardProps {
  title: string;
  value: number | undefined;
  previousValue?: number | null;
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  linkHref: string;
  isLoading: boolean;
  delay?: number;
}

/**
 * Calculate percentage change between current and previous values
 */
function calculatePercentChange(current: number, previous: number | undefined | null): number | null {
  if (previous === undefined || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function StatsCard({
  title,
  value = 0,
  previousValue,
  icon,
  iconBgClass, 
  iconTextClass,
  linkHref,
  isLoading,
  delay = 0,
}: StatsCardProps) {
  // State for animated counter
  const [displayValue, setDisplayValue] = useState(0);
  // Calculate trend percentage if previous value exists
  const percentChange = previousValue !== undefined && previousValue !== null
    ? calculatePercentChange(value || 0, previousValue)
    : null;

  // Animate the value change
  useEffect(() => {
    if (isLoading || value === undefined) return;
    
    // Delay the animation based on the delay prop
    const timeout = setTimeout(() => {
      // Animate from current display value to the target value
      let start = 0;
      if (value > 1000) {
        // For large values, start from a higher number for smoother animation
        start = value * 0.7;
      } else if (value > 100) {
        start = value * 0.5;
      }
      
      const duration = 1000; // Animation duration in ms
      const startTime = Date.now();
      
      const updateValue = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(start + (value - start) * easeOutQuart));
        
        if (progress < 1) {
          requestAnimationFrame(updateValue);
        }
      };
      
      requestAnimationFrame(updateValue);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [value, isLoading, delay]);

  return (
    <Link href={linkHref}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={cn(
              "rounded-full p-2",
              iconBgClass
            )}
          >
            <div className={cn("h-4 w-4", iconTextClass)}>{icon}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            {isLoading ? (
              <Skeleton className="h-9 w-24 mt-1 mb-3" />
            ) : (
              <div className="text-3xl font-bold">{displayValue.toLocaleString()}</div>
            )}
            {previousValue !== undefined && previousValue !== null && !isLoading && (
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {percentChange !== null && (
                  <>
                    {percentChange > 0 ? (
                      <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                    ) : percentChange < 0 ? (
                      <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                    ) : (
                      <Minus className="mr-1 h-3 w-3 text-yellow-500" />
                    )}
                    <span
                      className={cn(
                        "font-medium",
                        percentChange > 0
                          ? "text-green-500"
                          : percentChange < 0
                          ? "text-red-500"
                          : "text-yellow-500"
                      )}
                    >
                      {Math.abs(Math.round(percentChange)).toLocaleString()}%
                    </span>
                  </>
                )}
                <span className="ml-1">from previous period</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}