import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SortableItemProps {
  id: string;
  preview: string;
  size: string;
  onRemove: () => void;
  displayName?: string;
}

export function SortableItem({
  id,
  preview,
  size,
  onRemove,
  displayName
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border border-border overflow-hidden",
        isDragging ? "ring-2 ring-primary" : ""
      )}
    >
      <div
        className="absolute inset-0 flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${preview})` }}
      >
        <div className="absolute inset-0 bg-black/5"></div>
      </div>
      
      <CardContent className="p-0">
        <div className="relative aspect-square w-full h-full p-0 overflow-hidden">
          <img
            src={preview}
            alt={displayName || "Image preview"}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-2 left-2 text-xs text-white font-medium">
              {displayName && (
                <div className="max-w-[140px] truncate">{displayName}</div>
              )}
              <div className="text-white/80">{size}</div>
            </div>
          </div>
          
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="destructive"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full bg-background/50 backdrop-blur-sm border-white/10"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}