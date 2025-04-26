import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LabelList 
} from 'recharts';

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
  // Default colors if none provided
  const DEFAULT_COLOR = '#00BFFF';
  
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  return (
    <ResponsiveContainer width="100%" height={200} className={className}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{
          top: 20,
          right: 30,
          left: 100,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
        <XAxis 
          type="number" 
          tick={{ fill: '#9ca3af' }}
          axisLine={{ stroke: '#4b5563' }}
        />
        <YAxis 
          type="category"
          dataKey="name" 
          tick={{ fill: '#9ca3af' }}
          axisLine={{ stroke: '#4b5563' }}
          width={90}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            borderColor: '#374151',
            borderRadius: '0.375rem',
            color: '#f3f4f6'
          }}
          formatter={(value: number) => [`${value}`, 'Count']}
        />
        <Bar 
          dataKey="value" 
          fill={DEFAULT_COLOR}
          barSize={20}
          radius={[0, 4, 4, 0]}
        >
          {sortedData.map((entry, index) => (
            <LabelList 
              key={`label-${index}`}
              dataKey="value" 
              position="right" 
              style={{ fill: 'white' }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}