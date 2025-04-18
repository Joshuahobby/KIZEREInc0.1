import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  passwordStrength: {
    isStrong: boolean;
    message: string;
  } | null;
}

export function PasswordStrengthIndicator({ passwordStrength }: PasswordStrengthIndicatorProps) {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    // Show strength indicator when passwordStrength changes
    if (passwordStrength) {
      setVisible(true);
    }
  }, [passwordStrength]);

  if (!passwordStrength) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`flex items-center text-sm space-x-2 mt-1.5 rounded-md p-1.5 ${
            passwordStrength.isStrong
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {passwordStrength.isStrong ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{passwordStrength.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}