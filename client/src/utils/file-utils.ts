/**
 * Utility functions for handling files, particularly image uploads
 */

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];

/**
 * Type for file upload error
 */
export type FileUploadError = {
  code: 'file-too-large' | 'file-type-not-allowed' | 'upload-failed';
  message: string;
};

/**
 * Type for successful file upload result
 */
export type FileUploadSuccess = {
  url: string;
  file: File;
};

/**
 * Type for file upload result
 */
export type FileUploadResult = {
  success: boolean;
  data?: FileUploadSuccess;
  error?: FileUploadError;
};

/**
 * Convert a file to a data URL (base64)
 * @param file The file to convert
 * @returns A promise that resolves with the data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Validate a file against size and type constraints
 * @param file The file to validate
 * @param allowedTypes Array of allowed MIME types
 * @param maxSize Maximum file size in bytes
 * @returns Object indicating if validation was successful and any error details
 */
export const validateFile = (
  file: File,
  allowedTypes = ALLOWED_IMAGE_TYPES,
  maxSize = MAX_FILE_SIZE
): { valid: boolean; error?: FileUploadError } => {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: {
        code: 'file-too-large',
        message: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
      },
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: {
        code: 'file-type-not-allowed',
        message: `File type not allowed. Allowed types are: ${allowedTypes.join(', ')}`,
      },
    };
  }

  return { valid: true };
};

/**
 * Process a file upload
 * @param file The file to upload
 * @param allowedTypes Array of allowed MIME types
 * @param maxSize Maximum file size in bytes
 * @returns A promise that resolves with the upload result
 */
export const processFileUpload = async (
  file: File,
  allowedTypes = ALLOWED_IMAGE_TYPES,
  maxSize = MAX_FILE_SIZE
): Promise<FileUploadResult> => {
  // Validate the file
  const validation = validateFile(file, allowedTypes, maxSize);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    // Convert the file to a data URL
    const url = await fileToDataUrl(file);

    // In a real application, you would upload the file to your server or a storage service
    // and get back a URL to the uploaded file. For this demo, we'll just use the data URL.

    return {
      success: true,
      data: {
        url,
        file,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'upload-failed',
        message: error instanceof Error ? error.message : 'Failed to upload file.',
      },
    };
  }
};

/**
 * Process multiple file uploads
 * @param files The files to upload
 * @param allowedTypes Array of allowed MIME types
 * @param maxSize Maximum file size in bytes
 * @returns A promise that resolves with an array of upload results
 */
export const processMultipleFileUploads = async (
  files: File[],
  allowedTypes = ALLOWED_IMAGE_TYPES,
  maxSize = MAX_FILE_SIZE
): Promise<FileUploadResult[]> => {
  const results: FileUploadResult[] = [];

  for (const file of files) {
    const result = await processFileUpload(file, allowedTypes, maxSize);
    results.push(result);
  }

  return results;
};