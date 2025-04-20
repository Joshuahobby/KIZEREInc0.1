import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PaymentData {
  name: string;
  value: number;
  type?: string;
}

interface PaymentChartProps {
  paymentData?: PaymentData[];
  isLoading?: boolean;
}

export function PaymentAnalyticsChart({ paymentData = [], isLoading = false }: PaymentChartProps) {
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
  const [defaultData] = useState([
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 },
    { name: 'May', value: 0 },
    { name: 'Jun', value: 0 },
    { name: 'Jul', value: 0 },
    { name: 'Aug', value: 0 },
    { name: 'Sep', value: 0 },
    { name: 'Oct', value: 0 },
    { name: 'Nov', value: 0 },
    { name: 'Dec', value: 0 },
  ]);

  const data = paymentData.length > 0 ? paymentData : defaultData;
  
  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Payment Analytics</CardTitle>
        <Select
          value={chartType}
          onValueChange={(value) => setChartType(value as 'area' | 'bar' | 'line')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="area">Area Chart</SelectItem>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}