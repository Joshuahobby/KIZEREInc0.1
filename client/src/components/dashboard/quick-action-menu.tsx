import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  X,
  UserPlus,
  Package,
  FileText,
  BarChart3,
  Settings,
  FileEdit,
  BookOpen,
  Zap,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ShoppingCart,
  Tag
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionMenuProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  inline?: boolean;
  mobileNav?: boolean;
}

export function QuickActionMenu({
  isOpen: propIsOpen,
  onOpenChange,
  className,
  position = 'bottom-right',
  inline = false,
  mobileNav = false
}: QuickActionMenuProps) {
  const [isOpen, setIsOpen] = useState(propIsOpen || false);
  const [, navigate] = useLocation();
  const { t } = useLanguage();

  // Toggle menu open/closed
  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';

  // Actions available in the quick action menu filtered by role
  const allActions = [
    {
      icon: <ShoppingCart className="h-4 w-4" />,
      label: t('retailer.pos', 'POS Terminal'),
      description: t('retailer.posDesc', 'Open point of sale'),
      onClick: () => navigate('/pos'),
      roles: ['Retailer', 'Admin']
    },
    {
      icon: <Tag className="h-4 w-4" />,
      label: t('retailer.products', 'Inventory'),
      description: t('retailer.productsDesc', 'Manage product catalog'),
      onClick: () => navigate('/retailer/products'),
      roles: ['Retailer', 'Admin']
    },
    {
      icon: <Plus className="h-4 w-4" />,
      label: t('retailer.addProduct', 'Add New Product'),
      description: t('retailer.addProductDesc', 'Add item to inventory'),
      onClick: () => navigate('/retailer/products?add=true'),
      roles: ['Retailer', 'Admin']
    },
    {
      icon: <UserPlus className="h-4 w-4" />,
      label: t('dashboard.quickActions.addUser'),
      description: t('dashboard.quickActions.addUserDesc'),
      onClick: () => navigate('/admin/users/new'),
      roles: ['Admin']
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: t('dashboard.quickActions.registerItem'),
      description: t('dashboard.quickActions.registerItemDesc'),
      onClick: () => navigate(isAdmin ? '/admin/items/new' : '/register-item'),
      roles: ['Admin', 'Agent', 'Moderator', 'Subscriber', 'Business']
    },
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: t('dashboard.quickActions.reportLost'),
      description: t('dashboard.quickActions.reportLostDesc'),
      onClick: () => navigate('/report-lost'),
      roles: ['Admin', 'Agent', 'Moderator', 'Subscriber', 'Business']
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: t('dashboard.quickActions.reportFound'),
      description: t('dashboard.quickActions.reportFoundDesc'),
      onClick: () => navigate('/report-found'),
      roles: ['Admin', 'Agent', 'Moderator', 'Subscriber', 'Business']
    },
    {
      icon: <Plus className="h-4 w-4" />,
      label: t('dashboard.quickActions.pendingReports'),
      description: t('dashboard.quickActions.pendingReportsDesc'),
      onClick: () => navigate('/dashboard?tab=agent'),
      roles: ['Agent', 'Moderator', 'Admin']
    },
    {
      icon: <FileEdit className="h-4 w-4" />,
      label: t('dashboard.quickActions.processReports'),
      description: t('dashboard.quickActions.processReportsDesc'),
      onClick: () => navigate('/dashboard?tab=agent'),
      roles: ['Agent', 'Moderator', 'Admin']
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: t('dashboard.quickActions.newPackage'),
      description: t('dashboard.quickActions.newPackageDesc'),
      onClick: () => navigate('/admin/payment-packages/new'),
      roles: ['Admin']
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: t('dashboard.quickActions.payments'),
      description: t('dashboard.quickActions.paymentsDesc'),
      onClick: () => navigate('/admin/payment-dashboard'),
      roles: ['Admin']
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: t('dashboard.quickActions.analytics'),
      description: t('dashboard.quickActions.analyticsDesc'),
      onClick: () => navigate('/admin/analytics'),
      roles: ['Admin']
    },
    {
      icon: <ArrowUp className="h-4 w-4" />,
      label: t('common.scrollToTop', 'Scroll to Top'),
      description: t('dashboard.quickActions.scrollToTopDesc', 'Back to page top'),
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      roles: ['Admin', 'Agent', 'Moderator', 'Subscriber', 'Business', 'Retailer', 'Guest'] // Everyone
    }
  ];

  // Filter actions based on user role
  const actions = allActions.filter(action => {
    if (!user) return false;
    // For roles field, if user role is in the list, show it
    // Default to 'Subscriber' if no role specified on user object
    const userRole = user.role || 'Subscriber';
    return action.roles.includes(userRole);
  });

  // Position classes based on position prop
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  // Determine action menu position
  const getActionMenuPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-20 left-6';
      case 'top-right':
        return 'top-20 right-6';
      case 'bottom-left':
        return 'bottom-20 left-6';
      case 'bottom-right':
      default:
        return 'bottom-20 right-6';
    }
  };

  return (
    <div className={cn(inline && "relative")}>
      {/* Backdrop when menu is open (mobile only) */}
      <AnimatePresence>
        {isOpen && !inline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>

      {/* Quick action button */}
      {mobileNav ? (
        <button
          onClick={toggleMenu}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 group transition-all duration-300 px-4 py-2 rounded-2xl flex-1 h-full min-h-[64px]",
            isOpen ? "text-primary" : "text-white/40 hover:text-white",
            className
          )}
        >
          <div className={cn(
            "p-2.5 rounded-xl transition-all duration-300",
            isOpen ? "bg-primary/20 scale-110 shadow-[0_0_25px_rgba(var(--primary),0.3)]" : "group-hover:bg-white/5"
          )}>
            {isOpen ? <X className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
          </div>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300",
            isOpen ? "opacity-100 translate-y-0" : "opacity-40 translate-y-0.5"
          )}>
            {t('dashboard.quickActions.actions', 'Actions')}
          </span>
        </button>
      ) : (
        <Button
          size={inline ? "default" : "icon"}
          onClick={toggleMenu}
          className={cn(
            "z-50 shadow-premium transition-all duration-300",
            inline
              ? "relative h-14 rounded-2xl px-6 font-black uppercase tracking-widest text-xs border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary flex items-center gap-2"
              : "fixed h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex",
            !inline && getPositionClasses(),
            className
          )}
          variant={inline ? "outline" : "default"}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <>
              <Zap className={cn("h-5 w-5", inline && "fill-current")} />
              {inline && t('dashboard.quickActions.quickAction', 'Quick Action')}
            </>
          )}
        </Button>
      )}

      {/* Action menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: inline ? 20 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: inline ? 20 : 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "z-40 bg-card/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-border/50 w-64 overflow-hidden",
              inline ? "absolute bottom-full mb-4 right-0 origin-bottom-right" : "fixed",
              !inline && getActionMenuPositionClasses()
            )}
          >
            <div className="p-2 flex flex-col gap-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className="flex items-center gap-3 p-2.5 text-left rounded-xl hover:bg-primary/10 text-muted-foreground transition-all group"
                  onClick={() => {
                    action.onClick();
                    toggleMenu();
                  }}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
