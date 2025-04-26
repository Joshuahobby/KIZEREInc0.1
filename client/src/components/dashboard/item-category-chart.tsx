import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface ItemCategoryData {
  name: string;
  value: number;
  color?: string;
}

interface ItemCategoryChartProps {
  data: ItemCategoryData[];
  className?: string;
}

export function ItemCategoryChart({ data, className }: ItemCategoryChartProps) {
  // Default color for bars
  const DEFAULT_COLOR = '#00BFFF';
  
  return (
    <ResponsiveContainer width="100%" height={200} className={className}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        barSize={20}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="name"
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
          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
        />
        <Bar 
          dataKey="value" 
          fill={DEFAULT_COLOR}
          radius={[4, 4, 0, 0]}
          name="Items"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}