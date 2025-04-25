/**
 * Types of ownership documents
 */
export enum OwnershipDocumentType {
  RECEIPT = 'receipt',
  WARRANTY = 'warranty',
  CERTIFICATE = 'certificate',
  REPAIR = 'repair_record',
  MAINTENANCE = 'maintenance_record',
  TRANSFER = 'transfer_document',
  OTHER = 'other',
}

/**
 * Interface for ownership document with metadata
 */
export interface OwnershipDocument {
  id: string;
  file: File;
  preview: string;
  name: string;
  type: OwnershipDocumentType;
  date: Date;
  description: string;
  order: number;
}

/**
 * Get display name for ownership document type
 * @param type The ownership document type
 * @returns Human-readable document type name
 */
export function getDocumentTypeName(type: OwnershipDocumentType): string {
  const names: Record<OwnershipDocumentType, string> = {
    [OwnershipDocumentType.RECEIPT]: 'Purchase Receipt',
    [OwnershipDocumentType.WARRANTY]: 'Warranty Card',
    [OwnershipDocumentType.CERTIFICATE]: 'Certificate of Authenticity',
    [OwnershipDocumentType.REPAIR]: 'Repair Record',
    [OwnershipDocumentType.MAINTENANCE]: 'Maintenance Record',
    [OwnershipDocumentType.TRANSFER]: 'Transfer of Ownership',
    [OwnershipDocumentType.OTHER]: 'Other Document',
  };
  
  return names[type] || 'Unknown Document';
}

/**
 * Create a new ownership document
 * @param file The document file
 * @param type The type of ownership document
 * @param date The date of the document
 * @param description Description of the document
 * @param order Order in the ownership chain
 * @returns OwnershipDocument object
 */
export function createOwnershipDocument(
  file: File,
  type: OwnershipDocumentType = OwnershipDocumentType.OTHER,
  date: Date = new Date(),
  description: string = '',
  order: number = 0
): OwnershipDocument {
  return {
    id: `${type}-${Date.now()}`,
    file,
    preview: URL.createObjectURL(file),
    name: file.name,
    type,
    date,
    description,
    order,
  };
}

/**
 * Sort ownership documents chronologically
 * @param documents Array of ownership documents
 * @returns Sorted array of documents
 */
export function sortOwnershipDocuments(documents: OwnershipDocument[]): OwnershipDocument[] {
  return [...documents].sort((a, b) => {
    // First sort by order if it's set
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    // Then sort by date
    return a.date.getTime() - b.date.getTime();
  });
}

/**
 * Reorder an array of ownership documents
 * @param documents The array to reorder
 * @param startIndex The original index
 * @param endIndex The destination index
 * @returns New array with the reordered documents
 */
export function reorderDocuments(
  documents: OwnershipDocument[],
  startIndex: number,
  endIndex: number
): OwnershipDocument[] {
  const result = Array.from(documents);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  
  // Update the order property of each document based on its new position
  return result.map((doc, index) => ({
    ...doc,
    order: index,
  }));
}

/**
 * Clean up object URLs to prevent memory leaks
 * @param documents Array of ownership documents with previews
 */
export function cleanupDocumentPreviews(documents: OwnershipDocument[]): void {
  documents.forEach(document => {
    URL.revokeObjectURL(document.preview);
  });
}

/**
 * Calculate the timespan of ownership based on documents
 * @param documents Array of ownership documents
 * @returns String representation of ownership timespan
 */
export function calculateOwnershipTimespan(documents: OwnershipDocument[]): string {
  if (documents.length === 0) {
    return 'No documents';
  }
  
  const sortedDocs = sortOwnershipDocuments(documents);
  const firstDate = sortedDocs[0].date;
  const lastDate = sortedDocs[sortedDocs.length - 1].date;
  
  // If only one document or all documents have the same date
  if (firstDate.getTime() === lastDate.getTime()) {
    return `Since ${firstDate.toLocaleDateString()}`;
  }
  
  // Calculate duration
  const durationMs = lastDate.getTime() - firstDate.getTime();
  const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
  
  if (durationDays < 30) {
    return `${durationDays} days (${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()})`;
  }
  
  if (durationDays < 365) {
    const months = Math.floor(durationDays / 30);
    return `${months} months (${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()})`;
  }
  
  const years = Math.floor(durationDays / 365);
  return `${years} years (${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()})`;
}