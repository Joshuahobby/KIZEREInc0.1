import { ReactNode, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useLoadingState } from "@/hooks/use-loading-state";

interface RouteTransitionProps {
  children: ReactNode;
}

/**
 * Handles route transitions and triggers loading states
 * This component wraps the entire application to detect route changes
 */
export function RouteTransition({ children }: RouteTransitionProps) {
  const [location] = useLocation();
  const { startLoading, stopLoading } = useLoadingState();
  
  // Listen for location changes to trigger loading states
  useEffect(() => {
    // Start loading animation when route changes
    startLoading();
    
    // Stop loading after a short delay to allow for smooth transitions
    const timer = setTimeout(() => {
      stopLoading();
    }, 500); // Adjust timing as needed
    
    return () => clearTimeout(timer);
  }, [location, startLoading, stopLoading]);
  
  return (
    <AnimatePresence mode="wait">
      {/* Use the key to force re-render on route changes */}
      <div key={location}>{children}</div>
    </AnimatePresence>
  );
}