import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ArrowUpRightIcon, Download, DownloadIcon, Filter, Calendar } from 'lucide-react';
import { useDashboard } from '@/context/dashboard-context';
import { adminApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// Example chart data structure
interface RevenueData {
  date: string;
  actual: number;
  target: number;
}

// Data fetching hook for revenue chart data
function useRevenueData(period: string) {
  const { data, isLoading, error } = useQuery<RevenueData[]>({
    queryKey: ['/api/admin/revenue', { period }],
    queryFn: async () => {
      try {
        // In the future, this endpoint should be implemented
        // const result = await adminApi.getRevenueData(period);
        // return result as RevenueData[];
        
        // For now, generate data based on the current date
        const today = new Date();
        const data: RevenueData[] = [];
        
        // Generate different amounts of data points based on period
        let days = 0;
        switch(period) {
          case 'week':
            days = 7;
            break;
          case 'month':
            days = 30;
            break;
          case 'quarter':
            days = 90;
            break;
          case 'year':
            days = 365;
            break;
          default:
            days = 7;
        }
        
        // Create a data point for each day
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          
          // For demo purposes, create some patterns in the data
          const baseValue = 100 + Math.floor(Math.random() * 50);
          const dayOfWeek = date.getDay();
          const multiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.2; // Weekend vs weekday
          
          data.push({
            date: format(date, 'MMM dd'),
            actual: Math.round(baseValue * multiplier * (1 + (days - i) / 100)),
            target: baseValue + 20
          });
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        throw error;
      }
    },
    // Refresh every 5 minutes
    refetchInterval: 300000,
  });

  return { data: data || [], isLoading, error };
}

/**
 * Revenue chart component that shows actual vs target revenue
 * Allows filtering by time period
 */
export function RevenueChart() {
  const [period, setPeriod] = useState<string>('month');
  const [compareWithTarget, setCompareWithTarget] = useState<boolean>(true);
  const { state } = useDashboard();
  const { data, isLoading } = useRevenueData(period);
  
  // Calculate the revenue statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, average: 0, highest: 0 };
    
    const total = data.reduce((sum, item) => sum + item.actual, 0);
    const average = Math.round(total / data.length);
    const highest = Math.max(...data.map(item => item.actual));
    
    return { total, average, highest };
  }, [data]);
  
  // Format dollar amounts
  const formatDollar = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };
  
  // Customize tooltip appearance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md text-sm">
          <p className="font-medium">{label}</p>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-blue-400 flex items-center">
              <span className="w-3 h-3 bg-blue-400 mr-2 rounded-full inline-block"></span>
              Actual: {formatDollar(payload[0].value)}
            </p>
            {compareWithTarget && (
              <p className="text-yellow-400 flex items-center">
                <span className="w-3 h-3 bg-yellow-400 mr-2 rounded-full inline-block"></span>
                Target: {formatDollar(payload[1].value)}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
          <CardDescription>Daily revenue with targets</CardDescription>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tabs defaultValue={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" size="icon" title="Export data">
            <DownloadIcon className="h-4 w-4" />
          </Button>
          
          <Button 
            variant={compareWithTarget ? "default" : "outline"} 
            size="sm"
            onClick={() => setCompareWithTarget(!compareWithTarget)}
          >
            Compare Target
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-semibold">{formatDollar(stats.total)}</span>
              <span className="text-emerald-400 text-xs ml-2 flex items-center">
                <ArrowUpRightIcon className="h-3 w-3 mr-1" />
                +14.2%
              </span>
            </div>
          </div>
          
          <div className="bg-card/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Average Revenue</p>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-semibold">{formatDollar(stats.average)}</span>
              <span className="text-emerald-400 text-xs ml-2 flex items-center">
                <ArrowUpRightIcon className="h-3 w-3 mr-1" />
                +5.8%
              </span>
            </div>
          </div>
          
          <div className="bg-card/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Highest Revenue</p>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-semibold">{formatDollar(stats.highest)}</span>
              <span className="text-emerald-400 text-xs ml-2 flex items-center">
                <ArrowUpRightIcon className="h-3 w-3 mr-1" />
                +23.5%
              </span>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-80 animate-pulse">
            <div className="h-40 w-full bg-muted-foreground/20 rounded"></div>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#888' }} 
                  tickLine={{ stroke: '#444' }}
                  axisLine={{ stroke: '#444' }}
                />
                <YAxis 
                  tick={{ fill: '#888' }} 
                  tickLine={{ stroke: '#444' }}
                  axisLine={{ stroke: '#444' }}
                  tickFormatter={tick => `$${tick}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Revenue"
                  stroke="#3B82F6"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                {compareWithTarget && (
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="Target Revenue" 
                    stroke="#EAB308" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}