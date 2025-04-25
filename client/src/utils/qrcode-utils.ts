import QRCode from 'qrcode';

/**
 * QR Code generation options
 */
export interface QRCodeOptions {
  /**
   * QR code width in pixels (height will be equal)
   */
  width: number;
  
  /**
   * QR code margin in modules
   */
  margin: number;
  
  /**
   * QR code colors for foreground and background
   */
  color: {
    dark: string;
    light: string;
  };
  
  /**
   * Error correction level:
   * L: 7% recovery capacity
   * M: 15% recovery capacity
   * Q: 25% recovery capacity
   * H: 30% recovery capacity
   */
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Default QR code options
 */
export const DEFAULT_QR_OPTIONS: QRCodeOptions = {
  width: 200,
  margin: 4,
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  errorCorrectionLevel: 'M'
};

/**
 * Generate a QR code as a data URL string
 * 
 * @param text Text or URL to encode in the QR code
 * @param options QR code generation options
 * @returns Promise resolving to data URL string
 */
export async function generateQRCodeDataURL(
  text: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  // Merge default options with provided options
  const mergedOptions = {
    ...DEFAULT_QR_OPTIONS,
    ...options,
    color: {
      ...DEFAULT_QR_OPTIONS.color,
      ...(options.color || {})
    }
  };
  
  // Convert options to QRCode format
  const qrOptions = {
    errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color
  };
  
  try {
    // Generate QR code
    return await QRCode.toDataURL(text, qrOptions);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate a QR code as an SVG string
 * 
 * @param text Text or URL to encode in the QR code
 * @param options QR code generation options
 * @returns Promise resolving to SVG string
 */
export async function generateQRCodeSVG(
  text: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  // Merge default options with provided options
  const mergedOptions = {
    ...DEFAULT_QR_OPTIONS,
    ...options,
    color: {
      ...DEFAULT_QR_OPTIONS.color,
      ...(options.color || {})
    }
  };
  
  // Convert options to QRCode format
  const qrOptions = {
    errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color
  };
  
  try {
    // Generate QR code
    return await QRCode.toString(text, {
      ...qrOptions,
      type: 'svg'
    });
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw error;
  }
}

/**
 * Generate a QR code as a Canvas element
 * 
 * @param text Text or URL to encode in the QR code
 * @param canvas Canvas element to render the QR code on
 * @param options QR code generation options
 * @returns Promise resolving when the QR code is rendered
 */
export async function generateQRCodeCanvas(
  text: string,
  canvas: HTMLCanvasElement,
  options: Partial<QRCodeOptions> = {}
): Promise<void> {
  // Merge default options with provided options
  const mergedOptions = {
    ...DEFAULT_QR_OPTIONS,
    ...options,
    color: {
      ...DEFAULT_QR_OPTIONS.color,
      ...(options.color || {})
    }
  };
  
  // Convert options to QRCode format
  const qrOptions = {
    errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color
  };
  
  try {
    // Generate QR code
    return await QRCode.toCanvas(canvas, text, qrOptions);
  } catch (error) {
    console.error('Error generating QR code on canvas:', error);
    throw error;
  }
}

/**
 * Generate a downloadable QR code file
 * 
 * @param text Text or URL to encode in the QR code
 * @param fileName Name for the downloaded file
 * @param format File format ('svg' or 'png')
 * @param options QR code generation options
 */
export async function downloadQRCode(
  text: string,
  fileName: string,
  format: 'svg' | 'png' = 'svg',
  options: Partial<QRCodeOptions> = {}
): Promise<void> {
  try {
    let url: string;
    let mimeType: string;
    
    if (format === 'svg') {
      const svgText = await generateQRCodeSVG(text, options);
      url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
      mimeType = 'image/svg+xml';
    } else {
      url = await generateQRCodeDataURL(text, options);
      mimeType = 'image/png';
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName + (format === 'svg' ? '.svg' : '.png');
    
    // Add to document and trigger click
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
}