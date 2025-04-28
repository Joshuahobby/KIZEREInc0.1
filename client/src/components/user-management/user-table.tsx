import { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { 
  MoreHorizontal, 
  ShieldAlert, 
  Eye, 
  Edit, 
  UserCog, 
  History, 
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  UserX,
  Check,
  X
} from "lucide-react";

export interface User {
  id: number;
  fullName: string;
  username?: string;
  email: string;
  role: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  warningCount: number;
  activityLevel?: string;
  avatarUrl?: string;
}

interface UserTableProps {
  users: User[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onStatusChange: (user: User, status: string) => void;
  onRoleChange: (user: User, role: string) => void;
}

export function UserTable({ 
  users, 
  totalPages, 
  currentPage, 
  onPageChange,
  onViewUser,
  onEditUser,
  onStatusChange,
  onRoleChange
}: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newRole, setNewRole] = useState('');
  const [statusReason, setStatusReason] = useState('');
  
  const handleStatusChange = () => {
    if (selectedUser && newStatus) {
      onStatusChange(selectedUser, newStatus);
      setShowStatusDialog(false);
      setNewStatus('');
      setStatusReason('');
      setSelectedUser(null);
    }
  };
  
  const handleRoleChange = () => {
    if (selectedUser && newRole) {
      onRoleChange(selectedUser, newRole);
      setShowRoleDialog(false);
      setNewRole('');
      setSelectedUser(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getVerificationBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return <Badge variant="success" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><ShieldX className="h-3 w-3" /> Rejected</Badge>;
      case 'unverified':
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Shield className="h-3 w-3" /> Unverified</Badge>;
    }
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Badge className="bg-purple-500">Admin</Badge>;
      case 'Agent':
        return <Badge className="bg-blue-500">Agent</Badge>;
      case 'Subscriber':
      default:
        return <Badge className="bg-gray-500">Subscriber</Badge>;
    }
  };
  
  const getActivityBadge = (level?: string) => {
    if (!level) return null;
    
    switch (level.toLowerCase()) {
      case 'high':
        return <Badge className="bg-green-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-yellow-500">Low</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return null;
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        {user.avatarUrl ? (
                          <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        ) : (
                          <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-semibold">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{getVerificationBadge(user.verificationStatus)}</TableCell>
                  <TableCell>{getActivityBadge(user.activityLevel)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(user.createdAt), 'PP')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.lastLogin 
                      ? format(new Date(user.lastLogin), 'PP') 
                      : <span className="text-muted-foreground">Never</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit user
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setShowRoleDialog(true);
                          }}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Change role
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedUser(user);
                            setNewStatus(user.status);
                            setShowStatusDialog(true);
                          }}>
                          <UserX className="mr-2 h-4 w-4" />
                          Change status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <History className="mr-2 h-4 w-4" />
                          View activity
                        </DropdownMenuItem>
                        {user.warningCount > 0 && (
                          <DropdownMenuItem className="text-amber-600">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            View warnings ({user.warningCount})
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center my-6">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
      
      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for change</Label>
              <Input
                id="reason"
                placeholder="Enter the reason for this status change"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select
                value={newRole}
                onValueChange={setNewRole}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Subscriber">Subscriber</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper component for Shield icon (required for verification badge)
function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}