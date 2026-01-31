import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { createLogger } from '../utils/logger';

const logger = createLogger('CloudinaryService');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Upload an image to Cloudinary from a base64 string or URL
 */
export async function uploadImage(
  imageData: string,
  folder: string = 'kizere'
): Promise<UploadResult> {
  try {
    logger.info('Uploading image to Cloudinary', { folder });

    const result: UploadApiResponse = await cloudinary.uploader.upload(imageData, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    logger.info('Image uploaded successfully', { publicId: result.public_id });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    logger.error('Failed to upload image to Cloudinary', { error });
    throw new Error('Failed to upload image');
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadImages(
  imageDataArray: string[],
  folder: string = 'kizere'
): Promise<UploadResult[]> {
  const results = await Promise.all(
    imageDataArray.map(imageData => uploadImage(imageData, folder))
  );
  return results;
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    logger.info('Deleting image from Cloudinary', { publicId });
    await cloudinary.uploader.destroy(publicId);
    logger.info('Image deleted successfully', { publicId });
    return true;
  } catch (error) {
    logger.error('Failed to delete image from Cloudinary', { error, publicId });
    return false;
  }
}

/**
 * Generate a signed upload URL for direct browser uploads
 */
export function getUploadSignature(folder: string = 'kizere'): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
} {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET as string
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    folder,
  };
}

export default cloudinary;
