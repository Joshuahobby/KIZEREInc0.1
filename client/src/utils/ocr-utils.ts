import { createWorker } from 'tesseract.js';

/**
 * OCR Configuration options
 */
export interface OCROptions {
  language?: string;
  whitelist?: string;
  maxProcessingTime?: number;
}

/**
 * Default OCR options
 */
const DEFAULT_OPTIONS: OCROptions = {
  language: 'eng',
  whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_',
  maxProcessingTime: 30000, // 30 seconds
};

/**
 * Pattern for detecting IMEIs (15 digits, often separated by dashes or dots)
 * More robust pattern that handles common separators
 */
const IMEI_PATTERN = /\b\d{2}[-\.\s]?\d{6}[-\.\s]?\d{6}[-\.\s]?\d{1}\b/g;

/**
 * Pattern for detecting serial numbers (alphanumeric, often starts with S/N or Serial)
 */
const SERIAL_PATTERN = /\b(?:S\/N|SN|SERIAL)?[:\s-]*([A-Z0-9]{6,20})\b/gi;

/**
 * Pattern for matching document IDs (National ID, Passport)
 * Added support for Rwandan ID (16 digits) and common international passport formats
 */
const ID_PATTERN = /\b(?:[12]\d{15})|(?:[A-Z]{1,2}\d{6,9})\b/g;

/**
 * Process an image with OCR to extract text
 * 
 * @param imageFile The image file to process
 * @param options OCR processing options
 * @returns Promise that resolves to the extracted text
 */
export async function extractTextFromImage(
  imageFile: File,
  options: OCROptions = DEFAULT_OPTIONS
): Promise<string> {
  const worker = await createWorker(options.language || 'eng', 1, {
    logger: m => console.log(m),
  });
  
  try {
    // Set additional options
    if (options.whitelist || DEFAULT_OPTIONS.whitelist) {
      await worker.setParameters({
        tessedit_char_whitelist: options.whitelist || DEFAULT_OPTIONS.whitelist,
      });
    }
    
    // Set timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        reject(new Error('OCR processing timed out'));
      }, options.maxProcessingTime || DEFAULT_OPTIONS.maxProcessingTime || 30000);
    });
    
    // Process the image
    const recognizePromise = worker.recognize(imageFile);
    const result = (await Promise.race([recognizePromise, timeoutPromise])) as any;
    
    await worker.terminate();
    return result.data.text;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

/**
 * Extract potential identifiers from text using patterns
 * 
 * @param text Text extracted from image
 * @returns Array of potential identifiers detected
 */
export function extractIdentifiers(text: string): string[] {
  // Clean up text - remove line breaks and extra spaces
  const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Find matches for all patterns
  const imeiMatches = Array.from(cleanText.matchAll(IMEI_PATTERN), m => m[0]);
  const serialMatches = Array.from(cleanText.matchAll(SERIAL_PATTERN), m => m[0]);
  const idMatches = Array.from(cleanText.matchAll(ID_PATTERN), m => m[0]);
  
  // Combine all matches and remove duplicates
  const allMatches = [...imeiMatches, ...serialMatches, ...idMatches];
  return Array.from(new Set(allMatches));
}

/**
 * Determine the most likely type of identifier
 * 
 * @param identifier Identifier string to check
 * @returns The type of identifier ('imei', 'serial', 'id', or 'unknown')
 */
export function determineIdentifierType(identifier: string): 'imei' | 'serial' | 'id' | 'unknown' {
  if (IMEI_PATTERN.test(identifier)) {
    return 'imei';
  } else if (ID_PATTERN.test(identifier)) {
    return 'id';
  } else if (SERIAL_PATTERN.test(identifier)) {
    return 'serial';
  } else {
    return 'unknown';
  }
}