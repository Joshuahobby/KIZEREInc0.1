import * as React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AppLayout } from "@/components/layout/admin-layout";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, TrendingUp, Package, Users, Activity } from "lucide-react";
import { format, subDays } from "date-fns";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function PosAnalyticsPage() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = React.useState(30);

  const startDate = React.useMemo(() => subDays(new Date(), dateRange).toISOString(), [dateRange]);
  const endDate = React.useMemo(() => new Date().toISOString(), [dateRange]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pos/admin/analytics", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/pos/admin/analytics?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      return json.analytics;
    },
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t("pos.analytics.title", "POS Analytics")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t("pos.analytics.subtitle", "Monitor platform-wide point of sale activity.")}
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <option value={7}>{t("pos.analytics.last7Days", "Last 7 Days")}</option>
            <option value={30}>{t("pos.analytics.last30Days", "Last 30 Days")}</option>
            <option value={90}>{t("pos.analytics.last90Days", "Last 90 Days")}</option>
            <option value={365}>{t("pos.analytics.lastYear", "Last Year")}</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <div className="text-center py-12 text-slate-500">Failed to load analytics data.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {t("pos.analytics.totalRegistrations", "Total Registrations")}
                  </CardTitle>
                  <Package className="w-4 h-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.totalRegistrations.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {t("pos.analytics.totalTransfers", "Total Transfers")}
                  </CardTitle>
                  <Activity className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.totalTransfers.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {t("pos.analytics.activeRetailers", "Active Retailers")}
                  </CardTitle>
                  <Users className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.activeRetailers.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registrations Over Time */}
              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg">
                <CardHeader>
                  <CardTitle>{t("pos.analytics.registrationsChart", "Registrations Over Time")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.registrationsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(val) => format(new Date(val), 'MMM d')}
                          stroke="#64748b" 
                          fontSize={12} 
                        />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                          labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReg)" name="Registrations" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Transfers Over Time */}
              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg">
                <CardHeader>
                  <CardTitle>{t("pos.analytics.transfersChart", "Transfers Over Time")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.transfersOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(val) => format(new Date(val), 'MMM d')}
                          stroke="#64748b" 
                          fontSize={12} 
                        />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                          labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTrans)" name="Transfers" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Retailers */}
              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg">
                <CardHeader>
                  <CardTitle>{t("pos.analytics.topRetailers", "Top Retailers (by volume)")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.topRetailers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Registrations">
                          {data.topRetailers.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="bg-white dark:bg-slate-900 border-none shadow-lg">
                <CardHeader>
                  <CardTitle>{t("pos.analytics.categoryBreakdown", "Category Breakdown")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="category"
                        >
                          {data.categoryBreakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}