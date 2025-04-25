/**
 * Interface for uploaded image with metadata
 */
export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/**
 * Process multiple files for batch upload
 * @param acceptedFiles Array of files from file input or dropzone
 * @returns Array of processed image objects
 */
export function processUploadedFiles(acceptedFiles: File[]): UploadedImage[] {
  return acceptedFiles.map(file => ({
    id: `${file.name}-${Date.now()}`,
    file,
    preview: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  }));
}

/**
 * Format file size in a human-readable way
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if a file is an image
 * @param file The file to check
 * @returns Boolean indicating if the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Reorder an array of items
 * @param list The array to reorder
 * @param startIndex The original index
 * @param endIndex The destination index
 * @returns New array with the reordered items
 */
export function reorderImages<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/**
 * Clean up object URLs to prevent memory leaks
 * @param images Array of uploaded images with previews
 */
export function cleanupPreviews(images: UploadedImage[]): void {
  images.forEach(image => {
    URL.revokeObjectURL(image.preview);
  });
}

/**
 * Get image dimensions
 * @param file The image file
 * @returns Promise resolving to an object with width and height
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress an image to reduce file size
 * @param file The image file to compress
 * @param maxWidth Maximum width of the compressed image
 * @param quality Compression quality (0 to 1)
 * @returns Promise resolving to the compressed file
 */
export async function compressImage(
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.8
): Promise<File> {
  // If it's not an image, return the original file
  if (!isImageFile(file)) {
    return file;
  }
  
  // Get the image dimensions
  const dimensions = await getImageDimensions(file);
  
  // If the image is already smaller than maxWidth, return the original
  if (dimensions.width <= maxWidth) {
    return file;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions, maintaining aspect ratio
      const scaleFactor = maxWidth / img.width;
      const newWidth = maxWidth;
      const newHeight = img.height * scaleFactor;
      
      // Create a canvas and draw the resized image
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          // Create a new file from the blob
          const newFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(newFile);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}