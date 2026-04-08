import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiGet } from "@/lib/api";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { Download, TrendingUp, Users, Package, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { subDays, startOfMonth, startOfYear, format } from "date-fns";

const TIMEFRAMES = [
  { label: "Last 7 days",  value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
  { label: "This month",   value: "month" },
  { label: "This year",    value: "year" },
];

const CATEGORY_COLORS = [
  "hsl(var(--primary))", "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
];

function getDateRange(value: string): { startDate: string; endDate: string } {
  const now = new Date();
  let start: Date;
  if (value === "7d")    start = subDays(now, 7);
  else if (value === "14d") start = subDays(now, 14);
  else if (value === "30d") start = subDays(now, 30);
  else if (value === "month") start = startOfMonth(now);
  else start = startOfYear(now);
  return {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
  };
}

function StatCard({ icon, label, value, color, isLoading }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; isLoading: boolean;
}) {
  return (
    <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1 rounded-lg" />
            ) : (
              <h3 className="text-2xl font-black">{value}</h3>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RetailerAnalytics() {
  const { t } = useLanguage();
  const [timeframe, setTimeframe] = useState("14d");
  const { startDate, endDate } = getDateRange(timeframe);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pos/my-stats", timeframe],
    queryFn: () =>
      apiGet<{ stats: any }>(`/api/pos/my-stats?startDate=${startDate}&endDate=${endDate}`),
  });

  const stats = data?.stats;
  const dailyRegistrations = stats?.trends?.registrations || [];
  const dailyTransfers    = stats?.trends?.transfers || [];
  const categoryData      = (stats?.productsByCategory || []).map((c: any, i: number) => ({
    name: c.category || "Unknown",
    value: Number(c.count),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
  const statusData = (stats?.productsByStatus || []).map((s: any) => ({
    name: s.status,
    count: Number(s.count),
  }));
  const securityAlerts = stats?.securityAlerts || [];
  const topCategory = categoryData.length > 0
    ? [...categoryData].sort((a, b) => b.value - a.value)[0]?.name
    : "None";

  // Merge registrations + transfers into one timeline
  const timeline = (() => {
    const map: Record<string, { date: string; registrations: number; transfers: number }> = {};
    for (const r of dailyRegistrations) {
      const d = r.date?.slice(0, 10) || r.date;
      map[d] = { date: d, registrations: Number(r.count), transfers: 0 };
    }
    for (const t of dailyTransfers) {
      const d = t.date?.slice(0, 10) || t.date;
      if (!map[d]) map[d] = { date: d, registrations: 0, transfers: 0 };
      map[d].transfers = Number(t.count);
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container max-w-7xl mx-auto py-6 space-y-6"
      >
        <DashboardPageHeader
          title={t("pos.analytics.title") || "Analytics & Insights"}
          description={t("pos.analytics.subtitle") || "Deep dive into your store performance metrics."}
          actions={
            <div className="flex items-center gap-3">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40 rounded-xl border-border/50 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2 shadow-sm border-primary/20 hover:bg-primary/5">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          }
        />

        {/* KPI cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            icon={<Package className="h-6 w-6 text-blue-500" />}
            label="Total Products"
            value={stats?.totalProducts ?? 0}
            color="bg-blue-500/10"
            isLoading={isLoading}
          />
          <StatCard
            icon={<Users className="h-6 w-6 text-emerald-500" />}
            label="Unique Customers"
            value={stats?.totalCustomers ?? 0}
            color="bg-emerald-500/10"
            isLoading={isLoading}
          />
          <StatCard
            icon={<ArrowRightLeft className="h-6 w-6 text-indigo-500" />}
            label="Transfers"
            value={stats?.totalTransfers ?? 0}
            color="bg-indigo-500/10"
            isLoading={isLoading}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-purple-500" />}
            label="Top Category"
            value={isLoading ? "—" : topCategory}
            color="bg-purple-500/10"
            isLoading={isLoading}
          />
        </div>

        {/* Activity chart + category breakdown */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl">
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>Registrations vs transfers for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[280px] rounded-xl" />
              ) : timeline.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No activity in this period.
                </div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradTrans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={d => format(new Date(d), "MMM d")} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="registrations" name="Registrations" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#gradReg)" />
                      <Area type="monotone" dataKey="transfers" name="Transfers" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#gradTrans)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl">
            <CardHeader>
              <CardTitle>By Category</CardTitle>
              <CardDescription>Product distribution across types</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[280px] rounded-xl" />
              ) : categoryData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No data.</div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}>
                        {categoryData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status breakdown + Security alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl">
            <CardHeader>
              <CardTitle>Product Status Breakdown</CardTitle>
              <CardDescription>Current status across all registered products</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[220px] rounded-xl" />
              ) : statusData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data.</div>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  Security Alerts
                </CardTitle>
                <CardDescription>Recent stolen item reports at your store</CardDescription>
              </div>
              {securityAlerts.length > 0 && (
                <Badge variant="destructive" className="font-mono text-xs">{securityAlerts.length}</Badge>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                </div>
              ) : securityAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <ShieldAlert className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No security alerts recorded.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityAlerts.map((alert: any) => (
                    <div key={alert.id} className="flex items-start justify-between p-3 rounded-2xl bg-destructive/5 border border-destructive/10">
                      <div>
                        <p className="font-semibold text-sm">{alert.productName || "Unknown product"}</p>
                        <p className="text-xs font-mono text-muted-foreground">{alert.serialNumber}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {alert.timestamp ? format(new Date(alert.timestamp), "MMM d") : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
}
