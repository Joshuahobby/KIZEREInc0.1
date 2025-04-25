import QRCode from 'qrcode';

export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
}

/**
 * Generate a QR code as an SVG string
 * 
 * @param data - The data to encode in the QR code
 * @param options - Configuration options for the QR code
 * @returns SVG string representation of the QR code
 */
export const generateQRCodeSVG = async (
  data: string, 
  options: QRCodeOptions = {}
): Promise<string> => {
  try {
    const { 
      errorCorrectionLevel = 'M', 
      size = 300, 
      margin = 4,
      foregroundColor = '#000000',
      backgroundColor = '#FFFFFF'
    } = options;
    
    const qrOptions: QRCode.QRCodeToStringOptions = {
      type: 'svg',
      errorCorrectionLevel: errorCorrectionLevel,
      width: size,
      margin: margin,
      color: {
        dark: foregroundColor,
        light: backgroundColor
      }
    };
    
    return await QRCode.toString(data, qrOptions);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate a QR code as a data URL
 * 
 * @param data - The data to encode in the QR code
 * @param options - Configuration options for the QR code
 * @returns Data URL representation of the QR code
 */
export const generateQRCodeDataURL = async (
  data: string, 
  options: QRCodeOptions = {}
): Promise<string> => {
  try {
    const { 
      errorCorrectionLevel = 'M', 
      size = 300, 
      margin = 4,
      foregroundColor = '#000000',
      backgroundColor = '#FFFFFF'
    } = options;
    
    const qrOptions: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: errorCorrectionLevel,
      width: size,
      margin: margin,
      color: {
        dark: foregroundColor,
        light: backgroundColor
      }
    };
    
    return await QRCode.toDataURL(data, qrOptions);
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw error;
  }
};

/**
 * Create a downloadable QR code image
 * 
 * @param data - The data to encode in the QR code
 * @param options - Configuration options for the QR code
 * @param filename - The filename for the downloaded QR code
 */
export const downloadQRCode = async (
  data: string, 
  options: QRCodeOptions = {}, 
  filename: string = 'qrcode.png'
): Promise<void> => {
  try {
    const dataUrl = await generateQRCodeDataURL(data, options);
    
    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};

/**
 * Generate a printable version of the QR code 
 * 
 * @param data - The data to encode in the QR code
 * @param itemName - The name of the item for labeling
 * @param options - Configuration options for the QR code
 */
export const printQRCode = async (
  data: string,
  itemName: string,
  options: QRCodeOptions = {}
): Promise<void> => {
  try {
    const qrCodeDataUrl = await generateQRCodeDataURL(data, options);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Check if popup blocker is enabled.');
    }
    
    // Create the print document HTML
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code for ${itemName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              max-width: 400px;
              text-align: center;
            }
            .qr-image {
              width: ${options.size || 300}px;
              height: ${options.size || 300}px;
              margin-bottom: 15px;
            }
            .item-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .scan-instructions {
              font-size: 14px;
              color: #666;
            }
            @media print {
              body {
                min-height: auto;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrCodeDataUrl}" class="qr-image" alt="QR code for ${itemName}" />
            <div class="item-name">${itemName}</div>
            <div class="scan-instructions">Scan this QR code to view item details</div>
          </div>
        </body>
      </html>
    `);
    
    // Wait for the image to load before printing
    printWindow.document.addEventListener('load', () => {
      printWindow.print();
      printWindow.close();
    }, true);
    
    printWindow.document.close();
    
  } catch (error) {
    console.error('Error printing QR code:', error);
    throw error;
  }
};