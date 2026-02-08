import * as React from "react";
import { useLoadingState } from "../../hooks/use-loading-state";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * Loading overlay that appears during page transitions
 */
export function LoadingOverlay({ alwaysShow = false }: { alwaysShow?: boolean }) {
  const { isLoading: contextLoading } = useLoadingState();
  const isLoading = alwaysShow || contextLoading;


  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex flex-col items-center space-y-4 rounded-lg bg-card p-6 shadow-lg"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">Loading...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}