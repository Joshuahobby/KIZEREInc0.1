import React from 'react';
import { PackageX, Search, AlertCircle, Info } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center p-8 rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-background border border-dashed",
        subtle: "bg-muted/20",
        bordered: "border border-border",
        error: "bg-destructive/10 border border-destructive/20",
        warning: "bg-warning/10 border border-warning/20",
        success: "bg-success/10 border border-success/20",
      },
      size: {
        default: "p-8 gap-4",
        sm: "p-4 gap-2",
        lg: "p-12 gap-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant,
  size,
  className,
  ...props
}: EmptyStateProps) {
  // Default icon based on variant
  const defaultIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-12 w-12 text-warning" />;
      case 'success':
        return <Info className="h-12 w-12 text-success" />;
      case 'default':
      default:
        return <PackageX className="h-12 w-12 text-muted-foreground" />;
    }
  };

  // Adjust icon size based on the size prop
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-16 w-16';
      default:
        return 'h-12 w-12';
    }
  };

  return (
    <div
      className={cn(emptyStateVariants({ variant, size }), className)}
      {...props}
    >
      {icon ? (
        <div className={getIconSize()}>{icon}</div>
      ) : (
        defaultIcon()
      )}
      <div className="space-y-2">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}