import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Check for user's preferred theme
  useEffect(() => {
    // Check local storage
    const savedTheme = localStorage.getItem("kizere-theme") as "light" | "dark" | null;
    
    // If saved in local storage, use that
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } 
    // If user prefers dark mode via OS/browser settings
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Save to localStorage
    localStorage.setItem("kizere-theme", newTheme);
    
    // Toggle class on html element
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className="relative overflow-hidden rounded-full"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div className="relative">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: theme === "dark" ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: theme === "light" ? 1 : 0 }}
        >
          <Sun className="h-5 w-5" />
        </motion.div>
        
        <motion.div
          initial={{ rotate: -45 }}
          animate={{ rotate: theme === "dark" ? 0 : -45 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: theme === "dark" ? 1 : 0 }}
        >
          <Moon className="h-5 w-5" />
        </motion.div>
      </div>
    </Button>
  );
}