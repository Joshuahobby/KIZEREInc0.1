import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, ShieldCheck, ShoppingBag } from "lucide-react";
import { DashboardStats } from "@/hooks/use-dashboard-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface BusinessInsightsProps {
  userStats: DashboardStats;
}

export function BusinessInsights({ userStats }: BusinessInsightsProps) {
  const { t } = useLanguage();

  // Use real data from API or fall back to mock
  const registrationData = userStats.registrationTrends?.map((item: { date: string, count: number }) => ({
    name: item.date,
    count: item.count
  })) || [
      { name: "Mon", count: 1 },
      { name: "Tue", count: 3 },
      { name: "Wed", count: 2 },
      { name: "Thu", count: 4 },
      { name: "Fri", count: 6 },
      { name: "Sat", count: 8 },
      { name: "Sun", count: userStats.totalItems },
    ];

  const valueData = [
    { name: "Week 1", value: 1200 },
    { name: "Week 2", value: 2500 },
    { name: "Week 3", value: 3800 },
    { name: "Week 4", value: 5200 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.business.protectionRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">98%</div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('dashboard.business.itemsWithIds')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.business.assetRetention')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12 Days</div>
            <CardDescription className="text-xs mt-1">{t('dashboard.business.avgRecoveryTime')}</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.business.complianceScore')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <div className="text-3xl font-bold">A+</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <CardTitle>{t('dashboard.business.inventoryGrowth')}</CardTitle>
            </div>
            <CardDescription>{t('dashboard.business.inventoryDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>{t('dashboard.business.protectedValueTrend')}</CardTitle>
            </div>
            <CardDescription>{t('dashboard.business.protectedValueDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={valueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
