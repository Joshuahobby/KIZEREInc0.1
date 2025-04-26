/**
 * Type declarations for modules without TypeScript definitions
 */

declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  const xssClean: () => RequestHandler;
  export default xssClean;
}

declare module 'sanitize-html' {
  interface SanitizeOptions {
    allowedTags?: string[];
    allowedAttributes?: { [key: string]: string[] };
    allowedSchemes?: string[];
    [key: string]: any;
  }
  
  function sanitizeHtml(html: string, options?: SanitizeOptions): string;
  export default sanitizeHtml;
}