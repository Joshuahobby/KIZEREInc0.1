import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  X, 
  UserPlus, 
  Package, 
  FileText, 
  BarChart3, 
  Settings,
  Bell
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation, Link } from "wouter";

/**
 * QuickActionMenu component
 * 
 * A floating circular menu that provides quick access to critical functions
 * from anywhere in the admin dashboard
 */
export function QuickActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, navigate] = useLocation();

  // Define actions with their icons, labels, and navigation targets
  const actions = [
    { 
      icon: <UserPlus size={18} />, 
      label: "Add User", 
      color: "#00BFFF",
      onClick: () => navigate("/admin/users/new")
    },
    { 
      icon: <Package size={18} />, 
      label: "Register Item", 
      color: "#00BFFF",
      onClick: () => navigate("/admin/items/new") 
    },
    { 
      icon: <FileText size={18} />, 
      label: "New Report", 
      color: "#00BFFF",
      onClick: () => navigate("/admin/reports/new") 
    },
    { 
      icon: <BarChart3 size={18} />, 
      label: "Analytics", 
      color: "#FFD700",
      onClick: () => navigate("/admin/analytics") 
    },
    { 
      icon: <Bell size={18} />, 
      label: "Notifications", 
      color: "#FFD700",
      onClick: () => navigate("/admin/notifications") 
    },
    { 
      icon: <Settings size={18} />, 
      label: "Settings", 
      color: "#FFD700",
      onClick: () => navigate("/admin/settings") 
    },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <TooltipProvider>
        {/* Main toggle button */}
        <motion.button
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#00BFFF] text-white shadow-lg hover:bg-[#00BFFF]/90 focus:outline-none"
          onClick={toggleMenu}
          whileTap={{ scale: 0.95 }}
          aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X size={24} /> : <Plus size={24} />}
          </motion.div>
        </motion.button>

        {/* Action buttons that appear when menu is open */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Semi-transparent overlay to capture clicks outside */}
              <motion.div
                className="fixed inset-0 bg-black/20 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Action buttons */}
              {actions.map((action, index) => (
                <Tooltip key={action.label}>
                  <TooltipTrigger asChild>
                    <motion.button
                      className="absolute right-3 w-10 h-10 rounded-full text-white shadow-md flex items-center justify-center"
                      style={{ backgroundColor: action.color }}
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ 
                        opacity: 1, 
                        y: -60 * (index + 1),
                        transition: { 
                          delay: 0.05 * index,
                          type: "spring",
                          stiffness: 260,
                          damping: 20
                        }
                      }}
                      exit={{ 
                        opacity: 0, 
                        y: 0,
                        transition: { 
                          delay: 0.03 * (actions.length - index),
                          duration: 0.2
                        }
                      }}
                      onClick={action.onClick}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={action.label}
                    >
                      {action.icon}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </>
          )}
        </AnimatePresence>
      </TooltipProvider>
    </div>
  );
}