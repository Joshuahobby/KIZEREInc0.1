import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LuImage, LuPlus, LuTrash2, LuLoader, LuGripVertical } from 'react-icons/lu';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: string;
  url: string;
  file: File;
  onRemove: (id: string) => void;
}

function SortableItem({ id, url, file, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  // These inline styles are required for dnd-kit's dynamic positioning
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      {...{ style }}
      className={cn(
        "relative group w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700",
        isDragging ? "opacity-50 z-10" : "opacity-100 z-1"
      )}
    >
      <img src={url} alt={file.name} className="object-cover w-full h-full" />

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
        <div
          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white cursor-grab active:cursor-grabbing transition-colors"
          {...attributes}
          {...listeners}
        >
          <LuGripVertical className="h-3.5 w-3.5" />
        </div>
        <button
          type="button"
          className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          onClick={() => onRemove(id)}
          title={useLanguage().t('batchUpload.remove')}
        >
          <LuTrash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export interface BatchImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
  showHeader?: boolean;
  className?: string;
}

export function BatchImageUpload({
  onImagesChange,
  maxFiles = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSizeMB = 5,
  showHeader = true,
  className
}: BatchImageUploadProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [images, setImages] = useState<{ id: string; file: File; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    setIsUploading(true);

    const filesToAdd: { id: string; file: File; url: string }[] = [];
    Array.from(files).forEach(file => {
      if (images.length + filesToAdd.length >= maxFiles) return;
      if (!acceptedFileTypes.includes(file.type)) return;
      if (file.size > maxFileSizeMB * 1024 * 1024) return;

      const id = Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);
      filesToAdd.push({ id, file, url });
    });

    if (filesToAdd.length > 0) {
      const newImages = [...images, ...filesToAdd];
      setImages(newImages);
      onImagesChange(newImages.map(img => img.file));
    }
    setIsUploading(false);
  }, [images, maxFiles, acceptedFileTypes, maxFileSizeMB, onImagesChange]);

  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) URL.revokeObjectURL(imageToRemove.url);
    const newImages = images.filter(img => img.id !== id);
    setImages(newImages);
    onImagesChange(newImages.map(img => img.file));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        onImagesChange(reordered.map(img => img.file));
        return reordered;
      });
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        type="file"
        accept={acceptedFileTypes.join(',')}
        multiple
        onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
        className="hidden"
        ref={fileInputRef}
        disabled={isUploading || images.length >= maxFiles}
        title={t('batchUpload.selectFiles')}
      />

      <div className="flex flex-wrap gap-3 items-center">
        {/* Sortable Previews */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map(img => img.id)} strategy={horizontalListSortingStrategy}>
            {images.map((image) => (
              <SortableItem
                key={image.id}
                id={image.id}
                url={image.url}
                file={image.file}
                onRemove={handleRemoveImage}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Compact Upload Trigger */}
        {images.length < maxFiles && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "w-20 h-20 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all",
              "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 group",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              <LuLoader className="h-5 w-5 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors mb-1.5 shadow-sm">
                  <LuPlus className="h-4 w-4 text-zinc-300" />
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                  {t('batchUpload.add')}
                </span>
              </>
            )}
          </button>
        )}

        {/* Empty State / Hint if no images */}
        {images.length === 0 && !isUploading && (
          <div className="flex flex-col gap-0.5 ml-1">
            <span className="text-[11px] font-bold text-zinc-200">{t('batchUpload.add_images')}</span>
            <span className="text-[10px] text-zinc-500 font-medium">
              {t('batchUpload.max_files', { count: maxFiles })} · {t('batchUpload.max_size', { size: maxFileSizeMB })}MB
            </span>
          </div>
        )}
      </div>
    </div>
  );
}