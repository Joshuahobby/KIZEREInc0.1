import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryBreakdownChartProps {
  title: string;
  description?: string;
  data: Record<string, number>;
  isLoading?: boolean;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#64748b', '#a855f7', '#14b8a6', '#d946ef'
];

export function CategoryBreakdownChart({ 
  title, 
  description, 
  data = {}, 
  isLoading = false 
}: CategoryBreakdownChartProps) {
  
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border shadow-sm rounded-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">
            Count: <span className="font-semibold">{payload[0].value}</span>
          </p>
          <p className="text-sm">
            Percentage: <span className="font-semibold">
              {Math.round((payload[0].value / (total || 1)) * 100)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground italic text-xs">No category data available yet.</p>
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
