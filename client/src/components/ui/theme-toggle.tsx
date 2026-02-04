import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Wait for component to be mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  if (!mounted) {
    return <div className="w-10 h-10"></div>; // Placeholder to avoid layout shift
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
        theme === 'light' 
          ? "bg-amber-50/50 border border-amber-100 hover:bg-amber-100/80" 
          : "hover:bg-blue-900/20 border border-transparent"
      )}
      aria-label="Toggle Theme"
    >
      <div className="relative h-5 w-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: theme === 'light' ? 1 : 0,
            y: theme === 'light' ? 0 : -10
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="h-5 w-5 text-amber-600" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: theme === 'dark' ? 1 : 0,
            y: theme === 'dark' ? 0 : 10
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="h-5 w-5 text-blue-400" />
        </motion.div>
      </div>
    </Button>
  );
}