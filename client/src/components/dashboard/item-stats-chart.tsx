import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ItemStatsChartProps {
  title?: string;
  description?: string;
  data?: any[];
}

export function ItemStatusDistribution({
  title = "Item Status",
  description = "Distribution of items by registration status",
  data = [
    { name: "Registered", value: 65 },
    { name: "Lost", value: 25 },
    { name: "Found", value: 10 },
  ],
}: ItemStatsChartProps) {
  const COLORS = [
    "var(--chart-success)",
    "var(--chart-warning)",
    "var(--chart-danger)",
  ];

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

export function ItemCategoryChart({
  title = "Item Categories",
  description = "Distribution of items by category",
  data = [
    { name: "Electronics", value: 35 },
    { name: "Jewelry", value: 15 },
    { name: "Clothing", value: 20 },
    { name: "Documents", value: 18 },
    { name: "Other", value: 12 },
  ],
}: ItemStatsChartProps) {
  const colors = [
    "var(--chart-primary)",
    "var(--chart-secondary)",
    "var(--chart-success)",
    "var(--chart-warning)",
    "var(--chart-danger)",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`${value}%`, "Percentage"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}