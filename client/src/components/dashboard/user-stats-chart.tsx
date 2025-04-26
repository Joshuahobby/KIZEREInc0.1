import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface UserStatsChartProps {
  title?: string;
  description?: string;
  data?: any[];
}

export function UserRoleDistribution({
  title = "User Roles",
  description = "Distribution of users by role",
  data = [
    { name: "Subscribers", value: 72 },
    { name: "Agents", value: 23 },
    { name: "Admins", value: 5 },
  ],
}: UserStatsChartProps) {
  const COLORS = ["var(--chart-primary)", "var(--chart-secondary)", "var(--chart-accent)"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={(entry) => `${entry.name}: ${entry.value}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`${value}%`, "Percentage"]}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserGrowthChart({
  title = "User Growth",
  description = "New user registrations over time",
  data = [
    { name: "Jan", users: 120 },
    { name: "Feb", users: 145 },
    { name: "Mar", users: 162 },
    { name: "Apr", users: 190 },
    { name: "May", users: 210 },
    { name: "Jun", users: 252 },
    { name: "Jul", users: 265 },
  ],
}: UserStatsChartProps) {
  // This component can be implemented similar to PaymentAnalyticsChart 
  // but with appropriate data for user growth
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {/* Implement chart visualization here */}
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">User growth data visualization will be displayed here.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}