import React from "react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const colors = [
    '#000000', '#ffffff', '#f44336', '#e91e63', '#9c27b0',
    '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b',
    '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'
  ];
  
  return (
    <div className={cn("space-y-3 p-1", className)}>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((standardColor) => (
          <button
            key={standardColor}
            type="button"
            className={cn(
              "w-8 h-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary",
              color === standardColor ? "ring-2 ring-primary ring-offset-2" : ""
            )}
            style={{ backgroundColor: standardColor }}
            onClick={() => onChange(standardColor)}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 p-0 border-0 rounded-md cursor-pointer"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border rounded-md px-2 py-1 text-sm"
          maxLength={7}
          pattern="^#([A-Fa-f0-9]{6})$"
        />
      </div>
    </div>
  );
}