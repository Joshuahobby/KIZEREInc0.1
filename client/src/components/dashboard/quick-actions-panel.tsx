import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@shared/schema";
import {
  PlusCircle,
  Search,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileEdit,
  FileText,
  UserCircle,
  Settings,
  BarChart3,
  Lock,
  Smartphone,
  Bookmark,
  Upload,
  Download,
  Package,
  CreditCard,
  LogOut,
  ShieldCheck,
  FileUp,
  FileDown
} from "lucide-react";

interface QuickActionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color?: string;
  isDisabled?: boolean;
}

interface QuickActionsPanelProps {
  user: Omit<User, "password">;
}

const QuickActionItem: React.FC<QuickActionItemProps> = ({
  icon,
  title,
  description,
  href,
  color = "primary",
  isDisabled = false
}) => {
  const [, navigate] = useLocation();
  const { signOut } = useAuth(); // We need to import useAuth

  const handleClick = () => {
    if (isDisabled) return;

    if (href.includes('logout=true')) {
      signOut();
    } else {
      navigate(href);
    }
  };

  const colorVariants: Record<string, string> = {
    primary: "bg-primary/10 text-primary hover:bg-primary/20",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50",
  };

  const colorClass = colorVariants[color] || colorVariants.primary;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all duration-300 ease-in-out hover:translate-x-1 group ${colorClass} ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md border border-transparent hover:border-white/20"
        }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-white/95 dark:bg-background/95 shadow-sm group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm tracking-tight">{title}</h3>
          <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
};

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ user }) => {
  const isAdmin = user?.role === "Admin";
  const isAgent = user?.role === "Agent";

  // Common actions for all users
  const commonActions: QuickActionItemProps[] = [
    {
      icon: <PlusCircle className="h-5 w-5 text-blue-600" />,
      title: "Register New Item",
      description: "Add a new item to your inventory",
      href: "/register-item",
      color: "blue"
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      title: "Report Lost Item",
      description: "File a lost item report",
      href: "/lost-found/report/lost",
      color: "amber"
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      title: "Report Found Item",
      description: "Submit a found item report",
      href: "/lost-found/report/found",
      color: "green"
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-indigo-600" />,
      title: "View My Claims",
      description: "Manage your item ownership claims",
      href: "/dashboard?tab=claims",
      color: "blue"
    },
    {
      icon: <Search className="h-5 w-5 text-purple-600" />,
      title: "Advanced Search",
      description: "Find items with detailed filters",
      href: "/search",
      color: "purple"
    }
  ];

  // Admin-specific actions
  const adminActions: QuickActionItemProps[] = [
    {
      icon: <UserCircle className="h-5 w-5 text-purple-600" />,
      title: "User Management",
      description: "Manage users and permissions",
      href: "/admin/users",
      color: "purple"
    },
    {
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      title: "Payment Dashboard",
      description: "Monitor transactions and revenue",
      href: "/admin/payment-dashboard",
      color: "green"
    },
    {
      icon: <Package className="h-5 w-5 text-blue-600" />,
      title: "Payment Packages",
      description: "Manage payment packages",
      href: "/admin/payment-packages",
      color: "blue"
    },
    {
      icon: <Settings className="h-5 w-5 text-amber-600" />,
      title: "System Settings",
      description: "Configure platform settings",
      href: "/admin/settings",
      color: "amber"
    }
  ];

  // Agent-specific actions
  const agentActions: QuickActionItemProps[] = [
    {
      icon: <FileText className="h-5 w-5 text-amber-600" />,
      title: "Pending Reports",
      description: "Review awaiting verification",
      href: "/agent/reports/pending",
      color: "amber"
    },
    {
      icon: <FileEdit className="h-5 w-5 text-blue-600" />,
      title: "Process Reports",
      description: "Verify and update reports",
      href: "/agent/reports/process",
      color: "blue"
    }
  ];

  // Determine which actions to show based on user role
  const actionsList = isAdmin
    ? [...adminActions, ...commonActions]
    : isAgent
      ? [...agentActions, ...commonActions]
      : commonActions;

  return (
    <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display flex items-center">
          <Bookmark className="h-5 w-5 mr-2 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Frequently used tools and shortcuts
        </CardDescription>
      </CardHeader>

      <CardContent className="py-0">
        <ScrollArea className="max-h-[330px] pr-3">
          <div className="space-y-1">
            {actionsList.map((action, index) => (
              <QuickActionItem
                key={index}
                icon={action.icon}
                title={action.title}
                description={action.description}
                href={action.href}
                color={action.color}
                isDisabled={action.isDisabled}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      {(isAdmin || isAgent) && (
        <CardFooter className="flex justify-between pt-5 border-t mt-3 gap-3">
          <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl border-dashed">
            <FileDown className="h-4 w-4 mr-2 text-primary" />
            <span className="text-xs font-bold">Export Data</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl border-dashed">
            <FileUp className="h-4 w-4 mr-2 text-primary" />
            <span className="text-xs font-bold">Import Data</span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};