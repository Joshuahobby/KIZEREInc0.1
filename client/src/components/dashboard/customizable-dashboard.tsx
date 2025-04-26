import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DraggableCard } from './draggable-card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  LayoutDashboard, 
  Save, 
  Star, 
  Clock, 
  History, 
  Settings 
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export interface CardConfig {
  id: string;
  title: string;
  type: string;
  description?: string;
  size: 'small' | 'medium' | 'large';
  isFavorite?: boolean;
  order?: number;
  icon?: React.ReactNode;
  content: React.ReactNode;
  quickActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
}

export interface DashboardConfig {
  cards: CardConfig[];
  favorites: string[];
  layout: string[];
  hidden: string[];
}

interface CustomizableDashboardProps {
  availableCards: CardConfig[];
  initialConfig?: DashboardConfig;
  onConfigChange?: (config: DashboardConfig) => void;
  onSaveLayout?: (config: DashboardConfig) => void;
}

export function CustomizableDashboard({
  availableCards,
  initialConfig,
  onConfigChange,
  onSaveLayout,
}: CustomizableDashboardProps) {
  // Dashboard state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [layout, setLayout] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [cardSizes, setCardSizes] = useState<Record<string, 'small' | 'medium' | 'large'>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize dashboard from config or defaults
  useEffect(() => {
    if (initialConfig) {
      setLayout(initialConfig.layout);
      setFavorites(initialConfig.favorites || []);
      setHidden(initialConfig.hidden || []);
      
      // Initialize card sizes from config
      const sizes: Record<string, 'small' | 'medium' | 'large'> = {};
      initialConfig.cards.forEach(card => {
        sizes[card.id] = card.size;
      });
      setCardSizes(sizes);
    } else {
      // Default initialization
      const defaultLayout = availableCards.map(card => card.id);
      setLayout(defaultLayout);
      
      // Set default sizes
      const sizes: Record<string, 'small' | 'medium' | 'large'> = {};
      availableCards.forEach(card => {
        sizes[card.id] = card.size || 'medium';
      });
      setCardSizes(sizes);
    }
  }, [initialConfig, availableCards]);

  // Track recently viewed cards
  const trackRecentView = useCallback((cardId: string) => {
    setRecentlyViewed(prev => {
      const withoutCurrent = prev.filter(id => id !== cardId);
      return [cardId, ...withoutCurrent].slice(0, 5); // Keep only the 5 most recent
    });
  }, []);

  // Handle card drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
  }, []);

  // Handle card drag end and reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Notify of changes
        if (onConfigChange) {
          const newConfig: DashboardConfig = {
            cards: [], // This will be populated by the parent component
            layout: newItems,
            favorites,
            hidden
          };
          onConfigChange(newConfig);
        }
        
        return newItems;
      });
    }
  }, [favorites, hidden, onConfigChange]);

  // Toggle a card as favorite
  const toggleFavorite = useCallback((cardId: string, isFavorite: boolean) => {
    setFavorites(prev => {
      if (isFavorite) {
        return [...prev, cardId];
      } else {
        return prev.filter(id => id !== cardId);
      }
    });
  }, []);

  // Resize a card
  const resizeCard = useCallback((cardId: string, size: 'small' | 'medium' | 'large') => {
    setCardSizes(prev => ({
      ...prev,
      [cardId]: size
    }));
  }, []);

  // Remove a card from dashboard
  const removeCard = useCallback((cardId: string) => {
    setHidden(prev => [...prev, cardId]);
    
    toast({
      title: "Card removed",
      description: "The card has been removed from your dashboard.",
      action: (
        <Button 
          variant="outline" 
          onClick={() => setHidden(prev => prev.filter(id => id !== cardId))}
          className="bg-transparent border-gray-700 text-white hover:bg-gray-700 hover:text-white"
        >
          Undo
        </Button>
      ),
    });
  }, []);

  // Add a card to dashboard
  const addCard = useCallback((cardId: string) => {
    if (hidden.includes(cardId)) {
      setHidden(prev => prev.filter(id => id !== cardId));
    }
    
    if (!layout.includes(cardId)) {
      setLayout(prev => [...prev, cardId]);
    }
  }, [hidden, layout]);

  // Save dashboard layout
  const saveLayout = useCallback(() => {
    if (onSaveLayout) {
      const config: DashboardConfig = {
        cards: [], // This will be populated by the parent component
        layout,
        favorites,
        hidden
      };
      onSaveLayout(config);
      
      toast({
        title: "Dashboard saved",
        description: "Your dashboard layout has been saved.",
      });
    }
  }, [layout, favorites, hidden, onSaveLayout]);

  // Get available cards that are not hidden
  const visibleCards = availableCards.filter(card => 
    !hidden.includes(card.id) && 
    (showFavoritesOnly ? favorites.includes(card.id) : true) &&
    (showRecentlyViewed ? recentlyViewed.includes(card.id) : true)
  );

  // Card addition popover content
  const availableCardsToAdd = availableCards.filter(card => hidden.includes(card.id));

  return (
    <div className="space-y-4">
      {/* Dashboard Controls */}
      <div className="flex justify-between items-center gap-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-[#00BFFF]" />
          <h2 className="text-lg font-medium text-white">Your Dashboard</h2>
          
          <div className="flex gap-2 ml-4">
            <Badge 
              variant={showFavoritesOnly ? "default" : "outline"} 
              className={`cursor-pointer ${showFavoritesOnly ? "bg-yellow-500 hover:bg-yellow-600" : "border-gray-700 text-gray-300"}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className={`h-3 w-3 mr-1 ${showFavoritesOnly ? "fill-white" : ""}`} />
              Favorites
            </Badge>
            
            <Badge 
              variant={showRecentlyViewed ? "default" : "outline"} 
              className={`cursor-pointer ${showRecentlyViewed ? "bg-[#00BFFF] hover:bg-[#00BFFF]/90" : "border-gray-700 text-gray-300"}`}
              onClick={() => setShowRecentlyViewed(!showRecentlyViewed)}
            >
              <Clock className="h-3 w-3 mr-1" />
              Recent
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch 
              id="edit-mode" 
              checked={isEditMode} 
              onCheckedChange={setIsEditMode} 
              className="data-[state=checked]:bg-[#00BFFF]"
            />
            <Label htmlFor="edit-mode" className="text-sm text-gray-300">
              Edit Mode
            </Label>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-700/50 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Card
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-gray-800 border-gray-700 text-gray-300">
              <div className="space-y-2">
                <h3 className="font-medium text-white">Add cards to dashboard</h3>
                <p className="text-xs text-gray-400">Select cards to add to your dashboard view.</p>
                <Separator className="bg-gray-700" />
                
                {availableCardsToAdd.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">All cards are already visible on your dashboard.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto py-2">
                    {availableCardsToAdd.map(card => (
                      <div 
                        key={card.id} 
                        className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded-md cursor-pointer"
                        onClick={() => addCard(card.id)}
                      >
                        <div className="flex items-center gap-2">
                          {card.icon && <div className="text-[#00BFFF]">{card.icon}</div>}
                          <div>
                            <p className="text-sm font-medium text-white">{card.title}</p>
                            {card.description && (
                              <p className="text-xs text-gray-400">{card.description}</p>
                            )}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-[#00BFFF]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={saveLayout}
            className="bg-gray-700/50 border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save Layout
          </Button>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <SortableContext
          items={layout}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-4 gap-4 md:auto-rows-[minmax(180px,auto)]">
            {layout
              .filter(id => 
                !hidden.includes(id) && 
                (showFavoritesOnly ? favorites.includes(id) : true) &&
                (showRecentlyViewed ? recentlyViewed.includes(id) : true)
              )
              .map(id => {
                const card = availableCards.find(c => c.id === id);
                if (!card) return null;
                
                return (
                  <DraggableCard
                    key={id}
                    id={id}
                    title={card.title}
                    description={card.description}
                    size={cardSizes[id] || card.size}
                    icon={card.icon}
                    isFavorite={favorites.includes(id)}
                    onToggleFavorite={(isFavorite) => toggleFavorite(id, isFavorite)}
                    onRemove={isEditMode ? () => removeCard(id) : undefined}
                    onResize={(size) => resizeCard(id, size)}
                    quickActions={card.quickActions}
                  >
                    <div onClick={() => trackRecentView(id)}>
                      {card.content}
                    </div>
                  </DraggableCard>
                );
              })}
          </div>
        </SortableContext>
        
        {/* Drag overlay */}
        <DragOverlay modifiers={[restrictToParentElement]}>
          {activeId ? (
            (() => {
              const card = availableCards.find(c => c.id === activeId);
              if (!card) return null;
              
              return (
                <DraggableCard
                  id={activeId.toString()}
                  title={card.title}
                  description={card.description}
                  size={cardSizes[activeId.toString()] || card.size}
                  icon={card.icon}
                  isFavorite={favorites.includes(activeId.toString())}
                  className="opacity-70"
                >
                  {card.content}
                </DraggableCard>
              );
            })()
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Empty state */}
      {visibleCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
          <div className="bg-gray-800 p-4 rounded-full mb-4">
            <LayoutDashboard className="h-8 w-8 text-[#00BFFF]" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {hidden.length === availableCards.length
              ? "All dashboard cards are hidden"
              : showFavoritesOnly
                ? "No favorite cards"
                : showRecentlyViewed
                  ? "No recently viewed cards"
                  : "Your dashboard is empty"}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            {hidden.length === availableCards.length
              ? "Add them back to your dashboard to see them here."
              : showFavoritesOnly
                ? "Star your most used cards to add them to favorites."
                : showRecentlyViewed
                  ? "Cards you interact with will appear here."
                  : "Add cards to your dashboard to get started."}
          </p>
          {hidden.length > 0 && (
            <Button 
              onClick={() => setHidden([])}
              className="bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-white"
            >
              Restore All Cards
            </Button>
          )}
          {showFavoritesOnly && (
            <Button 
              onClick={() => setShowFavoritesOnly(false)}
              className="bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-white"
            >
              Show All Cards
            </Button>
          )}
          {showRecentlyViewed && (
            <Button 
              onClick={() => setShowRecentlyViewed(false)}
              className="bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-white"
            >
              Show All Cards
            </Button>
          )}
        </div>
      )}
    </div>
  );
}