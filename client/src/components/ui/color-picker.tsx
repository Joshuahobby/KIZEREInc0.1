import React, { useState, useEffect } from 'react';
import { RgbColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LuCheck, LuEye, LuEyeOff } from 'react-icons/lu';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

// Convert hex to RGB
const hexToRgb = (hex: string): RGB => {
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
};

// Convert RGB to hex
const rgbToHex = (rgb: RGB): string => {
  return '#' + [rgb.r, rgb.g, rgb.b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
};

export function ColorPicker({ color, onChange, presetColors = ['#000000', '#ffffff', '#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#607d8b'] }: ColorPickerProps) {
  const [rgbColor, setRgbColor] = useState<RGB>(hexToRgb(color));
  const [hexColor, setHexColor] = useState<string>(color);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Update internal state when color prop changes
  useEffect(() => {
    setHexColor(color);
    setRgbColor(hexToRgb(color));
  }, [color]);

  // Handle RGB color change
  const handleRgbChange = (newColor: RGB) => {
    setRgbColor(newColor);
    const hex = rgbToHex(newColor);
    setHexColor(hex);
    onChange(hex);
  };

  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setHexColor(value);
    
    // Only update RGB and call onChange if we have a valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setRgbColor(hexToRgb(value));
      onChange(value);
    }
  };

  // Handle blur event for hex input to ensure valid format
  const handleHexBlur = () => {
    // Make sure it starts with #
    let value = hexColor;
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    
    // If it's not a valid hex, reset to the current color
    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
      value = color;
    }
    
    setHexColor(value);
    setRgbColor(hexToRgb(value));
    onChange(value);
  };

  // Select a preset color
  const handlePresetSelect = (presetColor: string) => {
    setHexColor(presetColor);
    setRgbColor(hexToRgb(presetColor));
    onChange(presetColor);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start text-left font-normal h-10"
          style={{ backgroundColor: hexColor, borderColor: '#e5e7eb' }}
        >
          <div className="flex items-center gap-2 w-full">
            <div 
              className="h-4 w-4 rounded-sm border" 
              style={{ backgroundColor: hexColor }}
            />
            <span className="text-sm flex-grow">{hexColor}</span>
            {color === hexColor ? <LuCheck className="h-4 w-4" /> : null}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <Tabs defaultValue="picker">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="picker" className="flex-1">Picker</TabsTrigger>
            <TabsTrigger value="presets" className="flex-1">Presets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="picker" className="space-y-4">
            <RgbColorPicker color={rgbColor} onChange={handleRgbChange} />
            
            <div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium">Hex</div>
                <Input
                  value={hexColor}
                  onChange={handleHexChange}
                  onBlur={handleHexBlur}
                  className="h-8"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="presets">
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((presetColor) => (
                <Button
                  key={presetColor}
                  variant="outline"
                  className="h-8 w-8 p-0 border rounded-md"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handlePresetSelect(presetColor)}
                >
                  {presetColor === hexColor && (
                    <LuCheck className="h-4 w-4 text-white drop-shadow-md" />
                  )}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}