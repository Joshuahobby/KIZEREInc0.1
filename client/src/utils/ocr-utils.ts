import { createWorker } from 'tesseract.js';

/**
 * OCRResult contains the detected text and confidence level
 */
export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Extracted identifiers with their type
 */
export interface ExtractedIdentifier {
  type: 'imei' | 'serial' | 'document' | 'unknown';
  value: string;
  confidence: number;
}

/**
 * Recognize text from an image using Tesseract OCR
 * @param imageFile The image file to process
 * @returns Promise resolving to OCRResult with the detected text and confidence
 */
export async function recognizeTextFromImage(imageFile: File): Promise<OCRResult> {
  try {
    const worker = await createWorker('eng');
    
    // Convert file to image data URL
    const imageDataUrl = await fileToDataUrl(imageFile);
    
    // Recognize text in the image
    const result = await worker.recognize(imageDataUrl);
    
    // Terminate worker to free up resources
    await worker.terminate();
    
    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('OCR recognition error:', error);
    throw new Error('Failed to recognize text from image');
  }
}

/**
 * Convert file to data URL for processing
 * @param file The file to convert
 * @returns Promise resolving to a data URL
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract specific identifiers from OCR text
 * @param ocrText The OCR detected text
 * @param confidence The confidence level of the OCR
 * @returns Array of extracted identifiers
 */
export function extractIdentifiers(ocrText: string, confidence: number): ExtractedIdentifier[] {
  const results: ExtractedIdentifier[] = [];
  
  // IMEI detection (15 digit number often labeled as IMEI)
  const imeiRegex = /(?:IMEI|imei|I.M.E.I)[:\s]*(\d{15})/gi;
  const imeiMatches = [...ocrText.matchAll(imeiRegex)];
  
  imeiMatches.forEach(match => {
    if (match[1]) {
      results.push({
        type: 'imei',
        value: match[1],
        confidence
      });
    }
  });
  
  // Serial number detection (typically labeled as S/N, SN, Serial No)
  const serialRegex = /(?:S(?:erial)?\s*(?:No|Number|N|#)[:\s]*|SN[:\s]*)([A-Z0-9]{5,})/gi;
  const serialMatches = [...ocrText.matchAll(serialRegex)];
  
  serialMatches.forEach(match => {
    if (match[1]) {
      results.push({
        type: 'serial',
        value: match[1],
        confidence
      });
    }
  });
  
  // Document ID detection (typically for ID cards, passports)
  const documentIdRegex = /(?:ID|Document|Passport|License)[:\s#]*([A-Z0-9]{5,})/gi;
  const documentMatches = [...ocrText.matchAll(documentIdRegex)];
  
  documentMatches.forEach(match => {
    if (match[1]) {
      results.push({
        type: 'document',
        value: match[1],
        confidence
      });
    }
  });
  
  // If no specific identifiers were found but text contains sequences that look like identifiers
  if (results.length === 0) {
    // Look for any sequence of alphanumeric characters that might be an identifier
    const genericIdRegex = /\b([A-Z0-9]{7,})\b/g;
    const genericMatches = [...ocrText.matchAll(genericIdRegex)];
    
    genericMatches.forEach(match => {
      if (match[1]) {
        results.push({
          type: 'unknown',
          value: match[1],
          confidence: confidence * 0.8 // Lower confidence for generic matches
        });
      }
    });
  }
  
  return results;
}