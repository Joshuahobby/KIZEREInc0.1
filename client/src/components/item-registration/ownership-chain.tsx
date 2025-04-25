import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { 
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Calendar,
  ChevronUp,
  ChevronDown,
  PlusCircle,
  Trash2,
  FileStack,
  Link2,
  History,
  X,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  OwnershipDocument, 
  OwnershipDocumentType, 
  createOwnershipDocument, 
  sortOwnershipDocuments,
  reorderDocuments,
  cleanupDocumentPreviews,
  getDocumentTypeName,
  calculateOwnershipTimespan
} from "@/utils/ownership-utils";

interface OwnershipChainProps {
  onChange: (documents: OwnershipDocument[]) => void;
  className?: string;
}

export function OwnershipChain({ onChange, className }: OwnershipChainProps) {
  const [documents, setDocuments] = useState<OwnershipDocument[]>([]);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  
  // DnD Kit sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle document reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setDocuments((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return reorderDocuments(items, oldIndex, newIndex);
      });
    }
  }, []);
  
  // Dropzone for the document upload
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        const errorMessages = errors.map(e => e.message).join(', ');
        toast({
          title: "File rejected",
          description: `${file.name}: ${errorMessages}`,
          variant: "destructive",
        });
      });
    }
    
    // Process accepted files
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]; // Take only the first file for now
      
      // Create a new document entry
      const newDocument = createOwnershipDocument(
        file,
        OwnershipDocumentType.RECEIPT, // Default type
        new Date(),
        "",
        documents.length
      );
      
      setDocuments(prev => [...prev, newDocument]);
      setExpandedDocId(newDocument.id); // Expand the newly added document
      
      toast({
        title: "Document added",
        description: "Please complete the document details.",
        variant: "default",
      });
    }
  }, [documents]);
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });
  
  // Remove a document
  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => {
      // Find the document to remove
      const docToRemove = prev.find(doc => doc.id === id);
      
      // If found, revoke its object URL
      if (docToRemove) {
        URL.revokeObjectURL(docToRemove.preview);
      }
      
      // Remove the document and return the updated array
      return prev.filter(doc => doc.id !== id);
    });
    
    // If the removed document was expanded, close the expansion
    if (expandedDocId === id) {
      setExpandedDocId(null);
    }
  }, [expandedDocId]);
  
  // Update document metadata
  const updateDocument = useCallback((id: string, updates: Partial<OwnershipDocument>) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id 
          ? { ...doc, ...updates }
          : doc
      )
    );
  }, []);
  
  // Toggle document expansion
  const toggleExpand = useCallback((id: string) => {
    setExpandedDocId(prev => prev === id ? null : id);
  }, []);
  
  // Update the parent component when documents change
  useEffect(() => {
    onChange(documents);
  }, [documents, onChange]);
  
  // Cleanup preview URLs when unmounting
  useEffect(() => {
    return () => {
      cleanupDocumentPreviews(documents);
    };
  }, [documents]);
  
  // Sort documents by order
  const sortedDocuments = sortOwnershipDocuments(documents);
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 rounded-lg p-4 border">
        <div>
          <h3 className="text-sm font-medium flex items-center">
            <FileStack className="h-4 w-4 mr-2 text-primary" />
            Ownership Documentation
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Create a verifiable chain of ownership with supporting documents
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-xs border rounded-full px-3 py-1 bg-white">
            <span className="font-medium">{documents.length}</span> document{documents.length !== 1 ? 's' : ''}
          </div>
          
          {documents.length > 0 && (
            <div className="text-xs border rounded-full px-3 py-1 bg-white flex items-center">
              <History className="h-3 w-3 mr-1 text-gray-400" />
              {calculateOwnershipTimespan(documents)}
            </div>
          )}
        </div>
      </div>
      
      {/* Document upload area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg transition-all",
          "flex flex-col items-center justify-center p-6",
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 bg-gray-50"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="text-center space-y-3">
          <PlusCircle className="h-12 w-12 mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive 
                ? "Drop document here..." 
                : "Add ownership document"
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Upload receipts, warranty cards, certificates, or other ownership documents
            </p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            <Upload className="h-4 w-4 mr-2" /> 
            Select Document
          </Button>
        </div>
      </div>
      
      {/* Document list */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center">
            <Link2 className="h-4 w-4 mr-2" />
            Ownership Timeline
          </h4>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedDocuments.map(doc => doc.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sortedDocuments.map((document, index) => (
                  <DocumentItem
                    key={document.id}
                    document={document}
                    isExpanded={document.id === expandedDocId}
                    onToggleExpand={() => toggleExpand(document.id)}
                    onRemove={() => removeDocument(document.id)}
                    onUpdate={(updates) => updateDocument(document.id, updates)}
                    isFirst={index === 0}
                    isLast={index === sortedDocuments.length - 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
      
      {/* Instructions */}
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-700" />
        <AlertTitle className="text-blue-700 text-sm">Ownership Verification</AlertTitle>
        <AlertDescription className="text-blue-600 text-xs">
          Upload documents that prove your ownership of the item. This creates a verifiable
          ownership chain that can be useful in case of disputes or when selling the item.
          Start with the original purchase receipt and add subsequent documents in chronological order.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Individual document item component
interface DocumentItemProps {
  document: OwnershipDocument;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<OwnershipDocument>) => void;
  isFirst: boolean;
  isLast: boolean;
}

function DocumentItem({
  document,
  isExpanded,
  onToggleExpand,
  onRemove,
  onUpdate,
  isFirst,
  isLast
}: DocumentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 10 : 1,
  };
  
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging ? "shadow-lg opacity-80" : "",
        isExpanded ? "border-primary" : ""
      )}
    >
      {/* Timeline connector lines */}
      {!isFirst && (
        <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-300" />
      )}
      {!isLast && (
        <div className="absolute left-6 -bottom-3 w-0.5 h-3 bg-gray-300" />
      )}
      
      <CardHeader className="pb-2 flex flex-row items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-300">
            {(() => {
              switch (document.type) {
                case OwnershipDocumentType.RECEIPT:
                  return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.5 3a2.5 2.5 0 1 1 0 5H3"/></svg>;
                case OwnershipDocumentType.WARRANTY:
                  return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>;
                case OwnershipDocumentType.CERTIFICATE:
                  return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6H3v11a2 2 0 0 0 2 2h10"/><path d="M15 8v6"/><path d="M15 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M14.5 14.5 17 17"/><path d="M17 8h4"/><path d="M21 12h-4"/><path d="M21 16h-4"/></svg>;
                case OwnershipDocumentType.REPAIR:
                  return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
                case OwnershipDocumentType.MAINTENANCE:
                  return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
                case OwnershipDocumentType.TRANSFER:
                  return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
                default:
                  return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>;
              }
            })()}
          </div>
        </div>
        
        <div className="flex-grow">
          <CardTitle className="text-sm">
            {getDocumentTypeName(document.type)}
          </CardTitle>
          <CardDescription className="text-xs">
            {format(document.date, 'PP')}
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-2 cursor-grab active:cursor-grabbing rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          </div>
          
          {/* Expand toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {/* Remove button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <>
          <CardContent className="space-y-4 pt-0">
            {/* Document preview */}
            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
              {document.file.type.startsWith('image/') ? (
                <img
                  src={document.preview}
                  alt={document.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <FileStack className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600">{document.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {document.file.type || 'Unknown document type'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Document type */}
            <div className="grid gap-2">
              <Label htmlFor={`doc-type-${document.id}`}>Document Type</Label>
              <Select
                value={document.type}
                onValueChange={(value) => onUpdate({ type: value as OwnershipDocumentType })}
              >
                <SelectTrigger id={`doc-type-${document.id}`}>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OwnershipDocumentType.RECEIPT}>Purchase Receipt</SelectItem>
                  <SelectItem value={OwnershipDocumentType.WARRANTY}>Warranty Card</SelectItem>
                  <SelectItem value={OwnershipDocumentType.CERTIFICATE}>Certificate of Authenticity</SelectItem>
                  <SelectItem value={OwnershipDocumentType.REPAIR}>Repair Record</SelectItem>
                  <SelectItem value={OwnershipDocumentType.MAINTENANCE}>Maintenance Record</SelectItem>
                  <SelectItem value={OwnershipDocumentType.TRANSFER}>Transfer of Ownership</SelectItem>
                  <SelectItem value={OwnershipDocumentType.OTHER}>Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Document date */}
            <div className="grid gap-2">
              <Label htmlFor={`doc-date-${document.id}`}>Document Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id={`doc-date-${document.id}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(document.date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={document.date}
                    onSelect={(date) => date && onUpdate({ date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor={`doc-desc-${document.id}`}>Description</Label>
              <Textarea
                id={`doc-desc-${document.id}`}
                value={document.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Enter any additional details about this document"
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-0">
            <div className="text-xs text-gray-500">
              Added {format(new Date(document.file.lastModified), 'PPpp')}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}