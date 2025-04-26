import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export interface UserRoleData {
  name: string;
  value: number;
  color?: string;
}

interface UserRoleDistributionProps {
  data: UserRoleData[];
  className?: string;
}

export function UserRoleDistribution({ data, className }: UserRoleDistributionProps) {
  // Default colors for user roles
  const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6'];
  
  return (
    <ResponsiveContainer width="100%" height={200} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={70}
          innerRadius={35}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${value}`, 'Users']}
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            borderColor: '#374151',
            borderRadius: '0.375rem',
            color: '#f3f4f6'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}