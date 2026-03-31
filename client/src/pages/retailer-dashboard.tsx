import React from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Users, ArrowRightLeft, Activity } from "lucide-react";
import { format } from "date-fns";

export default function RetailerDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/pos/my-stats"],
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/pos/my-products"],
  });

  const stats = statsData?.stats;
  const products = productsData?.products || [];

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
          title={t("pos.retailerDashboard") || "Retailer Dashboard"}
          description={t("pos.retailerDashboardDesc") || "Overview of your POS registrations and activity"}
        />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title={t("pos.totalProducts") || "Total Products"}
            value={statsLoading ? "..." : stats?.totalProducts || 0}
            icon={<Package className="h-5 w-5" />}
            iconBgClass="bg-blue-100 dark:bg-blue-900/30"
            iconTextClass="text-blue-600 dark:text-blue-400"
          />
          <StatsCard
            title={t("pos.totalTransfers") || "Total Transfers"}
            value={statsLoading ? "..." : stats?.totalTransfers || 0}
            icon={<ArrowRightLeft className="h-5 w-5" />}
            iconBgClass="bg-green-100 dark:bg-green-900/30"
            iconTextClass="text-green-600 dark:text-green-400"
          />
          <StatsCard
            title={t("pos.uniqueCustomers") || "Unique Customers"}
            value={statsLoading ? "..." : stats?.totalCustomers || 0}
            icon={<Users className="h-5 w-5" />}
            iconBgClass="bg-purple-100 dark:bg-purple-900/30"
            iconTextClass="text-purple-600 dark:text-purple-400"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
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
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium capitalize">{activity.event}</p>
                        <p className="text-xs text-muted-foreground">Product ID: {activity.productId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono">{format(new Date(activity.timestamp), "MMM d, yyyy HH:mm")}</p>
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground max-w-[150px] truncate">{activity.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  {t("pos.noActivity") || "No recent activity found."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("pos.recentProducts") || "Recent Registrations"}
              </CardTitle>
              <CardDescription>
                {t("pos.recentProductsDesc") || "Latest products registered by your business"}
              </CardDescription>
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
                        <TableHead>Serial</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.slice(0, 5).map((product: any) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-xs">{product.serialNumber}</TableCell>
                          <TableCell className="font-medium text-sm">{product.name}</TableCell>
                          <TableCell className="text-xs">{product.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {product.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
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
