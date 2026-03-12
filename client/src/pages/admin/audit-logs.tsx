
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { PageLayout } from "@/components/layout/page-layout";
import { AppLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Shield, Search, ChevronLeft, ChevronRight, Activity, User, Clock, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface AuditLog {
    id: number;
    userId: number | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    metadata: any;
    ipAddress: string | null;
    createdAt: string;
    userName: string | null;
    userEmail: string | null;
}

interface AuditResponse {
    logs: AuditLog[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const actionColors: Record<string, string> = {
    user_create: "bg-green-500/10 text-green-600 border-green-200",
    user_update: "bg-blue-500/10 text-blue-600 border-blue-200",
    user_delete: "bg-red-500/10 text-red-600 border-red-200",
    user_ban: "bg-red-500/10 text-red-600 border-red-200",
    user_role_change: "bg-purple-500/10 text-purple-600 border-purple-200",
    role_create: "bg-green-500/10 text-green-600 border-green-200",
    role_update: "bg-blue-500/10 text-blue-600 border-blue-200",
    role_delete: "bg-red-500/10 text-red-600 border-red-200",
    item_approve: "bg-green-500/10 text-green-600 border-green-200",
    item_delete: "bg-red-500/10 text-red-600 border-red-200",
    login: "bg-sky-500/10 text-sky-600 border-sky-200",
    logout: "bg-gray-500/10 text-gray-600 border-gray-200",
};

function AuditLogsPage() {
    const { user, isLoading: isLoadingAuth } = useAuth();
    const [page, setPage] = useState(1);

    if (!user && !isLoadingAuth) {
        return (
            <PageLayout>
                <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
                    <AuthWall returnUrl="/admin/audit-logs" />
                </div>
            </PageLayout>
        );
    }
    const [actionFilter, setActionFilter] = useState("");
    const [entityFilter, setEntityFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        ...(actionFilter && actionFilter !== "all" && { action: actionFilter }),
        ...(entityFilter && entityFilter !== "all" && { entityType: entityFilter }),
    });

    const { data, isLoading } = useQuery<AuditResponse>({
        queryKey: [`/api/admin/audit-logs?${queryParams.toString()}`],
    });

    const logs = data?.logs || [];
    const pagination = data?.pagination;

    const formatAction = (action: string) => action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    const getTimeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <AppLayout>
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="h-6 w-6 text-primary" />
                            Audit Logs
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Track all administrative actions and system events
                        </p>
                    </div>
                    {pagination && (
                        <Badge variant="outline" className="text-xs">
                            {pagination.total} total entries
                        </Badge>
                    )}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="user_create">User Create</SelectItem>
                                    <SelectItem value="user_update">User Update</SelectItem>
                                    <SelectItem value="user_delete">User Delete</SelectItem>
                                    <SelectItem value="user_role_change">Role Change</SelectItem>
                                    <SelectItem value="role_create">Role Create</SelectItem>
                                    <SelectItem value="role_update">Role Update</SelectItem>
                                    <SelectItem value="role_delete">Role Delete</SelectItem>
                                    <SelectItem value="login">Login</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={entityFilter} onValueChange={v => { setEntityFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by entity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Entities</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="role">Role</SelectItem>
                                    <SelectItem value="item">Item</SelectItem>
                                    <SelectItem value="report">Report</SelectItem>
                                    <SelectItem value="claim">Claim</SelectItem>
                                    <SelectItem value="payment">Payment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Logs Timeline */}
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-350px)]">
                            {isLoading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading audit logs...</div>
                            ) : logs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>No audit logs found</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {logs.map((log, idx) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className={actionColors[log.action] || "bg-gray-100 text-gray-600"}>
                                                            {formatAction(log.action)}
                                                        </Badge>
                                                        {log.entityType && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                {log.entityType} #{log.entityId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {log.userName || log.userEmail || "System"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {getTimeAgo(log.createdAt)}
                                                        </span>
                                                        {log.ipAddress && (
                                                            <span className="hidden md:inline">{log.ipAddress}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline" size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default AuditLogsPage;
