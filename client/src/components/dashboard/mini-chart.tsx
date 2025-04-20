import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showArea?: boolean;
  showDots?: boolean;
  maxValue?: number;
}

/**
 * MiniChart Component
 * 
 * A small, lightweight chart component for displaying trends in dashboard cards
 * with a clean, minimalist design.
 */
export const MiniChart: React.FC<MiniChartProps> = ({
  data = [],
  color = '#3b82f6',
  height = 40,
  width = 100,
  showArea = true,
  showDots = true,
  maxValue: customMaxValue,
}) => {
  // Prepare chart data
  const maxValue = customMaxValue || Math.max(...data) * 1.2; // Add 20% padding to max value
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (value / maxValue) * height;
    return `${x},${y}`;
  }).join(' ');

  // Create path for area
  const areaPath = `M0,${height} ${points} ${width},${height}`;

  // Create path for line
  const linePath = points;

  return (
    <div className="relative">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Area fill */}
        {showArea && (
          <motion.path
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.15, pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            d={areaPath}
            fill={color}
            fillOpacity="0.15"
          />
        )}
        
        {/* Line */}
        <motion.polyline
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 1, pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          points={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {showDots && data.map((value, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - (value / maxValue) * height;
          return (
            <motion.circle
              key={index}
              initial={{ opacity: 0, r: 0 }}
              animate={{ opacity: 1, r: 3 }}
              transition={{ delay: 0.8 + (index * 0.1), duration: 0.4 }}
              cx={x}
              cy={y}
              fill="white"
              stroke={color}
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
};