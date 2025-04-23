import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page transition component that adds smooth animations when switching between pages
 */
export function PageTransition({ children, className = "" }: PageTransitionProps) {
  // Variants for the page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 8,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -8,
    },
  };

  // Transition configuration
  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}