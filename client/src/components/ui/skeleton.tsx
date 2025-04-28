import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 relative overflow-hidden';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'rounded h-4';
      default:
        return 'rounded-md';
    }
  };

  const styles: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%')
  };
  
  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={styles}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"
          animate={{ x: ['0%', '200%'] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
            delay: Math.random() * 0.5 // Add randomness to make multiple skeletons look more natural
          }}
        />
      )}
    </div>
  );
}

// Specialized skeleton components for common use cases

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton variant="text" width="60%" />
      <Skeleton height={150} />
      <div className="space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
}

export function ItemSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Skeleton height={180} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="40%" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="circular" width={30} height={30} />
          <Skeleton width={100} height={30} />
        </div>
      </div>
    </div>
  );
}

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton variant="text" width={120} />
      <Skeleton height={40} />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex space-x-4 py-3">
      <Skeleton width="20%" height={20} variant="text" />
      <Skeleton width="30%" height={20} variant="text" />
      <Skeleton width="15%" height={20} variant="text" />
      <Skeleton width="15%" height={20} variant="text" />
      <Skeleton width="10%" height={20} variant="text" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="space-y-2">
          <Skeleton variant="text" width={150} />
          <Skeleton variant="text" width={100} />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}