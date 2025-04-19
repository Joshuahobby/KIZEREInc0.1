import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface StatsCardProps {
  title: string;
  value: number | undefined;
  previousValue?: number;
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  linkHref: string;
  isLoading: boolean;
  delay?: number;
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
  delay = 0
}: StatsCardProps) {
  const calculateTrend = () => {
    if (previousValue === undefined || value === undefined) return null;
    if (previousValue === 0) return { percent: 100, isUp: true };
    
    const diff = value - previousValue;
    const percent = Math.round((diff / previousValue) * 100);
    return { percent: Math.abs(percent), isUp: diff >= 0 };
  };

  const trend = calculateTrend();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${iconBgClass} rounded-md p-3`}>
                {icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
                  <dd className="flex items-baseline">
                    {isLoading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      <div className="text-lg font-semibold text-foreground">{value}</div>
                    )}
                    
                    {trend && !isLoading && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`ml-2 flex items-center text-xs font-medium ${
                              trend.isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {trend.isUp ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {trend.percent}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{trend.isUp ? 'Increased' : 'Decreased'} {trend.percent}% from previous period</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 px-4 py-3 sm:px-6 border-t border-border/50">
            <div className="text-sm">
              <Link href={linkHref}>
                <a className="font-medium text-primary hover:underline flex items-center">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}