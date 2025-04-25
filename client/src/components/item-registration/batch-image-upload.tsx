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
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/item-registration/sortable-item";
import { Button } from "@/components/ui/button";
import { 
  processUploadedFiles, 
  cleanupPreviews, 
  UploadedImage, 
  formatFileSize 
} from "@/utils/image-upload-utils";
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface BatchImageUploadProps {
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
}

export function BatchImageUpload({
  onChange,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  className
}: BatchImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  
  // DnD Kit sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Dropzone configuration
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
    
    // Check if adding these files would exceed the max count
    if (images.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${maxFiles} images.`,
        variant: "destructive",
      });
      
      // Only add files up to the limit
      const remainingSlots = maxFiles - images.length;
      acceptedFiles = acceptedFiles.slice(0, remainingSlots);
    }
    
    // Process and add the accepted files
    if (acceptedFiles.length > 0) {
      const newImages = processUploadedFiles(acceptedFiles);
      setImages(prev => [...prev, ...newImages]);
    }
  }, [images, maxFiles]);
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize,
    noClick: images.length > 0,
    noKeyboard: images.length > 0,
  });
  
  // Handle image reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);
  
  // Remove an image
  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(image => image.id !== id));
  }, []);
  
  // Update the parent component when images change
  useEffect(() => {
    const files = images.map(image => image.file);
    onChange(files);
  }, [images, onChange]);
  
  // Cleanup preview URLs when unmounting
  useEffect(() => {
    return () => {
      cleanupPreviews(images);
    };
  }, [images]);
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg transition-all",
          "flex flex-col items-center justify-center p-4",
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 bg-gray-50",
          "min-h-[150px]"
        )}
      >
        <input {...getInputProps()} />
        
        {images.length === 0 ? (
          <div className="text-center space-y-3 py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium">
                {isDragActive 
                  ? "Drop your images here..." 
                  : "Drag & drop images here, or click to select"
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports JPG, PNG, GIF up to {formatFileSize(maxSize)}
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
              Select Files
            </Button>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium">
                {images.length} {images.length === 1 ? "image" : "images"} selected
              </p>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                >
                  <Upload className="h-4 w-4 mr-1" /> 
                  Add More
                </Button>
                
                {images.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImages([]);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
            
            {/* Drag and drop sortable grid */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map(img => img.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map((image) => (
                    <SortableItem
                      key={image.id}
                      id={image.id}
                      name={image.name}
                      preview={image.preview}
                      size={formatFileSize(image.size)}
                      onRemove={() => removeImage(image.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {/* Dropzone guidance */}
            {isDragActive && (
              <div className="mt-3 bg-primary/10 border border-primary rounded-lg p-3 text-center">
                <p className="text-sm font-medium">Drop to add more images!</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Instructions and tips */}
      <div className="text-xs text-gray-500 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p>
          <span className="font-medium">Tips:</span> Upload clear, well-lit photos from multiple angles. 
          You can drag to reorder images, and the first image will be the main display image.
        </p>
      </div>
    </div>
  );
}