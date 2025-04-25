declare module 'qrcode' {
  export interface QRCodeToStringOptions {
    type?: string;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    small?: boolean;
  }

  export interface QRCodeToDataURLOptions {
    type?: string;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    scale?: number;
    small?: boolean;
  }

  export interface QRCodeToFileOptions {
    type?: string;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    scale?: number;
    small?: boolean;
  }

  export interface QRCodeToBufferOptions {
    type?: string;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high' | 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    scale?: number;
    small?: boolean;
  }

  export interface QRCodeSegment {
    data: string | Buffer | Uint8Array;
    mode?: string;
  }

  export interface QRCodeRenderersOptions {
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toString(text: string | QRCodeSegment[], options?: QRCodeToStringOptions): Promise<string>;
  export function toString(text: string | QRCodeSegment[], callback: (error: Error | null, string: string) => void): void;
  export function toString(text: string | QRCodeSegment[], options: QRCodeToStringOptions, callback: (error: Error | null, string: string) => void): void;

  export function toDataURL(text: string | QRCodeSegment[], options?: QRCodeToDataURLOptions): Promise<string>;
  export function toDataURL(text: string | QRCodeSegment[], callback: (error: Error | null, url: string) => void): void;
  export function toDataURL(text: string | QRCodeSegment[], options: QRCodeToDataURLOptions, callback: (error: Error | null, url: string) => void): void;

  export function toCanvas(text: string | QRCodeSegment[], canvas: HTMLCanvasElement, options?: QRCodeRenderersOptions): Promise<HTMLCanvasElement>;
  export function toCanvas(text: string | QRCodeSegment[], canvas: HTMLCanvasElement, callback: (error: Error | null, canvas: HTMLCanvasElement) => void): void;
  export function toCanvas(text: string | QRCodeSegment[], canvas: HTMLCanvasElement, options: QRCodeRenderersOptions, callback: (error: Error | null, canvas: HTMLCanvasElement) => void): void;
  export function toCanvas(canvas: HTMLCanvasElement, text: string | QRCodeSegment[], options?: QRCodeRenderersOptions): Promise<HTMLCanvasElement>;
  export function toCanvas(canvas: HTMLCanvasElement, text: string | QRCodeSegment[], callback: (error: Error | null, canvas: HTMLCanvasElement) => void): void;
  export function toCanvas(canvas: HTMLCanvasElement, text: string | QRCodeSegment[], options: QRCodeRenderersOptions, callback: (error: Error | null, canvas: HTMLCanvasElement) => void): void;
  export function toCanvas(text: string | QRCodeSegment[], options?: QRCodeRenderersOptions): Promise<HTMLCanvasElement>;
  export function toCanvas(text: string | QRCodeSegment[], callback: (error: Error | null, canvas: HTMLCanvasElement) => void): void;
  export function toCanvas(text: string | QRCodeSegment[], options: QRCodeRenderersOptions, callback: (error: Error | null, canvas: HTMLCanvasElement) => void): void;

  export function toFile(path: string, text: string | QRCodeSegment[], options?: QRCodeToFileOptions): Promise<void>;
  export function toFile(path: string, text: string | QRCodeSegment[], callback: (error: Error | null) => void): void;
  export function toFile(path: string, text: string | QRCodeSegment[], options: QRCodeToFileOptions, callback: (error: Error | null) => void): void;

  export function toBuffer(text: string | QRCodeSegment[], options?: QRCodeToBufferOptions): Promise<Buffer>;
  export function toBuffer(text: string | QRCodeSegment[], callback: (error: Error | null, buffer: Buffer) => void): void;
  export function toBuffer(text: string | QRCodeSegment[], options: QRCodeToBufferOptions, callback: (error: Error | null, buffer: Buffer) => void): void;
}