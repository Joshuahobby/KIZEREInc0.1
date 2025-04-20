import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniChartProps {
  data: number[];
  color: string;
  height?: number;
  animated?: boolean;
}

/**
 * MiniChart component for displaying small line charts in dashboard cards
 * 
 * Used to show data trends in a compact visual format
 */
export const MiniChart = ({ 
  data, 
  color, 
  height = 40, 
  animated = true 
}: MiniChartProps) => {
  // Convert simple number array to format required by recharts
  const chartData = data.map((value, index) => ({ value, index }));
  
  // Create animation variants for the chart
  const chartVariants = {
    hidden: { opacity: 0, pathLength: 0 },
    visible: { 
      opacity: 1, 
      pathLength: 1,
      transition: { 
        duration: 1.5, 
        ease: "easeInOut"
      } 
    }
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={animated}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * AnimatedMiniChart that leverages Framer Motion for more control over animations
 */
export const AnimatedMiniChart = ({ 
  data, 
  color, 
  height = 40 
}: MiniChartProps) => {
  // Convert simple number array to format required by recharts
  const chartData = data.map((value, index) => ({ value, index }));
  
  return (
    <motion.div
      className="w-full"
      style={{ height: `${height}px` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};