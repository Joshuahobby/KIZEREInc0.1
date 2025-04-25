import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { LuCamera, LuLoader, LuX } from 'react-icons/lu';
import { extractTextFromImage, extractIdentifiers } from '@/utils/ocr-utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface SmartIDRecognizerProps {
  onIdentifierSelected: (identifier: string) => void;
}

export function SmartIDRecognizer({ onIdentifierSelected }: SmartIDRecognizerProps) {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIdentifiers, setDetectedIdentifiers] = useState<string[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setError(t('batch_upload_invalid_type'));
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    setDetectedIdentifiers([]);
    setSelectedIdentifier('');
    
    // Create a preview
    const preview = URL.createObjectURL(file);
    setFilePreview(preview);
  };

  // Process image with OCR
  const processImage = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setError(null);
    setDetectedIdentifiers([]);
    setSelectedIdentifier('');
    
    try {
      // Extract text from image
      const extractedText = await extractTextFromImage(selectedFile);
      // Extract potential identifiers
      const identifiers = extractIdentifiers(extractedText);
      
      if (identifiers.length === 0) {
        setError(t('smart_id_no_results'));
      } else {
        setDetectedIdentifiers(identifiers);
        // Auto-select the first identifier
        setSelectedIdentifier(identifiers[0]);
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setError(t('error_try_again'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear selected file
  const clearFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    
    setSelectedFile(null);
    setFilePreview(null);
    setError(null);
    setDetectedIdentifiers([]);
    setSelectedIdentifier('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Use selected identifier
  const useIdentifier = () => {
    if (selectedIdentifier) {
      onIdentifierSelected(selectedIdentifier);
      clearFile();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('smart_id_title')}</CardTitle>
        <CardDescription>{t('smart_id_description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md border-muted-foreground/30 hover:border-muted-foreground/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
              >
                <LuCamera className="mr-2 h-4 w-4" />
                {t('smart_id_upload')}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t('item_drag_images')}
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="absolute top-2 right-2 bg-background/80 h-8 w-8 rounded-full"
                >
                  <LuX className="h-4 w-4" />
                </Button>
              </div>
              {filePreview && (
                <img
                  src={filePreview}
                  alt="Selected image"
                  className="w-full h-auto max-h-[300px] object-contain rounded-md mb-4"
                />
              )}
              
              {!isProcessing && detectedIdentifiers.length === 0 && !error && (
                <Button 
                  onClick={processImage} 
                  className="w-full mt-2"
                >
                  {t('smart_id_processing')}
                </Button>
              )}
              
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