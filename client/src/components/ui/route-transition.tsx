import { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface RouteTransitionProps {
  children: ReactNode;
}

/**
 * Simplified route transition component that uses AnimatePresence for transitions
 */
export function RouteTransition({ children }: RouteTransitionProps) {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      {/* Use the key to force re-render on route changes */}
      <div key={location}>{children}</div>
    </AnimatePresence>
  );
}