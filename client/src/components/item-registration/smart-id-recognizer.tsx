import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Check, X, FileText, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { recognizeTextFromImage, extractIdentifiers, ExtractedIdentifier } from "@/utils/ocr-utils";

interface SmartIdRecognizerProps {
  onDetect: (value: string) => void;
  onSelectIdentifier: (identifier: string) => void;
  className?: string;
}

export function SmartIdRecognizer({
  onDetect,
  onSelectIdentifier,
  className
}: SmartIdRecognizerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedText, setDetectedText] = useState("");
  const [identifiers, setIdentifiers] = useState<ExtractedIdentifier[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Create a preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
    
    // Reset results
    setDetectedText("");
    setIdentifiers([]);
    
    try {
      setIsProcessing(true);
      
      // Process the image using OCR
      const result = await recognizeTextFromImage(file);
      setDetectedText(result.text);
      
      // Extract potential identifiers
      const extractedIds = extractIdentifiers(result.text, result.confidence);
      setIdentifiers(extractedIds);
      
      // If we found identifiers, pass the most confident one to the parent
      if (extractedIds.length > 0) {
        // Sort by confidence and type priority (IMEI > Serial > Document > Unknown)
        const sortedIds = [...extractedIds].sort((a, b) => {
          // First by type
          const typeOrder = { imei: 0, serial: 1, document: 2, unknown: 3 };
          const typeDiff = typeOrder[a.type] - typeOrder[b.type];
          if (typeDiff !== 0) return typeDiff;
          
          // Then by confidence
          return b.confidence - a.confidence;
        });
        
        // Notify the parent of the best match
        onDetect(sortedIds[0].value);
        
        toast({
          title: "Identifier detected",
          description: `Found ${sortedIds.length} potential identifier${sortedIds.length !== 1 ? 's' : ''}. You can select from the list below.`,
          variant: "default",
        });
      } else {
        toast({
          title: "No identifiers found",
          description: "We couldn't detect any unique identifiers in this image. You can still enter it manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      toast({
        title: "Processing failed",
        description: "Failed to process the image. Please try another image or enter the identifier manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onDetect, previewUrl]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });
  
  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setDetectedText("");
    setIdentifiers([]);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main dropzone area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg transition-all relative",
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 bg-gray-50",
          previewUrl ? "aspect-square max-w-xs mx-auto" : "p-6"
        )}
      >
        <input {...getInputProps()} />
        
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Document for OCR" 
              className="w-full h-full object-contain rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
            
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">Processing image...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-3 py-4">
            <Search className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium">
                {isDragActive 
                  ? "Drop image here..." 
                  : "Upload an image of your item's identification label"
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Works with labels showing IMEI, serial numbers, or document IDs
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline"
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" /> 
              Select Image
            </Button>
          </div>
        )}
      </div>
      
      {/* Detected identifiers */}
      {identifiers.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            Detected Identifiers
          </h4>
          
          <div className="space-y-2">
            {identifiers.map((identifier, index) => (
              <div 
                key={`${identifier.type}-${index}`} 
                className="flex items-center justify-between bg-white p-2 rounded border"
              >
                <div>
                  <span className="text-xs font-medium capitalize mr-2">
                    {identifier.type}:
                  </span>
                  <span className="text-sm font-mono">{identifier.value}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectIdentifier(identifier.value)}
                >
                  Use This
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Full OCR text */}
      {detectedText && (
        <details className="text-xs">
          <summary className="font-medium cursor-pointer">View all detected text</summary>
          <div className="mt-2 p-3 bg-gray-100 rounded border font-mono text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
            {detectedText}
          </div>
        </details>
      )}
      
      {/* Instructions */}
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-700" />
        <AlertTitle className="text-blue-700 text-sm">Smart ID Recognition</AlertTitle>
        <AlertDescription className="text-blue-600 text-xs">
          Upload a clear image of your item's label, box, or documentation. 
          The system will attempt to identify unique identifiers like IMEI, 
          serial numbers, or document IDs automatically.
        </AlertDescription>
      </Alert>
    </div>
  );
}