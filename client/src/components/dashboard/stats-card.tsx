import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniChart } from "@/components/dashboard/mini-chart";
import { ArrowUpIcon, ArrowDownIcon, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value?: number;
  previousValue?: number;
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  linkHref?: string;
  isLoading?: boolean;
  trendData?: number[];
  chartColor?: string;
  successRate?: number;
  delay?: number;
}

/**
 * Enhanced Stats Card Component
 * 
 * Displays key metrics with trend visualization, comparison to previous period,
 * and visual indicators for increases/decreases.
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  previousValue,
  icon,
  iconBgClass,
  iconTextClass,
  linkHref,
  isLoading = false,
  trendData,
  chartColor,
  successRate,
  delay = 0
}) => {
  // Calculate percentage change
  const percentChange = previousValue && value 
    ? Math.round(((value - previousValue) / previousValue) * 100) 
    : null;
  
  // Determine if change is positive, negative or neutral
  const isPositive = percentChange && percentChange > 0;
  const isNegative = percentChange && percentChange < 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              
              {isLoading ? (
                <Skeleton className="h-9 w-20 mt-1" />
              ) : (
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-semibold">
                    {value?.toLocaleString() || "0"}
                  </p>
                  
                  {/* Success rate indicator (for cards that need it) */}
                  {typeof successRate === 'number' && (
                    <div className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {successRate}%
                    </div>
                  )}
                  
                  {/* Percentage change indicator */}
                  {percentChange !== null && (
                    <div className={`ml-2 flex items-center text-xs ${
                      isPositive ? 'text-green-600 dark:text-green-400' : 
                      isNegative ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {isPositive ? (
                        <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                      ) : isNegative ? (
                        <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                      ) : null}
                      <span>{Math.abs(percentChange)}%</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground mt-1">
                {previousValue !== undefined && !isLoading ? (
                  <>vs. {previousValue.toLocaleString()} previous</>
                ) : (
                  isLoading ? <Skeleton className="h-3 w-32" /> : null
                )}
              </div>
            </div>
            
            <div className={`rounded-lg p-2 ${iconBgClass}`}>
              <div className={`h-6 w-6 ${iconTextClass}`}>
                {icon}
              </div>
            </div>
          </div>
          
          {/* Chart */}
          {trendData && !isLoading ? (
            <div className="mt-4">
              <MiniChart 
                data={trendData} 
                color={chartColor}
                height={30}
                width={220}
              />
            </div>
          ) : (
            isLoading ? (
              <div className="mt-4">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : null
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};