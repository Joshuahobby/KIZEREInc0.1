import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ColorPicker } from '@/components/ui/color-picker';
import { LuDownload, LuPrinter, LuShare2, LuLoader } from 'react-icons/lu';
import { generateQRCodeSVG, QRCodeOptions } from '@/utils/qrcode-utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface QRCodeGeneratorProps {
  itemId: string;
  itemName: string;
  itemCategory: string;
}

export function QRCodeGenerator({ itemId, itemName, itemCategory }: QRCodeGeneratorProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'recovery' | 'info'>('recovery');
  const [recoveryQRCode, setRecoveryQRCode] = useState<string>('');
  const [infoQRCode, setInfoQRCode] = useState<string>('');
  const [options, setOptions] = useState<QRCodeOptions>({
    width: 200,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });

  const recoveryQRRef = useRef<HTMLDivElement>(null);
  const infoQRRef = useRef<HTMLDivElement>(null);

  // Generate QR codes when component mounts or options change
  useEffect(() => {
    const generateQRCodes = async () => {
      try {
        // URLs for recovery and info
        const baseUrl = window.location.origin;
        const recoveryUrl = `${baseUrl}/report-found?id=${itemId}`;
        const infoUrl = `${baseUrl}/item-details?id=${itemId}`;
        
        // Generate SVGs
        const recoverySvg = await generateQRCodeSVG(recoveryUrl, options);
        const infoSvg = await generateQRCodeSVG(infoUrl, options);
        
        setRecoveryQRCode(recoverySvg);
        setInfoQRCode(infoSvg);
      } catch (error) {
        console.error('Error generating QR codes:', error);
      }
    };
    
    generateQRCodes();
  }, [itemId, options]);

  // Update QR code width
  const handleWidthChange = (value: number[]) => {
    setOptions(prev => ({
      ...prev,
      width: value[0]
    }));
  };

  // Update QR code margin
  const handleMarginChange = (value: number[]) => {
    setOptions(prev => ({
      ...prev,
      margin: value[0]
    }));
  };

  // Update QR code error correction level
  const handleErrorCorrectionChange = (value: 'L' | 'M' | 'Q' | 'H') => {
    setOptions(prev => ({
      ...prev,
      errorCorrectionLevel: value
    }));
  };

  // Update QR code foreground color
  const handleForegroundColorChange = (color: string) => {
    setOptions(prev => ({
      ...prev,
      color: {
        ...prev.color,
        dark: color
      }
    }));
  };

  // Update QR code background color
  const handleBackgroundColorChange = (color: string) => {
    setOptions(prev => ({
      ...prev,
      color: {
        ...prev.color,
        light: color
      }
    }));
  };

  // Download QR code as SVG
  const downloadQRCode = () => {
    const svg = activeTab === 'recovery' ? recoveryQRCode : infoQRCode;
    const fileName = activeTab === 'recovery' 
      ? `${itemName.replace(/\s+/g, '-').toLowerCase()}-recovery-qr.svg`
      : `${itemName.replace(/\s+/g, '-').toLowerCase()}-info-qr.svg`;
    
    // Create a Blob from the SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print QR code
  const printQRCode = () => {
    const qrRef = activeTab === 'recovery' ? recoveryQRRef : infoQRRef;
    if (!qrRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const title = activeTab === 'recovery'
      ? `${t('qr_recovery_title')} - ${itemName}`
      : `${t('qr_info_title')} - ${itemName}`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              max-width: 400px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 8px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .item-details {
              margin-top: 20px;
              text-align: left;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${title}</h2>
            <div class="qr-code">
              ${activeTab === 'recovery' ? recoveryQRCode : infoQRCode}
            </div>
            <p>${activeTab === 'recovery' ? t('qr_recovery_description') : t('qr_info_description')}</p>
            <div class="item-details">
              <p><strong>${t('item_name')}:</strong> ${itemName}</p>
              <p><strong>${t('item_category')}:</strong> ${itemCategory}</p>
              <p><strong>ID:</strong> ${itemId}</p>
            </div>
            <p class="no-print">
              <button onclick="window.print()">${t('qr_print')}</button>
              <button onclick="window.close()">Close</button>
            </p>
          </div>
          <script>
            window.onload = function() {
              // Auto-print when loaded
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Share QR code (if Web Share API is available)
  const shareQRCode = async () => {
    if (!navigator.share) {
      alert(t('error_not_supported'));
      return;
    }
    
    try {
      const svg = activeTab === 'recovery' ? recoveryQRCode : infoQRCode;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const file = new File([blob], 'qrcode.svg', { type: 'image/svg+xml' });
      
      await navigator.share({
        title: activeTab === 'recovery' ? t('qr_recovery_title') : t('qr_info_title'),
        text: activeTab === 'recovery' ? t('qr_recovery_description') : t('qr_info_description'),
        files: [file]
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('qr_title')}</CardTitle>
        <CardDescription>{t('qr_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recovery" value={activeTab} onValueChange={(value) => setActiveTab(value as 'recovery' | 'info')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recovery">{t('qr_recovery_tab')}</TabsTrigger>
            <TabsTrigger value="info">{t('qr_info_tab')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recovery" className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4">
              <h3 className="font-medium text-lg mb-2">{t('qr_recovery_title')}</h3>
              <div 
                ref={recoveryQRRef} 
                className="qr-container bg-white p-4 rounded-lg w-fit mx-auto"
                dangerouslySetInnerHTML={{ __html: recoveryQRCode }}
              />
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                {t('qr_recovery_description')}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="info" className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4">
              <h3 className="font-medium text-lg mb-2">{t('qr_info_title')}</h3>
              <div 
                ref={infoQRRef} 
                className="qr-container bg-white p-4 rounded-lg w-fit mx-auto"
                dangerouslySetInnerHTML={{ __html: infoQRCode }}
              />
              <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                {t('qr_info_description')}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-4 mt-6">
          <h3 className="font-medium">{t('qr_customize')}</h3>
          
          <div className="space-y-2">
            <Label>{t('qr_error_correction')}</Label>
            <RadioGroup
              value={options.errorCorrectionLevel}
              onValueChange={(value) => handleErrorCorrectionChange(value as 'L' | 'M' | 'Q' | 'H')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="L" id="r1" />
                <Label htmlFor="r1">{t('qr_error_low')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="M" id="r2" />
                <Label htmlFor="r2">{t('qr_error_medium')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Q" id="r3" />
                <Label htmlFor="r3">{t('qr_error_quartile')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="H" id="r4" />
                <Label htmlFor="r4">{t('qr_error_high')}</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>{t('qr_size')}</Label>
            <div className="flex items-center gap-2">
              <Slider 
                value={[options.width]} 
                min={100} 
                max={400} 
                step={10} 
                onValueChange={handleWidthChange} 
                className="flex-1"
              />
              <div className="w-12 text-center">{options.width}px</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{t('qr_margin')}</Label>
            <div className="flex items-center gap-2">
              <Slider 
                value={[options.margin]} 
                min={0} 
                max={10} 
                step={1} 
                onValueChange={handleMarginChange} 
                className="flex-1"
              />
              <div className="w-12 text-center">{options.margin}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{t('qr_colors')}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">{t('qr_foreground')}</Label>
                <ColorPicker
                  color={options.color.dark}
                  onChange={handleForegroundColorChange}
                />
              </div>
              <div>
                <Label className="text-sm">{t('qr_background')}</Label>
                <ColorPicker
                  color={options.color.light}
                  onChange={handleBackgroundColorChange}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={downloadQRCode}>
          <LuDownload className="mr-2 h-4 w-4" />
          {t('qr_download')}
        </Button>
        <Button variant="outline" onClick={printQRCode}>
          <LuPrinter className="mr-2 h-4 w-4" />
          {t('qr_print')}
        </Button>
        {navigator.share && (
          <Button variant="outline" onClick={shareQRCode}>
            <LuShare2 className="mr-2 h-4 w-4" />
            {t('qr_share')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}