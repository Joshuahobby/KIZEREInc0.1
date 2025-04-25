import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LuImage, LuLoader, LuSearch, LuX } from 'react-icons/lu';
import { extractTextFromImage, extractIdentifiers, determineIdentifierType } from '@/utils/ocr-utils';

export interface SmartIDRecognizerProps {
  onIdentifierSelected: (identifier: string) => void;
}

export function SmartIDRecognizer({ onIdentifierSelected }: SmartIDRecognizerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ file: File; url: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedIdentifiers, setDetectedIdentifiers] = useState<string[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('error_title'),
        description: t('smart_id_invalid_file_type'),
        variant: 'destructive',
      });
      return;
    }
    
    // Reset previous states
    setError(null);
    setDetectedIdentifiers([]);
    setSelectedIdentifier('');
    
    // Create and store image preview
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage({ file, url: imageUrl });
  };

  // Process the selected image with OCR
  const processImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Extract text from image using OCR
      const extractedText = await extractTextFromImage(selectedImage.file);
      
      // Extract potential identifiers from the text
      const identifiers = extractIdentifiers(extractedText);
      
      if (identifiers.length === 0) {
        setError(t('smart_id_no_identifiers'));
      } else {
        setDetectedIdentifiers(identifiers);
        // If there's only one identifier, select it automatically
        if (identifiers.length === 1) {
          setSelectedIdentifier(identifiers[0]);
        }
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setError(t('smart_id_processing_error'));
      toast({
        title: t('error_title'),
        description: t('smart_id_processing_error'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove the selected image
  const removeImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url);
    }
    setSelectedImage(null);
    setError(null);
    setDetectedIdentifiers([]);
    setSelectedIdentifier('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Use the selected identifier
  const useIdentifier = () => {
    if (!selectedIdentifier) return;
    
    onIdentifierSelected(selectedIdentifier);
    toast({
      title: t('smart_id_success'),
      description: t('smart_id_success_desc'),
    });
    
    // Clean up after successful use
    removeImage();
  };

  // Get the type of the selected identifier for display purposes
  const getIdentifierTypeLabel = (identifier: string): string => {
    const type = determineIdentifierType(identifier);
    
    switch (type) {
      case 'imei':
        return t('smart_id_type_imei');
      case 'serial':
        return t('smart_id_type_serial');
      case 'id':
        return t('smart_id_type_id');
      default:
        return t('smart_id_type_unknown');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('smart_id_title')}</CardTitle>
        <CardDescription>{t('smart_id_description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
          />
          
          {!selectedImage ? (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto"
            >
              <LuImage className="mr-2 h-4 w-4" />
              {t('smart_id_select_image')}
            </Button>
          ) : (
            <div className="w-full space-y-4">
              <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-md border">
                <img 
                  src={selectedImage.url} 
                  alt={t('smart_id_image_alt')} 
                  className="w-full h-full object-contain" 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={removeImage}
                >
                  <LuX className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LuSearch className="mr-2 h-4 w-4" />
                  )}
                  {t('smart_id_process')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <LuImage className="mr-2 h-4 w-4" />
                  {t('smart_id_change_image')}
                </Button>
              </div>
              
              {isProcessing && (
                <div className="flex items-center justify-center py-4">
                  <LuLoader className="mr-2 h-5 w-5 animate-spin" />
                  <span>{t('smart_id_processing')}</span>
                </div>
              )}
              
              {error && (
                <div className="text-destructive text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
          )}
          
          {detectedIdentifiers.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <h3 className="font-medium">{t('smart_id_select_identifier')}:</h3>
              
              <RadioGroup
                value={selectedIdentifier}
                onValueChange={setSelectedIdentifier}
                className="space-y-2"
              >
                {detectedIdentifiers.map((identifier, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={identifier} id={`identifier-${index}`} />
                    <Label htmlFor={`identifier-${index}`} className="cursor-pointer">
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {identifier}
                      </code>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <Button 
                onClick={useIdentifier}
                disabled={!selectedIdentifier}
                className="w-full mt-4"
              >
                {t('smart_id_use_selected')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}