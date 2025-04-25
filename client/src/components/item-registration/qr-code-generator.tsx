import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Download, Printer, Share2, QrCode as QrCodeIcon, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { generateQRCode, downloadQRCode, QRCodeOptions } from "@/utils/qrcode-utils";

interface QrCodeGeneratorProps {
  itemId?: number;
  itemName?: string;
  className?: string;
  isDarkMode?: boolean;
}

export function QrCodeGenerator({ 
  itemId, 
  itemName, 
  className,
  isDarkMode = false
}: QrCodeGeneratorProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrOptions, setQrOptions] = useState<QRCodeOptions>({
    width: 256,
    color: {
      dark: isDarkMode ? '#ffffff' : '#000000',
      light: isDarkMode ? '#000000' : '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Regenerate QR code when options change
  useEffect(() => {
    if (!itemId) return;
    
    const generateCode = async () => {
      try {
        setIsLoading(true);
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/items/verify/${itemId}`;
        const qrCode = await generateQRCode(url, qrOptions);
        setQrUrl(qrCode);
      } catch (error) {
        console.error('QR code generation error:', error);
        toast({
          title: "QR Code Generation Failed",
          description: "Could not generate the QR code. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    generateCode();
  }, [itemId, qrOptions]);
  
  // Handle QR code download
  const handleDownload = () => {
    if (!qrUrl || !itemName) return;
    
    const sanitizedName = itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `kizere_${sanitizedName}_qrcode.png`;
    
    downloadQRCode(qrUrl, filename);
    
    toast({
      title: "QR Code Downloaded",
      description: "The QR code has been downloaded successfully.",
      variant: "default",
    });
  };
  
  // Handle QR code printing
  const handlePrint = () => {
    if (!qrUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Could not open print window. Please check your popup settings.",
        variant: "destructive",
      });
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KIZERE QR Code for ${itemName || 'Item'}</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
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
            width: 100%;
            max-width: 300px;
            height: auto;
          }
          .item-name {
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0 5px;
          }
          .instructions {
            font-size: 14px;
            color: #555;
            margin-bottom: 20px;
          }
          .powered-by {
            font-size: 12px;
            color: #777;
            margin-top: 30px;
          }
          @media print {
            body {
              padding: 0;
            }
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <img src="${qrUrl}" alt="QR Code" class="qr-code" />
          <div class="item-name">${itemName || 'Registered Item'}</div>
          <div class="instructions">
            Scan this QR code to verify the authenticity and ownership of this item.
          </div>
          <button class="print-button" onclick="window.print()">Print QR Code</button>
        </div>
        <div class="powered-by">Powered by KIZERE Item Registry</div>
        <script>
          // Auto-print when loaded
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  
  // Handle QR code sharing
  const handleShare = async () => {
    if (!qrUrl || !navigator.share) {
      toast({
        title: "Sharing Not Supported",
        description: "Your browser doesn't support the Web Share API.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Convert data URL to Blob
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      
      // Create file from Blob
      const file = new File([blob], `kizere_qrcode.png`, { type: 'image/png' });
      
      // Share the QR code
      await navigator.share({
        title: `KIZERE QR Code for ${itemName || 'Item'}`,
        text: 'Scan this QR code to verify the authenticity and ownership of this item.',
        files: [file]
      });
      
      toast({
        title: "QR Code Shared",
        description: "The QR code has been shared successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      
      // Only show error if it's not user cancellation
      if (error.name !== 'AbortError') {
        toast({
          title: "Sharing Failed",
          description: "Could not share the QR code. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <div className={className}>
      <Card className={cn(
        "overflow-hidden border", 
        isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white"
      )}>
        <CardHeader className={cn(
          "pb-2",
          isDarkMode ? "text-white" : ""
        )}>
          <CardTitle className="text-lg flex items-center">
            <QrCodeIcon className="h-5 w-5 mr-2" />
            QR Code Generator
          </CardTitle>
          <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
            Generate a unique QR code for your registered item
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!itemId ? (
            // Display message if no item ID is provided
            <div className="text-center py-8">
              <AlertCircle className={cn(
                "h-12 w-12 mx-auto mb-3",
                isDarkMode ? "text-gray-500" : "text-gray-400"
              )} />
              <p className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-gray-300" : "text-gray-600"
              )}>
                Complete item registration to generate a QR code
              </p>
            </div>
          ) : (
            // Display QR code if item ID is available
            <div className="flex flex-col items-center">
              {/* QR Code Display */}
              <div className={cn(
                "border p-4 rounded-lg mb-4 flex items-center justify-center",
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50",
                isLoading ? "opacity-60" : ""
              )}>
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Item QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {/* QR Customization Toggle */}
              <div className="flex items-center justify-between w-full mb-4">
                <Label htmlFor="customize-qr" className={isDarkMode ? "text-gray-300" : ""}>
                  Customize QR Code
                </Label>
                <Switch
                  id="customize-qr"
                  checked={isCustomizing}
                  onCheckedChange={setIsCustomizing}
                />
              </div>
              
              {/* Customization Options */}
              {isCustomizing && (
                <div className={cn(
                  "w-full space-y-4 p-4 rounded-lg mb-4",
                  isDarkMode ? "bg-gray-800" : "bg-gray-50"
                )}>
                  {/* Size slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="qr-size" className={isDarkMode ? "text-gray-300" : ""}>Size</Label>
                      <span className={cn(
                        "text-xs",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        {qrOptions.width}px
                      </span>
                    </div>
                    <Slider
                      id="qr-size"
                      min={128}
                      max={512}
                      step={32}
                      value={[qrOptions.width || 256]}
                      onValueChange={(value) => {
                        setQrOptions(prev => ({
                          ...prev,
                          width: value[0]
                        }));
                      }}
                    />
                  </div>
                  
                  {/* Colors */}
                  <div className="space-y-2">
                    <Label className={isDarkMode ? "text-gray-300" : ""}>Colors</Label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label 
                          htmlFor="dark-color" 
                          className={cn(
                            "text-xs mb-1 block",
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          )}
                        >
                          Foreground
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-8 flex items-center justify-between",
                                isDarkMode ? "border-gray-700" : ""
                              )}
                            >
                              <div 
                                className="w-5 h-5 rounded-sm mr-2" 
                                style={{ backgroundColor: qrOptions.color?.dark || '#000000' }} 
                              />
                              <span className={cn(
                                "text-xs",
                                isDarkMode ? "text-gray-300" : ""
                              )}>
                                {qrOptions.color?.dark || '#000000'}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2">
                            <ColorPicker
                              color={qrOptions.color?.dark || '#000000'}
                              onChange={(color) => {
                                setQrOptions(prev => ({
                                  ...prev,
                                  color: {
                                    ...prev.color,
                                    dark: color
                                  }
                                }));
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="flex-1">
                        <Label 
                          htmlFor="light-color" 
                          className={cn(
                            "text-xs mb-1 block",
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          )}
                        >
                          Background
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-8 flex items-center justify-between",
                                isDarkMode ? "border-gray-700" : ""
                              )}
                            >
                              <div 
                                className="w-5 h-5 rounded-sm mr-2" 
                                style={{ backgroundColor: qrOptions.color?.light || '#ffffff' }} 
                              />
                              <span className={cn(
                                "text-xs",
                                isDarkMode ? "text-gray-300" : ""
                              )}>
                                {qrOptions.color?.light || '#ffffff'}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2">
                            <ColorPicker
                              color={qrOptions.color?.light || '#ffffff'}
                              onChange={(color) => {
                                setQrOptions(prev => ({
                                  ...prev,
                                  color: {
                                    ...prev.color,
                                    light: color
                                  }
                                }));
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error correction level */}
                  <div className="space-y-2">
                    <Label htmlFor="error-correction" className={isDarkMode ? "text-gray-300" : ""}>
                      Error Correction Level
                    </Label>
                    <Select
                      value={qrOptions.errorCorrectionLevel || 'M'}
                      onValueChange={(value) => {
                        setQrOptions(prev => ({
                          ...prev,
                          errorCorrectionLevel: value as 'L' | 'M' | 'Q' | 'H'
                        }));
                      }}
                    >
                      <SelectTrigger 
                        id="error-correction"
                        className={isDarkMode ? "border-gray-700" : ""}
                      >
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Low (7%)</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Quartile (25%)</SelectItem>
                        <SelectItem value="H">High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className={cn(
                      "text-xs",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      Higher correction levels make QR codes more reliable but larger
                    </p>
                  </div>
                </div>
              )}
              
              {/* QR Code Info */}
              <Alert variant="default" className={cn(
                "mb-4",
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-blue-50 border-blue-200"
              )}>
                <Check className={isDarkMode ? "text-green-400" : "text-blue-600"} />
                <AlertTitle className={isDarkMode ? "text-gray-200" : "text-blue-700"}>
                  Verification Ready
                </AlertTitle>
                <AlertDescription className={isDarkMode ? "text-gray-400" : "text-blue-600"}>
                  This QR code provides a quick way to verify this item's authenticity
                  and check ownership details.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleDownload}
            disabled={!qrUrl || isLoading}
            className={isDarkMode ? "border-gray-700 text-gray-300" : ""}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrint}
              disabled={!qrUrl || isLoading}
              className={isDarkMode ? "border-gray-700 text-gray-300" : ""}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            
            <Button 
              type="button" 
              variant="default" 
              onClick={handleShare}
              disabled={!qrUrl || isLoading || !navigator.share}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Use the ColorPicker component from @/components/ui/color-picker