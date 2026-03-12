import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { PageLayout } from "@/components/layout/page-layout";
import { AppLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area
} from "recharts";
import {
    Users,
    Package,
    FileText,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Activity,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#0ea5e9", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"];
const STATUS_COLORS = {
    successful: "#10b981",
    pending: "#f59e0b",
    failed: "#ef4444",
};

export default function AnalyticsPage() {
    const { user, isLoading: isLoadingAuth } = useAuth();
    const { stats, chartData, isLoading } = useDashboardStats();

    if (!user && !isLoadingAuth) {
        return (
            <PageLayout>
                <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
                    <AuthWall returnUrl="/admin/analytics" />
                </div>
            </PageLayout>
        );
    }

    if (isLoading) {
        return (
            <AppLayout>
                <div className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
                        ))}
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Skeleton className="h-[400px] w-full rounded-3xl" />
                        <Skeleton className="h-[400px] w-full rounded-3xl" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    const kpis = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            change: "+12.5%",
            trend: "up",
            icon: Users,
            color: "blue",
        },
        {
            title: "Registered Items",
            value: stats.totalItems,
            change: "+8.2%",
            trend: "up",
            icon: Package,
            color: "indigo",
        },
        {
            title: "Active Reports",
            value: stats.pendingReports,
            change: "-3.1%",
            trend: "down",
            icon: FileText,
            color: "amber",
        },
        {
            title: "Total Revenue",
            value: `RWF ${(stats.totalPayments * 5000).toLocaleString()}`,
            change: "+15.3%",
            trend: "up",
            icon: CreditCard,
            color: "emerald",
        },
    ];

    return (
        <AppLayout>
            <div className="space-y-8 animate-in fade-in duration-700">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Activity className="h-8 w-8 text-primary" />
                            Platform Analytics
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Comprehensive overview of KIZERE system performance and user growth.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                            Real-time Monitoring
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1">
                            v1.2.0
                        </Badge>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi, index) => (
                        <motion.div
                            key={kpi.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="border-none bg-card/40 backdrop-blur-xl shadow-xl shadow-neutral-200/20 dark:shadow-none rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-2xl bg-${kpi.color}-500/10 text-${kpi.color}-500 group-hover:scale-110 transition-transform duration-500`}>
                                            <kpi.icon className="h-6 w-6" />
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm font-bold ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {kpi.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            {kpi.change}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{kpi.title}</p>
                                        <h3 className="text-3xl font-black mt-1 tracking-tighter">{kpi.value}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid gap-8 md:grid-cols-2">
                    {/* User Distribution */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="border-none bg-card/40 backdrop-blur-xl shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    User Role Distribution
                                </CardTitle>
                                <CardDescription>Breakdown of platform participants by assigned roles.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <div className="h-[300px] mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData.userRoleData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={100}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {chartData.userRoleData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Item Status Statistics */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="border-none bg-card/40 backdrop-blur-xl shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Item Status Analytics
                                </CardTitle>
                                <CardDescription>Current status of all assets registered on the platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <div className="h-[300px] mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData.itemStatusData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                                {chartData.itemStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Payment Performance */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="md:col-span-2"
                    >
                        <Card className="border-none bg-card/40 backdrop-blur-xl shadow-xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl font-black flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                            Financial Health & Payment Status
                                        </CardTitle>
                                        <CardDescription>Detailed analysis of transaction success and processing status.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-bold uppercase tracking-tighter">Success Rate: 92%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="h-[250px] md:col-span-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData.paymentStatusData}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#0ea5e9"
                                                    strokeWidth={4}
                                                    fillOpacity={1}
                                                    fill="url(#colorValue)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black uppercase text-emerald-600">Successful</span>
                                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="text-2xl font-black">{stats.paymentStats.successfulPayments}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Verified transactions</p>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black uppercase text-amber-600">Pending</span>
                                                <Activity className="h-4 w-4 text-amber-600" />
                                            </div>
                                            <div className="text-2xl font-black">{stats.paymentStats.pendingPayments}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black uppercase text-rose-600">Failed</span>
                                                <AlertCircle className="h-4 w-4 text-rose-600" />
                                            </div>
                                            <div className="text-2xl font-black">{stats.paymentStats.failedPayments}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Disputed or rejected</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
