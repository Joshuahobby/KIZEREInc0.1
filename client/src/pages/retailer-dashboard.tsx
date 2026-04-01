import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Users, ArrowRightLeft, Activity, Store, Plus, TrendingUp, Calendar } from "lucide-react";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { useLocation } from "wouter";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Chart color palette (consistent with existing dashboard charts)
const CATEGORY_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
  "#64748b", "#a855f7", "#14b8a6", "#d946ef",
];

const STATUS_COLORS: Record<string, string> = {
  registered: "#3b82f6",
  transferred: "#10b981",
  stolen: "#ef4444",
  archived: "#64748b",
};

// Interfaces for the stats API response
interface RetailerStats {
  totalProducts: number;
  totalTransfers: number;
  totalCustomers: number;
  productsByCategory: { category: string; count: number }[];
  productsByStatus: { status: string; count: number }[];
  recentActivity: {
    id: number;
    event: string;
    productId: number;
    toUserId: number;
    notes: string | null;
    timestamp: string;
  }[];
}

interface PosProduct {
  id: number;
  serialNumber: string;
  name: string;
  category: string;
  status: string;
  registrationDate: string;
  sku: string | null;
}

// Custom tooltip for category donut chart
function CategoryTooltip({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border shadow-sm rounded-lg">
        <p className="font-medium text-sm">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          Count: <span className="font-semibold text-foreground">{payload[0].value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Share: <span className="font-semibold text-foreground">
            {Math.round((payload[0].value / (total || 1)) * 100)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
}

// Status badge with appropriate color
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    registered: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    transferred: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    stolen: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    archived: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[10px] capitalize font-semibold ${variants[status] || ""}`}
    >
      {status}
    </Badge>
  );
}

export default function RetailerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [dateRange, setDateRange] = useState<string>("all");

  // Calculate start/end dates based on selection
  const getDateParams = () => {
    if (dateRange === "all") return "";
    
    const now = new Date();
    let start;
    
    switch (dateRange) {
      case "7days": start = subDays(now, 7); break;
      case "30days": start = subDays(now, 30); break;
      case "this_month": start = startOfMonth(now); break;
      case "this_year": start = startOfYear(now); break;
      default: return "";
    }
    
    return `?startDate=${start.toISOString()}&endDate=${now.toISOString()}`;
  };

  const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; stats: RetailerStats }>({
    queryKey: ["/api/pos/my-stats", dateRange],
    queryFn: () => apiRequest(`/api/pos/my-stats${getDateParams()}`),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<{ success: boolean; products: PosProduct[] }>({
    queryKey: ["/api/pos/my-products"],
    queryFn: () => apiRequest("/api/pos/my-products"),
  });

  const stats = statsData?.stats;
  const products = productsData?.products || [];

  // Transform data for charts
  const categoryChartData = (stats?.productsByCategory || []).map((item, index) => ({
    name: item.category,
    value: item.count,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const statusChartData = (stats?.productsByStatus || []).map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    fill: STATUS_COLORS[item.status] || "#64748b",
  }));

  const categoryTotal = categoryChartData.reduce((sum, d) => sum + d.value, 0);
  const hasData = (stats?.totalProducts || 0) > 0;
  const isLoading = statsLoading || productsLoading;

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? (t("pos.goodMorning") || "Good morning")
    : hour < 18 ? (t("pos.goodAfternoon") || "Good afternoon")
    : (t("pos.goodEvening") || "Good evening");

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="container max-w-7xl mx-auto py-6 space-y-6"
      >
          <DashboardPageHeader
          title={`${greeting}, ${user?.fullName || user?.username || t("pos.retailer") || "Retailer"}`}
          description={t("pos.retailerDashboardDesc") || "Overview of your POS registrations and activity"}
          actions={
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px] bg-background">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allTime") || "All Time"}</SelectItem>
                  <SelectItem value="7days">{t("common.last7Days") || "Last 7 Days"}</SelectItem>
                  <SelectItem value="30days">{t("common.last30Days") || "Last 30 Days"}</SelectItem>
                  <SelectItem value="this_month">{t("common.thisMonth") || "This Month"}</SelectItem>
                  <SelectItem value="this_year">{t("common.thisYear") || "This Year"}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => navigate("/pos")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("pos.registerProduct") || "Register Product"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/pos")}
                className="gap-2"
              >
                <Store className="h-4 w-4" />
                {t("pos.openTerminal") || "Open POS"}
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={t("pos.totalProducts") || "Total Products"}
            value={statsLoading ? "..." : stats?.totalProducts || 0}
            icon={<Package className="h-5 w-5" />}
            iconBgClass="bg-blue-100 dark:bg-blue-900/30"
            iconTextClass="text-blue-600 dark:text-blue-400"
            isLoading={statsLoading}
          />
          <StatsCard
            title={t("pos.totalTransfers") || "Total Transfers"}
            value={statsLoading ? "..." : stats?.totalTransfers || 0}
            icon={<ArrowRightLeft className="h-5 w-5" />}
            iconBgClass="bg-green-100 dark:bg-green-900/30"
            iconTextClass="text-green-600 dark:text-green-400"
            isLoading={statsLoading}
          />
          <StatsCard
            title={t("pos.uniqueCustomers") || "Unique Customers"}
            value={statsLoading ? "..." : stats?.totalCustomers || 0}
            icon={<Users className="h-5 w-5" />}
            iconBgClass="bg-purple-100 dark:bg-purple-900/30"
            iconTextClass="text-purple-600 dark:text-purple-400"
            isLoading={statsLoading}
          />
          <StatsCard
            title={t("pos.categories") || "Categories"}
            value={statsLoading ? "..." : categoryChartData.length}
            icon={<TrendingUp className="h-5 w-5" />}
            iconBgClass="bg-orange-100 dark:bg-orange-900/30"
            iconTextClass="text-orange-600 dark:text-orange-400"
            isLoading={statsLoading}
          />
        </div>

        {/* Charts Row */}
        {hasData && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Products by Category - Donut Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  {t("pos.productsByCategory") || "Products by Category"}
                </CardTitle>
                <CardDescription>
                  {t("pos.productsByCategoryDesc") || "Distribution of registered products across categories"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <Skeleton className="h-[180px] w-[180px] rounded-full" />
                  </div>
                ) : categoryChartData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CategoryTooltip total={categoryTotal} />} />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    {t("pos.noData") || "No data available"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Products by Status - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  {t("pos.productsByStatus") || "Products by Status"}
                </CardTitle>
                <CardDescription>
                  {t("pos.productsByStatusDesc") || "Current status of all registered products"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-[250px] space-y-4 pt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : statusChartData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statusChartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                        <XAxis
                          dataKey="name"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          className="fill-muted-foreground"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number) => [`${value}`, "Count"]}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                          {statusChartData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    {t("pos.noData") || "No data available"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state for new retailers */}
        {!isLoading && !hasData && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Store className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("pos.welcomeTitle") || "Welcome to your POS Dashboard"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {t("pos.welcomeDesc") || "Start registering products through the POS terminal to see your activity, stats, and analytics here."}
              </p>
              <Button onClick={() => navigate("/pos")} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("pos.registerFirstProduct") || "Register Your First Product"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Activity & Products Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-muted-foreground" />
                {t("pos.recentActivity") || "Recent Activity"}
              </CardTitle>
              <CardDescription>
                {t("pos.recentActivityDesc") || "Latest events processed by your POS terminal"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${
                          activity.event === "sale" ? "bg-blue-500" :
                          activity.event === "transfer" ? "bg-green-500" :
                          activity.event === "stolen_report" ? "bg-red-500" :
                          "bg-gray-500"
                        }`} />
                        <div>
                          <p className="text-sm font-medium capitalize">{activity.event.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            KZR-{String(activity.productId).padStart(6, "0")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-muted-foreground">
                          {format(new Date(activity.timestamp), "MMM d, HH:mm")}
                        </p>
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground max-w-[150px] truncate">{activity.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t("pos.noActivity") || "No recent activity found."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    {t("pos.recentProducts") || "Recent Registrations"}
                  </CardTitle>
                  <CardDescription>
                    {t("pos.recentProductsDesc") || "Latest products registered by your business"}
                  </CardDescription>
                </div>
                {products.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    {products.length} {t("pos.total") || "total"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">{t("pos.serial") || "Serial"}</TableHead>
                        <TableHead className="text-xs">{t("pos.productName") || "Name"}</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">{t("pos.category") || "Category"}</TableHead>
                        <TableHead className="text-xs">{t("pos.status") || "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.slice(0, 8).map((product) => (
                        <TableRow key={product.id} className="group">
                          <TableCell className="font-mono text-xs">
                            {product.serialNumber}
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[160px] truncate">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            {product.category}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={product.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t("pos.noProducts") || "No products registered yet."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
}
