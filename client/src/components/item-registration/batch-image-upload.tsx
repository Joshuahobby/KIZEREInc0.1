import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuImage, LuUpload, LuX, LuGripVertical, LuTrash2, LuLoader, LuPlusCircle } from 'react-icons/lu';

interface SortableItemProps {
  id: string;
  url: string;
  file: File;
  onRemove: (id: string) => void;
}

// The sortable thumbnail component
function SortableItem({ id, url, file, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative group p-2 border border-dashed rounded-md hover:border-primary/50 transition-colors"
    >
      <div className="relative aspect-square overflow-hidden rounded-md">
        <img src={url} alt={file.name} className="object-cover w-full h-full" />
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full bg-white text-black"
            onClick={() => onRemove(id)}
          >
            <LuTrash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div 
          className="absolute left-2 top-2 cursor-grab active:cursor-grabbing text-white/70 hover:text-white"
          {...attributes}
          {...listeners}
        >
          <LuGripVertical className="h-5 w-5 drop-shadow-md" />
        </div>
      </div>
      <div className="text-xs truncate mt-1 text-center">
        {file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name}
      </div>
    </div>
  );
}

export interface BatchImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
}

export function BatchImageUpload({ 
  onImagesChange, 
  maxFiles = 10, 
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'], 
  maxFileSizeMB = 5 
}: BatchImageUploadProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [images, setImages] = useState<{ id: string; file: File; url: string }[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Set up drag sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  // Validate file type
  const isValidFileType = (file: File) => {
    return acceptedFileTypes.includes(file.type);
  };
  
  // Validate file size
  const isValidFileSize = (file: File) => {
    return file.size <= maxFileSizeMB * 1024 * 1024;
  };
  
  // Generate a preview URL for an image file
  const generatePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };
  
  // Process files by validating and adding them to the state
  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    setIsUploading(true);
    
    const filesToAdd: { id: string; file: File; url: string }[] = [];
    const errors: string[] = [];
    
    Array.from(files).forEach(file => {
      // Check if we reached the max number of files
      if (images.length + filesToAdd.length >= maxFiles) {
        errors.push(t('batch_upload_max_files', { count: maxFiles }));
        return;
      }
      
      // Check file type
      if (!isValidFileType(file)) {
        errors.push(t('batch_upload_invalid_type'));
        return;
      }
      
      // Check file size
      if (!isValidFileSize(file)) {
        errors.push(t('batch_upload_max_size', { size: maxFileSizeMB }));
        return;
      }
      
      // Generate preview and add to list
      const id = Math.random().toString(36).substr(2, 9);
      const url = generatePreview(file);
      filesToAdd.push({ id, file, url });
    });
    
    // Show any errors
    if (errors.length > 0) {
      const uniqueErrors = [...new Set(errors)];
      uniqueErrors.forEach(error => {
        toast({
          title: t('error_title'),
          description: error,
          variant: 'destructive',
        });
      });
    }
    
    // Add validated files to state
    if (filesToAdd.length > 0) {
      const newImages = [...images, ...filesToAdd];
      setImages(newImages);
      
      // Extract just the File objects for the parent component
      const fileObjects = newImages.map(image => image.file);
      onImagesChange(fileObjects);
      
      toast({
        title: t('batch_upload_success'),
        description: t('batch_upload_success_desc', { count: filesToAdd.length }),
      });
    }
    
    setIsUploading(false);
  }, [images, maxFiles, maxFileSizeMB, toast, t, onImagesChange]);
  
  // Handle drag-n-drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    processFiles(e.dataTransfer.files);
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle removing an image
  const handleRemoveImage = (id: string) => {
    // Revoke the object URL to avoid memory leaks
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    // Remove from state
    const newImages = images.filter(img => img.id !== id);
    setImages(newImages);
    
    // Update parent component
    const fileObjects = newImages.map(image => image.file);
    onImagesChange(fileObjects);
    
    toast({
      title: t('batch_upload_removed'),
      description: t('batch_upload_removed_desc'),
    });
  };
  
  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setImages(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Update parent component with new order
        const fileObjects = reordered.map(image => image.file);
        onImagesChange(fileObjects);
        
        return reordered;
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('batch_upload_title')}</CardTitle>
        <CardDescription>{t('batch_upload_description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md text-center transition-colors ${
            isDraggingOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/30 hover:border-muted-foreground/50'
          }`}
        >
          <input
            type="file"
            accept={acceptedFileTypes.join(',')}
            multiple
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            disabled={isUploading || images.length >= maxFiles}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <LuLoader className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
              <p>{t('uploading')}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <LuImage className="h-10 w-10 text-muted-foreground mb-2" />
                <div className="text-lg font-medium mb-1">
                  {isDraggingOver ? t('drop_images') : t('drag_images')}
                </div>
                <p className="text-sm text-muted-foreground mb-3 max-w-xs">
                  {t('batch_upload_instructions', { maxFiles, maxSize: maxFileSizeMB })}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= maxFiles}
              >
                <LuUpload className="mr-2 h-4 w-4" />
                {t('select_images')}
              </Button>
            </>
          )}
        </div>
        
        {images.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {t('uploaded_images', { count: images.length, max: maxFiles })}
              </h3>
              {images.length > 1 && (
                <p className="text-sm text-muted-foreground">
                  {t('drag_to_reorder')}
                </p>
              )}
            </div>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {images.map((image) => (
                    <SortableItem
                      key={image.id}
                      id={image.id}
                      url={image.url}
                      file={image.file}
                      onRemove={handleRemoveImage}
                    />
                  ))}
                  
                  {images.length < maxFiles && (
                    <div 
                      className="aspect-square flex flex-col items-center justify-center border border-dashed rounded-md hover:border-primary/50 transition-colors cursor-pointer p-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <LuPlusCircle className="h-6 w-6 text-muted-foreground mb-2" />
                      <span className="text-xs text-center text-muted-foreground">
                        {t('add_more_images')}
                      </span>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {t('file_types')}: JPG, PNG, WebP
        </div>
        {images.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={() => {
              // Revoke all object URLs
              images.forEach(img => URL.revokeObjectURL(img.url));
              setImages([]);
              onImagesChange([]);
              
              toast({
                title: t('batch_upload_cleared'),
                description: t('batch_upload_cleared_desc'),
              });
            }}
          >
            <LuX className="mr-2 h-4 w-4" />
            {t('clear_all')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}