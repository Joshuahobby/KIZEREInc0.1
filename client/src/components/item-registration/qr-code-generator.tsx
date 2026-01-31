import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LuDownload, LuRefreshCw, LuQrCode } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

export interface QRCodeGeneratorProps {
  itemIdentifier: string;
  itemName?: string;
  showHeader?: boolean;
}

export function QRCodeGenerator({ itemIdentifier, itemName, showHeader = true }: QRCodeGeneratorProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrValue, setQRValue] = useState<string>('');
  const [qrOptions, setQROptions] = useState({
    width: 200,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    includeItemName: true,
  });

  // Initialize QR value when itemIdentifier changes
  useEffect(() => {
    if (itemIdentifier) {
      // Create a URL that the QR code should point to
      // This could be a link to view the item details in the app
      const baseUrl = window.location.origin;
      const qrUrl = `${baseUrl}/items/${itemIdentifier}`;
      setQRValue(qrUrl);
    }
  }, [itemIdentifier]);

  // Generate QR code when value or options change
  useEffect(() => {
    if (!qrValue || !canvasRef.current) return;
    
    const generateQR = async () => {
      try {
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, qrValue, {
            width: qrOptions.width,
            margin: qrOptions.margin,
            color: qrOptions.color,
          });
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast({
          title: t('common.error'),
          description: t('registration.qr_generation_error'),
          variant: 'destructive',
        });
      }
    };
    
    generateQR();
  }, [qrValue, qrOptions, toast, t]);

  // Download QR code as PNG
  const downloadQRCode = () => {
    if (!canvasRef.current) return;
    
    try {
      const link = document.createElement('a');
      const filename = itemName 
        ? `${itemName.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`
        : `item-${itemIdentifier}-qr-code.png`;
        
      link.download = filename;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      
      toast({
        title: t('registration.qr_download_success'),
        description: t('registration.qr_download_success_desc'),
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: t('common.error'),
        description: t('registration.qr_download_error'),
        variant: 'destructive',
      });
    }
  };

  // Refresh QR code with a new random value
  const refreshQRCode = () => {
    const baseUrl = window.location.origin;
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const qrUrl = `${baseUrl}/items/${itemIdentifier}?ref=${randomSuffix}`;
    setQRValue(qrUrl);
    
    toast({
      title: t('registration.qr_refreshed'),
      description: t('registration.qr_refreshed_desc'),
    });
  };

  return (
    <Card className={cn("w-full", !showHeader && "border-0 shadow-none bg-transparent")}>
      {showHeader && (
        <CardHeader>
          <CardTitle>{t('registration.qr_title')}</CardTitle>
          <CardDescription>{t('registration.qr_description')}</CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="border p-4 rounded-md bg-white">
            <canvas ref={canvasRef} />
            
            {qrOptions.includeItemName && itemName && (
              <div className="text-center mt-2 text-sm font-medium">
                {itemName}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('registration.qr_size')}</Label>
            <Slider
              value={[qrOptions.width]}
              min={100}
              max={300}
              step={10}
              onValueChange={(values) => setQROptions(prev => ({ ...prev, width: values[0] }))}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100px</span>
              <span>{qrOptions.width}px</span>
              <span>300px</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{t('registration.qr_margin')}</Label>
            <Slider
              value={[qrOptions.margin]}
              min={0}
              max={10}
              step={1}
              onValueChange={(values) => setQROptions(prev => ({ ...prev, margin: values[0] }))}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{qrOptions.margin}</span>
              <span>10</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('registration.qr_dark_color')}</Label>
              <ColorPicker
                color={qrOptions.color.dark}
                onChange={(color) => setQROptions(prev => ({ 
                  ...prev, 
                  color: { ...prev.color, dark: color } 
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('registration.qr_light_color')}</Label>
              <ColorPicker
                color={qrOptions.color.light}
                onChange={(color) => setQROptions(prev => ({ 
                  ...prev, 
                  color: { ...prev.color, light: color } 
                }))}
              />
            </div>
          </div>
          
          {itemName && (
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="include-name"
                checked={qrOptions.includeItemName}
                onCheckedChange={(checked) => setQROptions(prev => ({ 
                  ...prev, 
                  includeItemName: checked 
                }))}
              />
              <Label htmlFor="include-name" className="cursor-pointer">
                {t('registration.qr_include_name')}
              </Label>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={refreshQRCode}>
          <LuRefreshCw className="mr-2 h-4 w-4" />
          {t('registration.qr_refresh')}
        </Button>
        <Button onClick={downloadQRCode}>
          <LuDownload className="mr-2 h-4 w-4" />
          {t('registration.qr_download')}
        </Button>
      </CardFooter>
    </Card>
  );
}