import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PaymentAnalyticsDataPoint {
  date: string;
  amount: number;
  count?: number;
  successRate?: number;
}

interface EnhancedPaymentAnalyticsProps {
  data: PaymentAnalyticsDataPoint[];
  title?: string;
  description?: string;
  className?: string;
  comparisonData?: {
    previousPeriod: {
      totalAmount: number;
      percentageChange: number;
    };
    averagePerTransaction: number;
    successRate: number;
  };
  onFilterChange?: (period: string) => void;
  onDownload?: () => void;
  isLoading?: boolean;
}

export function EnhancedPaymentAnalytics({
  data = [],
  title = "Revenue Over Time",
  description = "Payment collection trends",
  className,
  comparisonData,
  onFilterChange,
  onDownload,
  isLoading = false
}: EnhancedPaymentAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<string>('amount');
  const [timePeriod, setTimePeriod] = useState<string>('30d');
  
  // Calculate the average amount
  const totalAmount = data.length > 0 ? data.reduce((sum, entry) => sum + entry.amount, 0) : 0;
  const averageAmount = data.length > 0 ? totalAmount / data.length : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `RWF ${value.toLocaleString()}`;
  };
  
  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period);
    if (onFilterChange) {
      onFilterChange(period);
    }
  };
  
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center bg-card/30 rounded-lg border border-border/50 animate-pulse">
          <div className="text-sm text-muted-foreground">Loading chart data...</div>
        </div>
      );
    }
    
    if (data.length === 0) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center bg-card/30 rounded-lg border border-border/50">
          <div className="text-sm text-muted-foreground">No data available for the selected period</div>
        </div>
      );
    }
    
    if (activeTab === 'amount') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00BFFF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => `RWF ${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151',
                borderRadius: '0.375rem',
                color: '#f3f4f6'
              }}
              formatter={(value: number) => [formatCurrency(value), 'Amount']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            {averageAmount > 0 && (
              <ReferenceLine 
                y={averageAmount} 
                stroke="#f59e0b" 
                strokeDasharray="3 3"
                label={{ 
                  value: 'Avg', 
                  position: 'right', 
                  fill: '#f59e0b',
                  fontSize: 12
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#00BFFF"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAmount)"
              activeDot={{ r: 6, fill: '#00BFFF', stroke: '#ffffff' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span style={{ color: '#9ca3af' }}>Revenue ({value})</span>}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    if (activeTab === 'count') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151',
                borderRadius: '0.375rem',
                color: '#f3f4f6'
              }}
              formatter={(value: number) => [`${value}`, 'Transactions']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: '#10b981', stroke: '#10b981' }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span style={{ color: '#9ca3af' }}>Number of Transactions</span>}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (activeTab === 'successRate') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151',
                borderRadius: '0.375rem',
                color: '#f3f4f6'
              }}
              formatter={(value: number) => [`${value}%`, 'Success Rate']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="successRate"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4, fill: '#f59e0b', stroke: '#f59e0b' }}
              activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span style={{ color: '#9ca3af' }}>Payment Success Rate</span>}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };
  
  return (
    <Card className={cn('border border-border/50 bg-card/50 backdrop-blur-sm h-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border bg-background/50 hover:bg-background"
              onClick={onDownload}
            >
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {comparisonData && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg bg-card p-3 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold">{formatCurrency(totalAmount)}</div>
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-xs font-normal",
                    comparisonData.previousPeriod.percentageChange >= 0 
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  )}
                >
                  {comparisonData.previousPeriod.percentageChange >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(comparisonData.previousPeriod.percentageChange)}%
                </Badge>
              </div>
            </div>
            
            <div className="rounded-lg bg-card p-3 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Avg Per Transaction</div>
              <div className="text-xl font-semibold">{formatCurrency(comparisonData.averagePerTransaction)}</div>
            </div>
            
            <div className="rounded-lg bg-card p-3 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
              <div className="text-xl font-semibold">{comparisonData.successRate}%</div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap items-center justify-between mb-4">
          <Tabs defaultValue="amount" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-background/50">
              <TabsTrigger value="amount">Revenue</TabsTrigger>
              <TabsTrigger value="count">Transactions</TabsTrigger>
              <TabsTrigger value="successRate">Success Rate</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs",
                timePeriod === '7d' && "bg-primary/20 border-primary/50"
              )}
              onClick={() => handleTimePeriodChange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs",
                timePeriod === '30d' && "bg-primary/20 border-primary/50"
              )}
              onClick={() => handleTimePeriodChange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs",
                timePeriod === '90d' && "bg-primary/20 border-primary/50"
              )}
              onClick={() => handleTimePeriodChange('90d')}
            >
              90 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs flex items-center",
                timePeriod === 'custom' && "bg-primary/20 border-primary/50"
              )}
              onClick={() => handleTimePeriodChange('custom')}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Custom
            </Button>
          </div>
        </div>
        
        {renderChart()}
      </CardContent>
    </Card>
  );
}