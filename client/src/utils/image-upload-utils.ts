/**
 * Image upload utilities
 * Provides common functions for image upload, validation, and processing
 */

/**
 * Supported image MIME types
 */
export const SUPPORTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif']
};

/**
 * Check if file is an image based on MIME type
 * 
 * @param file The file to check
 * @returns True if the file is a supported image type
 */
export function isImageFile(file: File): boolean {
  return Object.keys(SUPPORTED_IMAGE_TYPES).includes(file.type);
}

/**
 * Get the extension for a given MIME type
 * 
 * @param mimeType The MIME type to get the extension for
 * @returns The file extension (with dot) or empty string if not found
 */
export function getExtensionForMimeType(mimeType: string): string {
  return SUPPORTED_IMAGE_TYPES[mimeType as keyof typeof SUPPORTED_IMAGE_TYPES]?.[0] || '';
}

/**
 * Validate image file size
 * 
 * @param file The file to validate
 * @param maxSizeMB Maximum size in megabytes
 * @returns True if the file size is within the allowed limit
 */
export function validateImageSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Create object URL for a file
 * 
 * @param file The file to create an object URL for
 * @returns The object URL
 */
export function createObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Release an object URL to free memory
 * 
 * @param url The object URL to release
 */
export function releaseObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Resize an image to a maximum width and height while maintaining aspect ratio
 * 
 * @param file The image file to resize
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @param quality JPEG quality (0-1)
 * @returns Promise resolving to a new Blob containing the resized image
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create image element to load the file
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // Release the object URL
      URL.revokeObjectURL(img.src);
      
      // Calculate dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw the image on the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not convert canvas to blob'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
  });
}

/**
 * Generate a unique filename for an uploaded image
 * 
 * @param originalName Original filename
 * @param mimeType MIME type of the file
 * @returns A unique filename with correct extension
 */
export function generateUniqueImageFilename(originalName: string, mimeType: string): string {
  const extension = getExtensionForMimeType(mimeType);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // Keep original name part but sanitize it
  const sanitizedName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-z0-9]/gi, '-') // Replace non-alphanumeric with hyphens
    .substring(0, 30); // Limit length
  
  return `${sanitizedName}-${timestamp}-${randomString}${extension}`;
}