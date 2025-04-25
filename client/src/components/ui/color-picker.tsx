import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { RgbColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

// Convert hex to RGB
const hexToRgb = (hex: string) => {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return { r, g, b };
};

// Convert RGB to hex
const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const toHex = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export function ColorPicker({ color, onChange, disabled = false, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const [rgbValue, setRgbValue] = useState(hexToRgb(color));
  
  // Sync the input value when the color prop changes
  useEffect(() => {
    setInputValue(color);
    setRgbValue(hexToRgb(color));
  }, [color]);
  
  // Update color when RGB values change
  const handleRgbChange = (newRgb: { r: number; g: number; b: number }) => {
    const hexColor = rgbToHex(newRgb);
    setRgbValue(newRgb);
    setInputValue(hexColor);
    onChange(hexColor);
  };
  
  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only update the RGB and call onChange if it's a valid hex code
    if (/^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(newValue)) {
      // Make sure the value has a leading #
      const normalizedValue = newValue.startsWith('#') ? newValue : `#${newValue}`;
      setRgbValue(hexToRgb(normalizedValue));
      onChange(normalizedValue);
    }
  };
  
  // Close the popover when clicking outside
  const popoverRef = useRef<HTMLDivElement>(null);
  
  return (
    <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn('flex items-center space-x-2', className)}>
          <div
            className={cn(
              'w-6 h-6 rounded border border-input',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            )}
            style={{ backgroundColor: inputValue }}
            onClick={() => !disabled && setIsOpen(true)}
          />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-24 h-8 px-2 text-xs"
            maxLength={7}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" ref={popoverRef}>
        <RgbColorPicker
          color={rgbValue}
          onChange={handleRgbChange}
          className="w-48 h-48"
        />
      </PopoverContent>
    </Popover>
  );
}