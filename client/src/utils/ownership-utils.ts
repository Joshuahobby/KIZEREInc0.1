/**
 * Ownership Chain Utilities
 * Functions and types for managing ownership documentation
 */

/**
 * Document types for ownership verification
 */
export type OwnershipDocumentType = 'receipt' | 'invoice' | 'warranty' | 'certificate' | 'transfer' | 'other';

/**
 * Document verification status options
 */
export type OwnershipDocumentStatus = 'pending' | 'verified' | 'rejected';

/**
 * Ownership document structure
 */
export interface OwnershipDocument {
  id: string;
  name: string;
  type: OwnershipDocumentType;
  status: OwnershipDocumentStatus;
  dateIssued: Date;
  issuer: string;
  notes?: string;
  file?: File;
  filePreview?: string;
  position: number;
}

/**
 * Create a new empty document object
 * 
 * @param position The position in the ownership chain
 * @returns A new document object with default values
 */
export function createEmptyDocument(position: number): OwnershipDocument {
  return {
    id: crypto.randomUUID(),
    name: '',
    type: 'receipt',
    status: 'pending',
    dateIssued: new Date(),
    issuer: '',
    position,
  };
}

/**
 * Get all available document types with translations
 * 
 * @returns Array of document type options with translation keys
 */
export function getDocumentTypes(): Array<{ value: OwnershipDocumentType, key: string }> {
  return [
    { value: 'receipt', key: 'ownership_receipt' },
    { value: 'invoice', key: 'ownership_invoice' },
    { value: 'warranty', key: 'ownership_warranty' },
    { value: 'certificate', key: 'ownership_certificate' },
    { value: 'transfer', key: 'ownership_transfer' },
    { value: 'other', key: 'ownership_other' },
  ];
}

/**
 * Get translation key for document type
 * 
 * @param type Document type
 * @returns Translation key
 */
export function getDocumentTypeKey(type: OwnershipDocumentType): string {
  const found = getDocumentTypes().find(t => t.value === type);
  return found ? found.key : 'ownership_other';
}

/**
 * Get translation key for document status
 * 
 * @param status Document status
 * @returns Translation key
 */
export function getStatusKey(status: OwnershipDocumentStatus): string {
  switch (status) {
    case 'verified': return 'ownership_verified';
    case 'rejected': return 'ownership_rejected';
    case 'pending': 
    default: return 'ownership_pending';
  }
}

/**
 * Sort documents by position
 * 
 * @param documents Array of documents to sort
 * @returns Sorted array of documents
 */
export function sortDocumentsByPosition(documents: OwnershipDocument[]): OwnershipDocument[] {
  return [...documents].sort((a, b) => a.position - b.position);
}

/**
 * Create a file preview URL
 * 
 * @param file File to create preview for
 * @returns Object URL for the file
 */
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Release a file preview URL to free memory
 * 
 * @param url URL to release
 */
export function releaseFilePreview(url?: string): void {
  if (url) URL.revokeObjectURL(url);
}

/**
 * Convert a document to FormData for API submission
 * 
 * @param document Document to convert
 * @returns FormData object with document fields
 */
export function documentToFormData(document: OwnershipDocument): FormData {
  const formData = new FormData();
  
  formData.append('name', document.name);
  formData.append('type', document.type);
  formData.append('status', document.status);
  formData.append('dateIssued', document.dateIssued.toISOString());
  formData.append('issuer', document.issuer);
  formData.append('position', document.position.toString());
  
  if (document.notes) {
    formData.append('notes', document.notes);
  }
  
  if (document.file) {
    formData.append('file', document.file, document.file.name);
  }
  
  return formData;
}

/**
 * Validate a document for completeness
 * 
 * @param document Document to validate
 * @returns Object with isValid boolean and errors array
 */
export function validateDocument(document: OwnershipDocument): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!document.name.trim()) {
    errors.push('Document name is required');
  }
  
  if (!document.issuer.trim()) {
    errors.push('Issuer is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}