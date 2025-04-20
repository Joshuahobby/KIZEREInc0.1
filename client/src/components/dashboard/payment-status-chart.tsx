import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentStatusData {
  name: string;
  value: number;
  color: string;
}

interface PaymentStatusChartProps {
  data?: PaymentStatusData[];
  isLoading?: boolean;
}

export function PaymentStatusChart({ data = [], isLoading = false }: PaymentStatusChartProps) {
  // Default data with zero values
  const defaultData = [
    { name: 'Successful', value: 0, color: '#10b981' }, // Green
    { name: 'Pending', value: 0, color: '#f59e0b' },   // Amber
    { name: 'Failed', value: 0, color: '#ef4444' },    // Red
    { name: 'Cancelled', value: 0, color: '#6b7280' }, // Gray
    { name: 'Refunded', value: 0, color: '#3b82f6' },  // Blue
  ];

  const chartData = data.length > 0 ? data : defaultData;
  
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-medium">Payment Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                  label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} transactions`, 'Count']}
                  contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}