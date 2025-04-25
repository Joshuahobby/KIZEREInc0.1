/**
 * Helper functions for image uploading, validation, and processing
 */

// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Accepted file types for images
export const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

// Accepted file types for documents
export const ACCEPTED_DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

/**
 * File validation error type
 */
export type FileValidationError = 'too-many-files' | 'file-too-large' | 'file-invalid-type' | 'too-many-uploads';

/**
 * File validation result interface
 */
export interface FileValidationResult {
  valid: boolean;
  errorCode?: FileValidationError;
  errorMessage?: string;
}

/**
 * Validate file size and type for image uploads
 * @param file The file to validate
 * @param maxSize Maximum allowed file size in bytes
 * @returns Validation result
 */
export function validateImageFile(file: File, maxSize: number = MAX_FILE_SIZE): FileValidationResult {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      errorCode: 'file-too-large',
      errorMessage: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`
    };
  }
  
  // Check file type
  if (!Object.keys(ACCEPTED_IMAGE_TYPES).includes(file.type)) {
    return {
      valid: false,
      errorCode: 'file-invalid-type',
      errorMessage: 'File type not accepted. Please upload JPG, PNG, GIF, or WebP images.'
    };
  }
  
  return { valid: true };
}

/**
 * Validate file size and type for document uploads
 * @param file The file to validate
 * @param maxSize Maximum allowed file size in bytes
 * @returns Validation result
 */
export function validateDocumentFile(file: File, maxSize: number = MAX_FILE_SIZE): FileValidationResult {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      errorCode: 'file-too-large',
      errorMessage: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`
    };
  }
  
  // Check file type
  if (!Object.keys(ACCEPTED_DOCUMENT_TYPES).includes(file.type)) {
    return {
      valid: false,
      errorCode: 'file-invalid-type',
      errorMessage: 'File type not accepted. Please upload PDF, JPG, PNG, DOC, or DOCX files.'
    };
  }
  
  return { valid: true };
}

/**
 * Create a preview URL for a file
 * @param file The file to preview
 * @returns URL for previewing the file
 */
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free browser memory
 * @param previewUrl The preview URL to revoke
 */
export function revokeFilePreview(previewUrl: string): void {
  URL.revokeObjectURL(previewUrl);
}

/**
 * Create a formatted file size string (e.g., "2.5 MB")
 * @param bytes The file size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Convert a Data URL to a File object
 * @param dataUrl The Data URL to convert
 * @param filename The filename to use
 * @returns File object
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * Compress an image file to reduce its size
 * @param file The image file to compress
 * @param maxWidth Maximum width in pixels
 * @param quality Compression quality (0-1)
 * @returns Promise with the compressed file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();
    img.onload = () => {
      // Create canvas for drawing the resized image
      const canvas = document.createElement('canvas');
      
      // Calculate dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL with compression
      const dataUrl = canvas.toDataURL(file.type, quality);
      
      // Convert back to File
      const compressedFile = dataURLtoFile(dataUrl, file.name);
      
      resolve(compressedFile);
    };
    
    img.onerror = () => {
      reject(new Error('Error loading image'));
    };
    
    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Organize files into numbered order based on their position
 * @param files Array of files with positions
 * @returns Files with standardized names (e.g., "image_1.jpg", "image_2.jpg")
 */
export function organizeFilesWithOrder<T extends { file: File; position: number }>(
  files: T[]
): (T & { standardizedName: string })[] {
  // Sort by position
  const sortedFiles = [...files].sort((a, b) => a.position - b.position);
  
  // Add standardized names
  return sortedFiles.map((fileObj, index) => {
    const { file } = fileObj;
    const extension = file.name.split('.').pop() || 'jpg';
    const standardizedName = `image_${index + 1}.${extension}`;
    
    return {
      ...fileObj,
      standardizedName
    };
  });
}