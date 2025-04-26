import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  GripHorizontal, 
  Maximize2, 
  Minimize2, 
  MoreHorizontal, 
  Pin, 
  Star, 
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DraggableCardProps {
  id: string;
  title: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  onRemove?: () => void;
  onToggleFavorite?: (isFavorite: boolean) => void;
  onResize?: (size: 'small' | 'medium' | 'large') => void;
  isFavorite?: boolean;
  className?: string;
  quickActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
}

export function DraggableCard({
  id,
  title,
  description,
  size = 'medium',
  children,
  icon,
  headerActions,
  onRemove,
  onToggleFavorite,
  onResize,
  isFavorite = false,
  className,
  quickActions
}: DraggableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  
  // Set up sortable context for dragging
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const handleToggleFavorite = () => {
    const newState = !localFavorite;
    setLocalFavorite(newState);
    onToggleFavorite?.(newState);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Determine card width based on size
  const sizeClasses = {
    small: "col-span-1",
    medium: "col-span-2",
    large: "col-span-4"
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        sizeClasses[size], 
        "transition-all duration-200",
        isExpanded && "fixed inset-4 z-50 col-span-4",
        className
      )}
    >
      <Card className={cn(
        "shadow-md hover:shadow-lg transition-shadow h-full overflow-hidden", 
        isDragging && "opacity-70",
        isExpanded && "flex flex-col"
      )}>
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 gap-4 bg-gray-800 border-b border-gray-700 cursor-move group">
          <div {...attributes} {...listeners} className="flex items-center gap-2 flex-1">
            {icon && <div className="text-[#00BFFF]">{icon}</div>}
            <div className="flex-1">
              <CardTitle className="text-base text-white flex items-center gap-2">
                {title}
                {localFavorite && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
              </CardTitle>
              {description && (
                <CardDescription className="text-xs text-gray-400">
                  {description}
                </CardDescription>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500">
              <GripHorizontal className="h-4 w-4" />
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {headerActions}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={handleToggleFavorite}
            >
              <Star className={cn(
                "h-4 w-4",
                localFavorite && "text-yellow-400 fill-yellow-400"
              )} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-300 w-56">
                <DropdownMenuLabel>Card Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                
                <DropdownMenuItem 
                  onClick={handleExpand}
                  className="flex items-center cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 className="mr-2 h-4 w-4" />
                      <span>Collapse card</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="mr-2 h-4 w-4" />
                      <span>Expand card</span>
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-700" />
                
                <DropdownMenuItem 
                  onClick={() => onResize?.('small')}
                  className="flex items-center cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
                >
                  <div className="mr-2 bg-gray-700 h-4 w-4 rounded"></div>
                  <span>Small card</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => onResize?.('medium')}
                  className="flex items-center cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
                >
                  <div className="mr-2 bg-gray-700 h-4 w-8 rounded"></div>
                  <span>Medium card</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => onResize?.('large')}
                  className="flex items-center cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
                >
                  <div className="mr-2 bg-gray-700 h-4 w-12 rounded"></div>
                  <span>Large card</span>
                </DropdownMenuItem>
                
                {onRemove && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem 
                      onClick={onRemove}
                      className="text-red-400 hover:text-red-300 flex items-center cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <X className="mr-2 h-4 w-4" />
                      <span>Remove from dashboard</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={handleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className={cn(
          "p-3",
          isExpanded ? "flex-1 overflow-auto" : "overflow-hidden"
        )}>
          {children}
          
          {quickActions && quickActions.length > 0 && (
            <div className="absolute bottom-3 right-3 flex gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.onClick}
                  className="h-8 bg-gray-700/50 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  {action.icon}
                  <span className="ml-1 text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 -z-10" 
          onClick={handleExpand}
        />
      )}
    </div>
  );
}