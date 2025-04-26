import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Sample data for demonstration
const revenueData = [
  { name: "Jan", revenue: 4500 },
  { name: "Feb", revenue: 5200 },
  { name: "Mar", revenue: 4800 },
  { name: "Apr", revenue: 6000 },
  { name: "May", revenue: 5600 },
  { name: "Jun", revenue: 7000 },
  { name: "Jul", revenue: 7600 },
];

interface PaymentAnalyticsChartProps {
  title?: string;
  description?: string;
  data?: any[];
}

export function PaymentAnalyticsChart({
  title = "Payment Analytics",
  description = "Overview of payment trends over time",
  data = revenueData,
}: PaymentAnalyticsChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius)",
                }}
                labelClassName="text-primary font-medium"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-primary)"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentStatusChart({ 
  data = [
    { name: "Successful", value: 65 },
    { name: "Pending", value: 20 },
    { name: "Failed", value: 15 },
  ] 
}) {
  const colors = [
    "var(--chart-success)",
    "var(--chart-warning)",
    "var(--chart-danger)",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
        <CardDescription>Distribution of payment statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`${value}%`, "Percentage"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <rect key={`rect-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}