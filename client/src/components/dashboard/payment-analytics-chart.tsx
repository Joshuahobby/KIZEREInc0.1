import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export interface PaymentAnalyticsData {
  date: string;
  amount: number;
}

interface PaymentAnalyticsChartProps {
  data: PaymentAnalyticsData[];
  className?: string;
}

export function PaymentAnalyticsChart({ data, className }: PaymentAnalyticsChartProps) {
  // Calculate the average amount
  const totalAmount = data.reduce((sum, entry) => sum + entry.amount, 0);
  const averageAmount = totalAmount / data.length;
  
  return (
    <ResponsiveContainer width="100%" height={200} className={className}>
      <LineChart
        data={data}
        margin={{
          top: 5,
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
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            borderColor: '#374151',
            borderRadius: '0.375rem',
            color: '#f3f4f6'
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
          labelFormatter={(label) => `Date: ${label}`}
        />
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
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#00BFFF"
          strokeWidth={2}
          dot={{ r: 4, fill: '#00BFFF', stroke: '#00BFFF' }}
          activeDot={{ r: 6, fill: '#00BFFF', stroke: '#ffffff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}