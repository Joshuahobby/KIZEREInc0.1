import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  previousValue?: number | string;
  icon?: React.ReactNode;
  iconBgClass?: string;
  iconTextClass?: string;
  trendData?: number[];
  chartColor?: string;
  prefix?: string;
  suffix?: string;
  isLoading?: boolean;
  formatter?: (value: number | string) => string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  previousValue,
  icon,
  iconBgClass = "bg-primary/10",
  iconTextClass = "text-primary",
  trendData = [],
  chartColor = "#00BFFF",
  prefix = "",
  suffix = "",
  isLoading = false,
  formatter = (val) => val.toString()
}) => {
  // Calculate percentage change if previousValue is provided
  const percentChange = previousValue !== undefined && typeof value === 'number' && typeof previousValue === 'number'
    ? ((value - previousValue) / previousValue) * 100
    : undefined;

  // Format the displayed value
  const formattedValue = typeof value === 'number'
    ? formatter(value)
    : value.toString();

  // Format the percentage change
  const formattedChange = percentChange !== undefined
    ? percentChange.toFixed(1) + '%'
    : undefined;

  // Determine if the trend is positive, negative, or neutral
  const getTrendDirection = (change?: number) => {
    if (change === undefined) return "neutral";
    if (change > 0) return "positive";
    if (change < 0) return "negative";
    return "neutral";
  };

  const trendDirection = getTrendDirection(percentChange);

  // Generate SVG path for the sparkline
  const generateSparklinePath = (data: number[]) => {
    if (!data.length) return "";
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 30;
    
    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(" ");
  };

  const sparklinePath = generateSparklinePath(trendData);

  // Get the trend icon based on direction
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "positive":
        return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
      case "negative":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium text-sm text-muted-foreground">{title}</div>
          {icon && (
            <div className={`rounded-full p-2 ${iconBgClass}`}>
              <div className={iconTextClass}>{icon}</div>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex space-x-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold mb-1">
              {prefix}{formattedValue}{suffix}
            </div>
            
            <div className="flex items-center space-x-2">
              {percentChange !== undefined && (
                <Badge 
                  variant="outline" 
                  className={`
                    flex items-center space-x-1 font-medium
                    ${trendDirection === 'positive' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                      trendDirection === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                  `}
                >
                  {getTrendIcon(trendDirection)}
                  <span>{formattedChange}</span>
                </Badge>
              )}
              
              <span className="text-xs text-muted-foreground">
                vs. previous period
              </span>
            </div>
            
            {trendData.length > 0 && (
              <div className="mt-3 relative h-[30px]">
                <svg width="100%" height="30" className="overflow-visible">
                  <defs>
                    <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={chartColor} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke={chartColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={`${sparklinePath} L ${trendData.length ? (trendData.length - 1) / (trendData.length - 1) * 80 : 0} 30 L 0 30 Z`}
                    fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                    strokeWidth="0"
                  />
                </svg>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};