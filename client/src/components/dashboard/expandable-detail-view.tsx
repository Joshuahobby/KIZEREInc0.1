import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExpandableDetailViewProps {
  title: string;
  id: string;
  children: React.ReactNode;
  sections?: Array<{
    id: string;
    title: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }>;
  relatedItems?: Array<{
    id: string;
    title: string;
    onClick: () => void;
  }>;
  onClose: () => void;
  className?: string;
}

export function ExpandableDetailView({
  title,
  id,
  children,
  sections = [],
  relatedItems = [],
  onClose,
  className
}: ExpandableDetailViewProps) {
  const [activeSection, setActiveSection] = useState(sections.length > 0 ? sections[0].id : "");
  const [showRelated, setShowRelated] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed inset-0 z-50 flex flex-col p-4 md:p-8 bg-gray-900 shadow-2xl",
        className
      )}
    >
      <div className="flex justify-between items-center pb-4 border-b border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sections navigation */}
        {sections.length > 0 && (
          <motion.div
            className="hidden md:flex flex-col w-64 border-r border-gray-800 pt-4 pb-2 overflow-y-auto"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="px-4 text-sm font-medium text-gray-400 uppercase mb-2">Sections</h3>
            <nav className="space-y-1">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-4 py-2 text-left rounded-none",
                    activeSection === section.id
                      ? "bg-gray-800 text-white border-l-2 border-[#00BFFF]"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className="flex items-center">
                    {section.icon && <span className="mr-3">{section.icon}</span>}
                    <span>{section.title}</span>
                  </div>
                </Button>
              ))}
            </nav>
            
            {relatedItems.length > 0 && (
              <div className="mt-8">
                <Button
                  variant="ghost"
                  className="w-full justify-between px-4 py-2 text-left text-gray-400 hover:text-white"
                  onClick={() => setShowRelated(!showRelated)}
                >
                  <span className="font-medium">Related Items</span>
                  {showRelated ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                <AnimatePresence>
                  {showRelated && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 py-2 space-y-1">
                        {relatedItems.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
                            onClick={item.onClick}
                          >
                            <ChevronRight className="h-3 w-3 mr-2" />
                            <span className="truncate">{item.title}</span>
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* Mobile tabs navigation (visible only on small screens) */}
        {sections.length > 0 && (
          <div className="md:hidden w-full pt-4">
            <Tabs defaultValue={sections[0].id} onValueChange={setActiveSection} className="w-full">
              <TabsList className="w-full justify-start bg-gray-800 mb-4 overflow-x-auto">
                {sections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className={activeSection === section.id ? "data-[state=active]:bg-[#00BFFF]" : ""}
                  >
                    {section.icon && <span className="mr-2">{section.icon}</span>}
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {/* Mobile content */}
              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="mt-0">
                  <ScrollArea className="h-[calc(100vh-180px)]">
                    <div className="p-4">{section.content}</div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Main content area */}
        <motion.div
          className="flex-1 overflow-auto p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {sections.length > 0 ? (
            <div className="hidden md:block h-full">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={cn(
                    "h-full",
                    activeSection === section.id ? "block" : "hidden"
                  )}
                >
                  <ScrollArea className="h-full">
                    {section.content}
                  </ScrollArea>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-full">
              {children}
            </ScrollArea>
          )}
        </motion.div>

        {/* Related items sidebar (visible only on larger screens) */}
        {relatedItems.length > 0 && (
          <motion.div
            className="hidden lg:flex flex-col w-64 border-l border-gray-800 pt-4 overflow-y-auto"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="px-4 text-sm font-medium text-gray-400 uppercase mb-2">Related Items</h3>
            <nav className="space-y-1 px-2">
              {relatedItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={item.onClick}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span className="truncate">{item.title}</span>
                </Button>
              ))}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}