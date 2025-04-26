import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { ChevronDown, ChevronUp, Maximize, Minimize, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkspacePanel {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
}

interface WorkspaceProps {
  panels: WorkspacePanel[];
}

export function Workspace({ panels }: WorkspaceProps) {
  const [panelSizes, setPanelSizes] = useState<Record<string, number>>({});
  const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>({});
  const [resizingPanel, setResizingPanel] = useState<string | null>(null);
  const [startY, setStartY] = useState(0);
  const [startSizes, setStartSizes] = useState<Record<string, number>>({});
  
  const workspaceRef = useRef<HTMLDivElement>(null);
  
  // Initialize panel sizes on mount
  useEffect(() => {
    const initialSizes: Record<string, number> = {};
    const initialCollapsed: Record<string, boolean> = {};
    
    panels.forEach(panel => {
      initialSizes[panel.id] = panel.defaultSize;
      initialCollapsed[panel.id] = false;
    });
    
    setPanelSizes(initialSizes);
    setCollapsedPanels(initialCollapsed);
  }, [panels]);
  
  // Handle mouse move for resizing
  useEffect(() => {
    if (!resizingPanel) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return;
      
      const workspaceHeight = workspaceRef.current.offsetHeight;
      const deltaY = e.clientY - startY;
      const deltaPercent = (deltaY / workspaceHeight) * 100;
      
      // Find the index of the panel being resized
      const panelIndex = panels.findIndex(p => p.id === resizingPanel);
      if (panelIndex === -1 || panelIndex === panels.length - 1) return;
      
      // Get the current and next panels
      const currentPanel = panels[panelIndex];
      const nextPanel = panels[panelIndex + 1];
      
      // Calculate new sizes
      let newCurrentSize = startSizes[currentPanel.id] + deltaPercent;
      let newNextSize = startSizes[nextPanel.id] - deltaPercent;
      
      // Apply min/max constraints
      if (currentPanel.minSize !== undefined && newCurrentSize < currentPanel.minSize) {
        newCurrentSize = currentPanel.minSize;
        newNextSize = startSizes[currentPanel.id] + startSizes[nextPanel.id] - currentPanel.minSize;
      }
      
      if (currentPanel.maxSize !== undefined && newCurrentSize > currentPanel.maxSize) {
        newCurrentSize = currentPanel.maxSize;
        newNextSize = startSizes[currentPanel.id] + startSizes[nextPanel.id] - currentPanel.maxSize;
      }
      
      if (nextPanel.minSize !== undefined && newNextSize < nextPanel.minSize) {
        newNextSize = nextPanel.minSize;
        newCurrentSize = startSizes[currentPanel.id] + startSizes[nextPanel.id] - nextPanel.minSize;
      }
      
      if (nextPanel.maxSize !== undefined && newNextSize > nextPanel.maxSize) {
        newNextSize = nextPanel.maxSize;
        newCurrentSize = startSizes[currentPanel.id] + startSizes[nextPanel.id] - nextPanel.maxSize;
      }
      
      // Update panel sizes
      setPanelSizes(prev => ({
        ...prev,
        [currentPanel.id]: newCurrentSize,
        [nextPanel.id]: newNextSize
      }));
    };
    
    const handleMouseUp = () => {
      setResizingPanel(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingPanel, startY, startSizes, panels]);
  
  // Start resizing a panel
  const startResizing = (panelId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingPanel(panelId);
    setStartY(e.clientY);
    setStartSizes({ ...panelSizes });
  };
  
  // Toggle panel collapsed state
  const toggleCollapsePanel = (panelId: string) => {
    setCollapsedPanels(prev => {
      const isCurrentlyCollapsed = prev[panelId];
      
      // If we're expanding a previously collapsed panel,
      // we need to restore its size
      if (isCurrentlyCollapsed) {
        const panel = panels.find(p => p.id === panelId);
        if (panel) {
          setPanelSizes(prev => ({
            ...prev,
            [panelId]: panel.defaultSize
          }));
        }
      }
      
      return {
        ...prev,
        [panelId]: !isCurrentlyCollapsed
      };
    });
  };
  
  // Calculate what percentage of the workspace each visible panel should occupy
  const calculatePanelPercentages = () => {
    const visiblePanels = panels.filter(panel => !collapsedPanels[panel.id]);
    const totalSize = visiblePanels.reduce((sum, panel) => sum + (panelSizes[panel.id] || panel.defaultSize), 0);
    
    let remainingPercent = 100;
    const percentages: Record<string, number> = {};
    
    panels.forEach(panel => {
      if (collapsedPanels[panel.id]) {
        percentages[panel.id] = 0;
      } else {
        const panelSize = panelSizes[panel.id] || panel.defaultSize;
        const percent = (panelSize / totalSize) * 100;
        percentages[panel.id] = percent;
        remainingPercent -= percent;
      }
    });
    
    return percentages;
  };
  
  const panelPercentages = calculatePanelPercentages();
  
  return (
    <div ref={workspaceRef} className="flex flex-col h-full overflow-hidden">
      {panels.map((panel, index) => {
        const isCollapsed = collapsedPanels[panel.id];
        const panelHeight = isCollapsed ? 'auto' : `${panelPercentages[panel.id]}%`;
        const isLastPanel = index === panels.length - 1;
        
        return (
          <React.Fragment key={panel.id}>
            <div 
              className={cn(
                "flex flex-col bg-gray-900 border border-gray-800 rounded-md overflow-hidden transition-all duration-200",
                isCollapsed ? "max-h-10" : ""
              )}
              style={{ height: panelHeight }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center">
                  {panel.icon && <div className="mr-2 text-[#00BFFF]">{panel.icon}</div>}
                  <h3 className="text-sm font-medium text-white">{panel.title}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  {panel.collapsible && (
                    <button
                      onClick={() => toggleCollapsePanel(panel.id)}
                      className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
                    >
                      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Panel Content */}
              <div className={cn(
                "flex-1 overflow-auto p-4 bg-gray-900",
                isCollapsed && "hidden"
              )}>
                {panel.content}
              </div>
            </div>
            
            {/* Resizer (not for the last panel) */}
            {!isLastPanel && !isCollapsed && (
              <div
                className={cn(
                  "h-2 cursor-row-resize bg-transparent hover:bg-[#00BFFF]/20 flex items-center justify-center",
                  resizingPanel === panel.id && "bg-[#00BFFF]/30"
                )}
                onMouseDown={(e) => startResizing(panel.id, e)}
              >
                <div className="w-8 h-1 rounded-full bg-gray-700"></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}