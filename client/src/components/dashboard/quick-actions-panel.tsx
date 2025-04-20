import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  PlusCircle,
  ArrowRight
} from "lucide-react";

/**
 * Quick Actions Panel Component
 * 
 * Prominently displays common tasks for quick access
 */
export const QuickActionsPanel = () => {
  return (
    <Card className="bg-gradient-to-br from-[#00BFFF]/5 to-[#FFDD00]/5 border-[#00BFFF]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center">
          <PlusCircle className="h-5 w-5 mr-2 text-[#00BFFF]" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton 
            icon={<ClipboardList className="h-5 w-5 mb-1" />}
            label="Register Item"
            href="/register-item"
            color="from-[#00BFFF] to-[#0099CC] hover:from-[#33CCFF] hover:to-[#00BFFF]"
            delay={0}
          />
          
          <ActionButton 
            icon={<AlertTriangle className="h-5 w-5 mb-1" />}
            label="Report Lost"
            href="/lost-found/report?type=lost"
            color="from-[#FF4D4D] to-[#CC0000] hover:from-[#FF6666] hover:to-[#FF4D4D]"
            delay={0.1}
          />
          
          <ActionButton 
            icon={<CheckCircle2 className="h-5 w-5 mb-1" />}
            label="Report Found"
            href="/lost-found/report?type=found"
            color="from-[#4CAF50] to-[#388E3C] hover:from-[#66BB6A] hover:to-[#4CAF50]"
            delay={0.2}
          />
          
          <ActionButton 
            icon={<Search className="h-5 w-5 mb-1" />}
            label="Search Items"
            href="/search"
            color="from-[#9C27B0] to-[#7B1FA2] hover:from-[#BA68C8] hover:to-[#9C27B0]"
            delay={0.3}
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
  delay?: number;
}

/**
 * Animated Action Button Component
 */
const ActionButton = ({ icon, label, href, color, delay = 0 }: ActionButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button 
        className={`flex flex-col h-auto py-4 w-full bg-gradient-to-r ${color} text-white group relative overflow-hidden`}
        onClick={() => window.location.href = href}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative z-10 flex flex-col items-center">
          {icon}
          <span>{label}</span>
        </div>
        
        <motion.div 
          className="absolute bottom-0 right-0 p-1"
          initial={{ x: 20, y: 20, opacity: 0 }}
          animate={{ 
            x: isHovered ? 5 : 20, 
            y: isHovered ? 5 : 20, 
            opacity: isHovered ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
        >
          <ArrowRight className="h-4 w-4 text-white/70" />
        </motion.div>
      </Button>
    </motion.div>
  );
};