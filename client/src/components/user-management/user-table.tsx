import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  User as UserIcon, 
  Shield, 
  Mail, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  MoreVertical,
  Settings2,
  ShieldCheck
} from "lucide-react";
import { User } from "@shared/schema";
import { format } from "date-fns";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onStatusChange: (userId: number, status: string) => void;
  onRoleChange: (userId: number, role: string) => void;
  onViewDetails: (user: User) => void;
  onVerify?: (user: User) => void;
}

const statusConfig = {
  active: { color: "bg-emerald-500", label: "Active", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  suspended: { color: "bg-amber-500", label: "Suspended", bg: "bg-amber-50 text-amber-700 border-amber-100" },
  inactive: { color: "bg-slate-400", label: "Inactive", bg: "bg-slate-50 text-slate-700 border-slate-100" },
  pending: { color: "bg-blue-500", label: "Pending", bg: "bg-blue-50 text-blue-700 border-blue-100" },
  banned: { color: "bg-red-500", label: "Banned", bg: "bg-red-50 text-red-700 border-red-100" },
};

const roleConfig = {
  Admin: { icon: Shield, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  Agent: { icon: UserIcon, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
  Moderator: { icon: Shield, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
  Subscriber: { icon: UserIcon, color: "text-slate-600", bg: "bg-slate-50 border-slate-100" },
  Business: { icon: UserIcon, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100" },
};

export function UserTable({ 
  users, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onRoleChange, 
  onViewDetails,
  onVerify
}: UserTableProps) {
  return (
    <div className="rounded-2xl border-2 border-primary/5 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm transition-all hover:shadow-md">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-primary/5">
            <TableHead className="w-[300px] py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">User / Identity</TableHead>
            <TableHead className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Role & Status</TableHead>
            <TableHead className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification</TableHead>
            <TableHead className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Registration</TableHead>
            <TableHead className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity</TableHead>
            <TableHead className="w-[80px] py-4 px-6 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {users.map((user, index) => {
              const status = (user.status || 'active') as keyof typeof statusConfig;
              const role = (user.role || 'Subscriber') as keyof typeof roleConfig;

              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group border-primary/5 transition-colors hover:bg-primary/[0.02]"
                >
                  <TableCell className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm transition-transform group-hover:scale-110">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                          {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {user.fullName || user.username}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-4">
                    <div className="flex flex-col gap-2">
                        {/* Role Badge */}
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border max-w-fit",
                            (roleConfig[role] || roleConfig.Subscriber).bg,
                            (roleConfig[role] || roleConfig.Subscriber).color
                        )}>
                            <Shield className="h-3 w-3" />
                            {user.role}
                        </div>
                        {/* Status Label with Dot */}
                        <div className="flex items-center gap-2 px-1">
                            <span className={cn("h-2 w-2 rounded-full", (statusConfig[status] || statusConfig.active).color)} />
                            <span className="text-[11px] font-medium text-muted-foreground capitalize">
                                {status}
                            </span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-4">
                    <div className="flex flex-col gap-2">
                       {/* Identity Verification */}
                       <div className="flex items-center gap-2">
                         {user.verificationStatus === 'approved' ? (
                           <ShieldCheck className="h-4 w-4 text-emerald-500" />
                         ) : user.verificationStatus === 'pending' || user.verificationStatus === 'in_review' ? (
                           <AlertCircle className="h-4 w-4 text-amber-500" />
                         ) : user.verificationStatus === 'rejected' ? (
                           <XCircle className="h-4 w-4 text-red-500" />
                         ) : (
                           <Shield className="h-4 w-4 text-muted-foreground" />
                         )}
                         <span className="text-xs font-medium">
                           {user.verificationStatus === 'approved' ? 'ID Verified' : 
                            user.verificationStatus === 'pending' || user.verificationStatus === 'in_review' ? 'ID Pending' : 
                            user.verificationStatus === 'rejected' ? 'ID Rejected' : 'ID Unverified'}
                         </span>
                       </div>
                       
                       {/* Email Verification */}
                       <div className="flex items-center gap-2">
                         {user.emailVerified ? (
                           <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                         ) : (
                           <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                         )}
                         <span className="text-[11px] text-muted-foreground">
                           {user.emailVerified ? "Email Verified" : "Email Unverified"}
                         </span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-foreground">
                        {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        Date Registered
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-4">
                    <div className="flex flex-col gap-1 text-[11px]">
                        <span className="text-muted-foreground">Last active:</span>
                        <span className="font-semibold text-foreground">
                            {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, HH:mm") : "Never"}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full transition-all hover:bg-primary/5 hover:text-primary active:scale-90"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px] p-2 rounded-xl shadow-xl border-primary/10 bg-background/95 backdrop-blur-md">
                        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem 
                            onClick={() => onViewDetails(user)}
                            className="rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-primary/5 hover:text-primary cursor-pointer"
                        >
                          <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Profile
                        </DropdownMenuItem>

                        {user.verificationStatus === 'pending' && onVerify && (
                          <DropdownMenuItem 
                              onClick={() => onVerify(user)}
                              className="rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 cursor-pointer"
                          >
                            <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Verify Identity
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                            onClick={() => onEdit(user)}
                            className="rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-primary/5 hover:text-primary cursor-pointer"
                        >
                          <Edit className="mr-2 h-3.5 w-3.5" /> Edit Identity
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1 bg-primary/5" />
                        
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer">
                            <Shield className="mr-2 h-3.5 w-3.5" /> Change Role
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="bg-background/95 backdrop-blur-md border-primary/10 rounded-xl p-1 min-w-[140px]">
                            <DropdownMenuRadioGroup value={user.role} onValueChange={(val) => onRoleChange(user.id, val)}>
                              <DropdownMenuRadioItem value="Admin" className="rounded-lg text-xs cursor-pointer">Admin</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="Agent" className="rounded-lg text-xs cursor-pointer">Agent</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="Subscriber" className="rounded-lg text-xs cursor-pointer">Subscriber</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer">
                            <Settings2 className="mr-2 h-3.5 w-3.5" /> Set Status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="bg-background/95 backdrop-blur-md border-primary/10 rounded-xl p-1 min-w-[140px]">
                            <DropdownMenuRadioGroup value={user.status || 'active'} onValueChange={(val) => onStatusChange(user.id, val)}>
                              <DropdownMenuRadioItem value="active" className="rounded-lg text-xs cursor-pointer">Active</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="suspended" className="rounded-lg text-xs cursor-pointer text-amber-600">Suspend</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="inactive" className="rounded-lg text-xs cursor-pointer text-slate-500">Inactivate</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator className="my-1 bg-primary/5" />
                        
                        <DropdownMenuItem 
                          onClick={() => onDelete(user)} 
                          className="rounded-lg px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}