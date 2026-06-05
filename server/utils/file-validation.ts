/**
 * File validation utilities for secure upload handling
 * Phase 1.3: Validate image files (MIME type + magic bytes)
 */

import { createLogger } from './logger';

const logger = createLogger('FileValidation');

// Magic bytes for common image formats
const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF] // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46] // RIFF (WebP starts with RIFF....WEBP)
  ],
  'image/bmp': [
    [0x42, 0x4D] // BM
  ],
  // SVG intentionally excluded — SVG can carry XSS payloads via event handlers
};

// Document magic bytes
const DOCUMENT_MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46] // %PDF
  ],
  'application/msword': [
    [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] // OLE Compound Document
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04] // ZIP (Office 2007+ uses ZIP containers)
  ]
};

interface ValidationResult {
  isValid: boolean;
  detectedMimeType: string | null;
  error?: string;
}

/**
 * Validate file by checking magic bytes
 * @param buffer File buffer to validate
 * @param claimedMimeType The MIME type claimed by the file
 * @returns Validation result
 */
export function validateFileByMagicBytes(
  buffer: Buffer,
  claimedMimeType: string
): ValidationResult {
  if (!buffer || buffer.length < 8) {
    return {
      isValid: false,
      detectedMimeType: null,
      error: 'File is too small or empty'
    };
  }

  // Get file header (first 16 bytes should be enough for most formats)
  const header = Array.from(buffer.slice(0, 16));

  // Check if it's an image type
  if (claimedMimeType.startsWith('image/')) {
    return validateImageFile(header, claimedMimeType);
  }

  // Check if it's a document type
  if (claimedMimeType.startsWith('application/')) {
    return validateDocumentFile(header, claimedMimeType);
  }

  // For text/plain, do basic validation
  if (claimedMimeType === 'text/plain') {
    return { isValid: true, detectedMimeType: 'text/plain' };
  }

  return {
    isValid: false,
    detectedMimeType: null,
    error: `Unsupported file type: ${claimedMimeType}`
  };
}

/**
 * Validate image file by checking magic bytes
 */
function validateImageFile(header: number[], claimedMimeType: string): ValidationResult {
  // Special case for WebP - check for RIFF....WEBP pattern
  if (claimedMimeType === 'image/webp') {
    const hasRiff = matchesMagicBytes(header, [0x52, 0x49, 0x46, 0x46]);
    // WEBP signature appears at offset 8-11
    const hasWebp = header[8] === 0x57 && header[9] === 0x45 && 
                    header[10] === 0x42 && header[11] === 0x50;
    if (hasRiff && hasWebp) {
      return { isValid: true, detectedMimeType: 'image/webp' };
    }
  }

  // Check each allowed image type — require detected type to match claimed type exactly
  for (const [mimeType, patterns] of Object.entries(IMAGE_MAGIC_BYTES)) {
    for (const pattern of patterns) {
      if (matchesMagicBytes(header, pattern)) {
        if (mimeType === claimedMimeType) {
          return { isValid: true, detectedMimeType: mimeType };
        }
      }
    }
  }

  // Check if actually any known image format
  for (const [mimeType, patterns] of Object.entries(IMAGE_MAGIC_BYTES)) {
    for (const pattern of patterns) {
      if (matchesMagicBytes(header, pattern)) {
        logger.warn('MIME type mismatch detected', {
          claimed: claimedMimeType,
          detected: mimeType
        });
        return {
          isValid: false,
          detectedMimeType: mimeType,
          error: `File content does not match claimed type. Expected ${claimedMimeType}, detected ${mimeType}`
        };
      }
    }
  }

  return {
    isValid: false,
    detectedMimeType: null,
    error: 'File does not appear to be a valid image'
  };
}

/**
 * Validate document file by checking magic bytes
 */
function validateDocumentFile(header: number[], claimedMimeType: string): ValidationResult {
  for (const [mimeType, patterns] of Object.entries(DOCUMENT_MAGIC_BYTES)) {
    for (const pattern of patterns) {
      if (matchesMagicBytes(header, pattern)) {
        return { isValid: true, detectedMimeType: mimeType };
      }
    }
  }

  // ZIP-based formats (Office 2007+)
  if (matchesMagicBytes(header, [0x50, 0x4B, 0x03, 0x04])) {
    // It's a ZIP container, could be docx, xlsx, etc.
    if (claimedMimeType.includes('openxmlformats')) {
      return { isValid: true, detectedMimeType: claimedMimeType };
    }
  }

  return {
    isValid: false,
    detectedMimeType: null,
    error: 'File does not appear to be a valid document'
  };
}

/**
 * Check if header matches magic bytes pattern
 */
function matchesMagicBytes(header: number[], pattern: number[]): boolean {
  if (header.length < pattern.length) return false;
  return pattern.every((byte, index) => header[index] === byte);
}

/**
 * Check for potentially dangerous content in files
 * @param buffer File buffer
 * @returns True if suspicious content is detected
 */
export function hasSuspiciousContent(buffer: Buffer): boolean {
  // Scan full file — payloads can be embedded beyond the first 1000 bytes
  const content = buffer.toString('utf-8', 0, buffer.length);

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /<\?php/i,
    /<%/,
    /eval\s*\(/i,
    /document\.(cookie|write|location)/i,
    /window\.(location|open)/i,
    // SVG-specific event handler injection
    /\bon\w+\s*=/i,
    /<foreignObject/i,
    /xlink:href/i,
    // PDF active content
    /\/JS\s/i,
    /\/JavaScript/i,
    /\/OpenAction/i,
    /\/AA\s/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(content));
}

/**
 * Comprehensive file validation
 */
export function validateUploadedFile(
  buffer: Buffer,
  claimedMimeType: string,
  maxSizeBytes: number = 5 * 1024 * 1024 // 5MB default
): ValidationResult {
  // Size check
  if (buffer.length > maxSizeBytes) {
    return {
      isValid: false,
      detectedMimeType: null,
      error: `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Magic bytes check
  const magicResult = validateFileByMagicBytes(buffer, claimedMimeType);
  if (!magicResult.isValid) {
    return magicResult;
  }

  // Suspicious content check (especially for images that might have embedded scripts)
  if (hasSuspiciousContent(buffer)) {
    logger.warn('Suspicious content detected in uploaded file', { claimedMimeType });
    return {
      isValid: false,
      detectedMimeType: magicResult.detectedMimeType,
      error: 'File contains suspicious content'
    };
  }

  return magicResult;
}

export default {
  validateFileByMagicBytes,
  validateUploadedFile,
  hasSuspiciousContent
};
