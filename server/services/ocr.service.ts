import { createWorker } from 'tesseract.js';
import { createLogger } from '../utils/logger';

const logger = createLogger('OCRService');

export class OCRService {
    /**
     * Extracts text from an image URL
     * @param imageUrl URL of the image to process
     * @returns extracted text
     */
    static async extractTextFromImage(imageUrl: string): Promise<string> {
        try {
            logger.info('Starting OCR processing', { imageUrl });

            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(imageUrl);
            await worker.terminate();

            logger.info('OCR processing complete', { textLength: text.length });
            return text;
        } catch (error) {
            logger.error('Error during OCR processing', { error, imageUrl });
            return '';
        }
    }

    /**
     * Extracts potential unique identifiers (IMEI, Serial, ID Numbers) from text
     * @param text raw OCR text
     * @returns object containing extracted identifiers
     */
    static extractIdentifiers(text: string): {
        idNumbers: string[];
        imei: string[];
        serialNumbers: string[];
    } {
        const idNumbers: string[] = [];
        const imei: string[] = [];
        const serialNumbers: string[] = [];

        // Common patterns for Rwanda IDs, Passports, and electronic devices
        const idPattern = /\b\d{16}\b/g; // 16-digit Rwanda ID
        const imeiPattern = /\b\d{15}\b/g; // 15-digit IMEI
        const serialPattern = /\b[A-Z0-9]{8,12}\b/g; // Generic serial pattern

        const matches = text.match(idPattern);
        if (matches) idNumbers.push(...matches);

        const imeiMatches = text.match(imeiPattern);
        if (imeiMatches) imei.push(...imeiMatches);

        // Filter serial numbers to avoid catching small words or numbers
        const serialMatches = text.match(serialPattern);
        if (serialMatches) {
            serialNumbers.push(...serialMatches.filter(s =>
                !idNumbers.includes(s) && !imei.includes(s) && isNaN(Number(s))
            ));
        }

        return { idNumbers, imei, serialNumbers };
    }
}
