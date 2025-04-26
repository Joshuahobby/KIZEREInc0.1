import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, MoreHorizontal, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContextualSidebarProps {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  width?: number;
  children?: React.ReactNode;
  tabs?: Array<{
    id: string;
    title: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }>;
  actions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive" | "subtle";
  }>;
  footer?: React.ReactNode;
  position?: "left" | "right";
  isPinned?: boolean;
  onTogglePin?: (pinned: boolean) => void;
  className?: string;
}

export function ContextualSidebar({
  title,
  icon,
  open,
  onClose,
  width = 400,
  children,
  tabs,
  actions,
  footer,
  position = "right",
  isPinned = false,
  onTogglePin,
  className,
}: ContextualSidebarProps) {
  const [activeTab, setActiveTab] = useState(tabs && tabs.length > 0 ? tabs[0].id : "");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className={cn(
              "fixed top-0 bottom-0 bg-gray-800 border-gray-700 shadow-xl z-50 flex flex-col",
              position === "left" ? "left-0 border-r" : "right-0 border-l",
              className
            )}
            style={{ width }}
            initial={{ x: position === "left" ? -width : width }}
            animate={{ x: 0 }}
            exit={{ x: position === "left" ? -width : width }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                {icon && <div className="text-[#00BFFF]">{icon}</div>}
                <h2 className="font-medium text-white truncate">{title}</h2>
              </div>
              
              <div className="flex items-center gap-1">
                {onTogglePin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700",
                      isPinned && "text-[#00BFFF]"
                    )}
                    onClick={() => onTogglePin(!isPinned)}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                )}
                
                {actions && actions.length > 0 && (
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
                    <DropdownMenuContent
                      align={position === "left" ? "end" : "start"}
                      className="bg-gray-800 border-gray-700 text-gray-300"
                    >
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      {actions.map((action, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={action.onClick}
                          className={cn(
                            "flex items-center cursor-pointer hover:bg-gray-700 focus:bg-gray-700",
                            action.variant === "destructive" && "text-red-400 hover:text-red-300",
                            action.variant === "subtle" && "text-gray-400 hover:text-gray-300"
                          )}
                        >
                          {action.icon && <span className="mr-2">{action.icon}</span>}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={onClose}
                  aria-label="Close panel"
                >
                  {position === "left" ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {tabs && tabs.length > 0 ? (
                <Tabs
                  defaultValue={tabs[0].id}
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full h-full flex flex-col"
                >
                  <TabsList className="p-1 mx-4 mt-4 bg-gray-900 justify-start overflow-x-auto">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={cn(
                          "flex items-center gap-1.5 data-[state=active]:text-white data-[state=active]:bg-[#00BFFF]", 
                          "data-[state=inactive]:text-gray-400 data-[state=inactive]:bg-transparent"
                        )}
                      >
                        {tab.icon && <span>{tab.icon}</span>}
                        {tab.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {tabs.map((tab) => (
                    <TabsContent
                      key={tab.id}
                      value={tab.id}
                      className="flex-1 m-0 data-[state=active]:flex flex-col overflow-hidden"
                    >
                      <ScrollArea className="flex-1 p-4">
                        {tab.content}
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <ScrollArea className="h-full p-4">
                  {children}
                </ScrollArea>
              )}
            </div>

            {/* Footer */}
            {footer && (
              <>
                <Separator className="bg-gray-700" />
                <div className="p-4">{footer}</div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}