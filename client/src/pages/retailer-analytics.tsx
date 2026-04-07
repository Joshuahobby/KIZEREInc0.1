import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { Download, TrendingUp, Users, Package } from "lucide-react";

export default function RetailerAnalytics() {
  const { t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pos/my-stats"],
    queryFn: () => apiRequest("/api/pos/my-stats"),
  });

  const dailyRegistrations = data?.stats?.trends?.registrations || [];

  const categoryPerformance = (data?.stats?.productsByCategory || []).map((c: any) => ({
    name: c.category,
    value: c.count
  }));

  const totalRegistrations = data?.stats?.totalProducts || 0;
  const newCustomers = data?.stats?.totalCustomers || 0;
  
  // Find top category
  let topCategory = "None";
  if (categoryPerformance.length > 0) {
    const top = [...categoryPerformance].sort((a, b) => b.value - a.value)[0];
    if (top) topCategory = top.name;
  }

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
          description={t("pos.analytics.subtitle") || "Deep dive into your store's performance metrics."}
          actions={
            <Button variant="outline" className="gap-2 shadow-sm border-primary/20 hover:bg-primary/5">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                  <h3 className="text-2xl font-black">{isLoading ? "-" : totalRegistrations}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Customers</p>
                  <h3 className="text-2xl font-black">{isLoading ? "-" : newCustomers}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Category</p>
                  <h3 className="text-2xl font-black">{isLoading ? "-" : topCategory}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl">
            <CardHeader>
              <CardTitle>Daily Registrations</CardTitle>
              <CardDescription>Number of items registered in the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[300px] rounded-xl" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyRegistrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                      />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl">
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Registration breakdown by item type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[300px] rounded-xl" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryPerformance} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={80} />
                      <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
}
