import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TrendingDown, TrendingUp, ArrowRight, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TrendData {
  value: number;
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
  label?: string;
}

interface MetricsCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  value: number | string;
  valuePrefix?: string;
  valueSuffix?: string;
  trend?: TrendData;
  secondaryValue?: {
    label: string;
    value: string | number;
  };
  actions?: {
    primary?: {
      label: string;
      icon?: ReactNode;
      onClick: () => void;
    };
    secondary?: Array<{
      label: string;
      icon?: ReactNode;
      onClick: () => void;
    }>;
  };
  className?: string;
  loading?: boolean;
}

export function MetricsCard({
  title,
  description,
  icon,
  value,
  valuePrefix = '',
  valueSuffix = '',
  trend,
  secondaryValue,
  actions,
  className,
  loading = false,
}: MetricsCardProps) {
  // Get trend display properties
  const getTrendDisplay = (trend: TrendData) => {
    const isPositive = trend.trend === 'up';
    const isNegative = trend.trend === 'down';
    
    return {
      icon: isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />,
      className: cn(
        'flex items-center text-xs font-medium px-2 py-0.5 rounded',
        isPositive && 'text-emerald-400 bg-emerald-400/10',
        isNegative && 'text-red-400 bg-red-400/10',
        !isPositive && !isNegative && 'text-gray-400 bg-gray-400/10'
      ),
      text: `${isNegative ? '-' : '+'}${trend.percentage}%`
    };
  };

  return (
    <Card className={cn('border border-border/50 bg-card/50 backdrop-blur-sm h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
        
        {actions?.secondary && actions.secondary.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.secondary.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={action.onClick}
                  className="cursor-pointer"
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="h-full flex flex-col">
          {loading ? (
            <div className="flex flex-col space-y-2 animate-pulse">
              <div className="h-8 bg-muted-foreground/20 rounded w-2/3"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-1/3"></div>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-semibold text-foreground">
                  {valuePrefix}{value}{valueSuffix}
                </div>
                {trend && (
                  <div className={getTrendDisplay(trend).className}>
                    {getTrendDisplay(trend).icon}
                    {getTrendDisplay(trend).text}
                  </div>
                )}
              </div>
              {secondaryValue && (
                <p className="text-xs text-muted-foreground mt-1">
                  {secondaryValue.label}: {secondaryValue.value}
                </p>
              )}
            </>
          )}
          
          {actions?.primary && (
            <div className="mt-auto pt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-primary p-0 hover:text-primary/90 hover:bg-transparent"
                onClick={actions.primary.onClick}
              >
                {actions.primary.label} 
                {actions.primary.icon || <ArrowRight className="ml-1 h-3 w-3" />}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}