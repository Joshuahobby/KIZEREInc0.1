import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentTypeData {
  name: string;
  value: number;
  color: string;
}

interface PaymentTypeChartProps {
  data?: PaymentTypeData[];
  isLoading?: boolean;
}

export function PaymentTypeChart({ data = [], isLoading = false }: PaymentTypeChartProps) {
  // Default data with zero values
  const defaultData = [
    { name: 'Registration', value: 0, color: '#8b5cf6' }, // Purple
    { name: 'Lost Report', value: 0, color: '#ec4899' },  // Pink
  ];

  const chartData = data.length > 0 ? data : defaultData;
  
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-medium">Payment Type Distribution</CardTitle>
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
                  fill="#8884d8"
                  dataKey="value"
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