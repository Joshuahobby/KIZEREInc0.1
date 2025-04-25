import {
  validateDocumentFile,
  formatFileSize,
  createFilePreview,
  revokeFilePreview
} from './image-upload-utils';

/**
 * Ownership document types
 */
export enum DocumentType {
  Receipt = 'receipt',
  Invoice = 'invoice',
  WarrantyCard = 'warranty_card',
  Certificate = 'certificate',
  TransferDocument = 'transfer_document',
  Other = 'other'
}

/**
 * Document verification status
 */
export enum VerificationStatus {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected'
}

/**
 * Ownership document interface
 */
export interface OwnershipDocument {
  id: string;
  name: string;
  type: DocumentType;
  file: File;
  filePreview: string;
  dateIssued: Date | null;
  status: VerificationStatus;
  position: number;
  issuer?: string;
  notes?: string;
  size?: string;
}

/**
 * Create a new ownership document object
 * @param file The document file
 * @param type The document type
 * @param position The position in the ownership chain
 * @returns Ownership document object
 */
export function createOwnershipDocument(
  file: File,
  type: DocumentType = DocumentType.Other,
  position: number = 0
): OwnershipDocument {
  // Create a unique ID for the document
  const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create file preview
  const filePreview = createFilePreview(file);
  
  // Format file size
  const size = formatFileSize(file.size);
  
  // Default document name (from file)
  const name = file.name;
  
  return {
    id,
    name,
    type,
    file,
    filePreview,
    dateIssued: null,
    status: VerificationStatus.Pending,
    position,
    size
  };
}

/**
 * Validate an ownership document file
 * @param file The file to validate
 * @returns Validation result
 */
export function validateOwnershipDocument(file: File) {
  return validateDocumentFile(file);
}

/**
 * Organize ownership documents in chronological order
 * @param documents Array of ownership documents
 * @returns Sorted documents
 */
export function organizeDocumentsChronologically(documents: OwnershipDocument[]): OwnershipDocument[] {
  // First sort by position
  const sortedByPosition = [...documents].sort((a, b) => a.position - b.position);
  
  // Then, if dates are available, refine the order
  const documentsWithDates = sortedByPosition.filter(doc => doc.dateIssued !== null);
  const documentsWithoutDates = sortedByPosition.filter(doc => doc.dateIssued === null);
  
  if (documentsWithDates.length > 0) {
    documentsWithDates.sort((a, b) => {
      if (a.dateIssued && b.dateIssued) {
        return a.dateIssued.getTime() - b.dateIssued.getTime();
      }
      return 0;
    });
    
    // Combine the sorted documents
    return [...documentsWithDates, ...documentsWithoutDates];
  }
  
  return sortedByPosition;
}

/**
 * Clean up ownership document resources
 * @param documents Array of ownership documents to clean up
 */
export function cleanupDocumentResources(documents: OwnershipDocument[]): void {
  // Revoke file preview URLs to free browser memory
  for (const doc of documents) {
    if (doc.filePreview) {
      revokeFilePreview(doc.filePreview);
    }
  }
}

/**
 * Calculate the completeness of the ownership verification chain
 * @param documents Array of ownership documents
 * @returns Percentage of completeness (0-100)
 */
export function calculateOwnershipChainCompleteness(documents: OwnershipDocument[]): number {
  if (documents.length === 0) return 0;
  
  // The more documents and verified documents, the higher the score
  const baseScore = Math.min(documents.length * 20, 80); // Max 80% for number of docs
  
  // Add up to 20% more for verified documents
  const verifiedCount = documents.filter(doc => doc.status === VerificationStatus.Verified).length;
  const verificationScore = (verifiedCount / documents.length) * 20;
  
  return Math.min(baseScore + verificationScore, 100);
}

/**
 * Export the ownership chain as a JSON object
 * @param documents Array of ownership documents
 * @returns JSON representation of the chain
 */
export function exportOwnershipChain(documents: OwnershipDocument[]): string {
  // Sort documents chronologically
  const sortedDocuments = organizeDocumentsChronologically(documents);
  
  // Create a simplified version without the File objects (can't be serialized)
  const serializable = sortedDocuments.map(doc => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    dateIssued: doc.dateIssued ? doc.dateIssued.toISOString() : null,
    status: doc.status,
    position: doc.position,
    issuer: doc.issuer,
    notes: doc.notes
  }));
  
  return JSON.stringify(serializable, null, 2);
}

/**
 * Get a human-readable document type display name
 * @param type The document type
 * @returns Display name for the document type
 */
export function getDocumentTypeDisplayName(type: DocumentType): string {
  const displayNames: Record<DocumentType, string> = {
    [DocumentType.Receipt]: 'Receipt',
    [DocumentType.Invoice]: 'Invoice',
    [DocumentType.WarrantyCard]: 'Warranty Card',
    [DocumentType.Certificate]: 'Certificate of Ownership',
    [DocumentType.TransferDocument]: 'Transfer Document',
    [DocumentType.Other]: 'Other Document'
  };
  
  return displayNames[type] || 'Document';
}

/**
 * Get a human-readable verification status display name
 * @param status The verification status
 * @returns Display name for the verification status
 */
export function getVerificationStatusDisplayName(status: VerificationStatus): string {
  const displayNames: Record<VerificationStatus, string> = {
    [VerificationStatus.Pending]: 'Pending Verification',
    [VerificationStatus.Verified]: 'Verified',
    [VerificationStatus.Rejected]: 'Verification Rejected'
  };
  
  return displayNames[status] || 'Unknown Status';
}