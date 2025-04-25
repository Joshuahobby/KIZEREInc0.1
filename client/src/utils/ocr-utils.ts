import { createWorker } from 'tesseract.js';
import { useState, useEffect } from 'react';

// Define types for OCR
export interface OCRResult {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  detectedType: 'imei' | 'serial' | 'unknown';
}

// REGEX patterns for different identifier types
const IMEI_REGEX = /\b(?:IMEI|imei|I\.M\.E\.I)[\s:]*(\d{15}(?:\d)?)\b/;
const SERIAL_REGEX = /\b(?:S\/N|s\/n|Serial|SERIAL|serial number|SERIAL NUMBER|SN|sn)[:\s#]*([A-Z0-9]{5,20})\b/;

/**
 * Initialize a Tesseract.js worker for OCR processing
 * 
 * @returns Tesseract worker instance
 */
export const initializeOCRWorker = async () => {
  const worker = await createWorker('eng');
  return worker;
};

/**
 * Recognize text in an image and extract potential device identifiers
 * 
 * @param imageFile - The image file to process
 * @returns Promise with array of OCR results containing detected identifiers
 */
export const recognizeImageText = async (imageFile: File): Promise<OCRResult[]> => {
  try {
    const worker = await initializeOCRWorker();
    
    // Process the image
    const imageUrl = URL.createObjectURL(imageFile);
    const result = await worker.recognize(imageUrl);
    
    // Parse the OCR results to extract potential identifiers
    const results: OCRResult[] = [];
    
    // Process text line by line to look for patterns
    if (result.data && result.data.lines) {
      for (const line of result.data.lines) {
        // Extract IMEI numbers
        const imeiMatch = line.text.match(IMEI_REGEX);
        if (imeiMatch && imeiMatch[1]) {
          results.push({
            text: imeiMatch[1],
            confidence: line.confidence,
            bbox: line.bbox,
            detectedType: 'imei'
          });
        }
        
        // Extract serial numbers
        const serialMatch = line.text.match(SERIAL_REGEX);
        if (serialMatch && serialMatch[1]) {
          results.push({
            text: serialMatch[1],
            confidence: line.confidence,
            bbox: line.bbox,
            detectedType: 'serial'
          });
        }
      }
    }
    
    // Cleanup
    URL.revokeObjectURL(imageUrl);
    await worker.terminate();
    
    return results;
  } catch (error) {
    console.error('Error processing image with OCR:', error);
    throw error;
  }
};

/**
 * React hook for OCR processing
 * 
 * @param imageFile - Optional image file to process
 * @returns OCR state including results, loading status, and error
 */
export const useOCR = (imageFile: File | null) => {
  const [results, setResults] = useState<OCRResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const processImage = async () => {
      if (!imageFile) return;
      
      setIsProcessing(true);
      setError(null);
      
      try {
        const ocrResults = await recognizeImageText(imageFile);
        setResults(ocrResults);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error during OCR processing'));
      } finally {
        setIsProcessing(false);
      }
    };
    
    processImage();
  }, [imageFile]);

  return { results, isProcessing, error };
};

/**
 * Extract potential device identifiers from text
 * 
 * @param text - The text to analyze
 * @returns Array of potential identifiers with their types
 */
export const extractIdentifiersFromText = (text: string): OCRResult[] => {
  const results: OCRResult[] = [];
  
  // Extract IMEI numbers
  const imeiMatches = text.match(new RegExp(IMEI_REGEX, 'g'));
  if (imeiMatches) {
    for (const match of imeiMatches) {
      const imei = match.match(IMEI_REGEX)?.[1];
      if (imei) {
        results.push({
          text: imei,
          confidence: 100, // Direct text input has perfect confidence
          bbox: { x0: 0, y0: 0, x1: 0, y1: 0 }, // No bounding box for manual input
          detectedType: 'imei'
        });
      }
    }
  }
  
  // Extract serial numbers
  const serialMatches = text.match(new RegExp(SERIAL_REGEX, 'g'));
  if (serialMatches) {
    for (const match of serialMatches) {
      const serial = match.match(SERIAL_REGEX)?.[1];
      if (serial) {
        results.push({
          text: serial,
          confidence: 100,
          bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
          detectedType: 'serial'
        });
      }
    }
  }
  
  return results;
};