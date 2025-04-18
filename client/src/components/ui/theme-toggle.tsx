import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Wait for component to be mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9"></div>; // Placeholder to avoid layout shift
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("light")}
        className={theme === "light" ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" : ""}
        aria-label="Light Mode"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ 
            scale: theme === "light" ? 1 : 0.8, 
            opacity: theme === "light" ? 1 : 0.6 
          }}
          transition={{ duration: 0.15 }}
        >
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        </motion.div>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("dark")}
        className={theme === "dark" ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" : ""}
        aria-label="Dark Mode"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ 
            scale: theme === "dark" ? 1 : 0.8, 
            opacity: theme === "dark" ? 1 : 0.6 
          }}
          transition={{ duration: 0.15 }}
        >
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        </motion.div>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("system")}
        className={theme === "system" ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300" : ""}
        aria-label="System Theme"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ 
            scale: theme === "system" ? 1 : 0.8, 
            opacity: theme === "system" ? 1 : 0.6 
          }}
          transition={{ duration: 0.15 }}
        >
          <Monitor className="h-[1.2rem] w-[1.2rem]" />
        </motion.div>
      </Button>
    </div>
  );
}