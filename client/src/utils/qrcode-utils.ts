import QRCode from 'qrcode';

/**
 * Options for QR code generation
 */
export interface QRCodeOptions {
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate a QR code as a data URL
 * @param text The text or URL to encode in the QR code
 * @param options Configuration options for the QR code
 * @returns Promise resolving to the QR code as a data URL
 */
export async function generateQRCode(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const defaultOptions = {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M' as const
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return await QRCode.toDataURL(text, mergedOptions);
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate a QR code for an item
 * @param itemId The unique identifier of the item
 * @param baseUrl The base URL of the application (for generating the full URL)
 * @param options Configuration options for the QR code
 * @returns Promise resolving to the QR code as a data URL
 */
export async function generateItemQRCode(
  itemId: number, 
  baseUrl: string = window.location.origin,
  options: QRCodeOptions = {}
): Promise<string> {
  const itemUrl = `${baseUrl}/items/verify/${itemId}`;
  return generateQRCode(itemUrl, options);
}

/**
 * Download QR code as an image file
 * @param dataUrl The QR code as a data URL
 * @param filename The name of the file to download
 */
export function downloadQRCode(dataUrl: string, filename: string = 'qrcode.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}