import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  CreditCard,
  Settings,
  ChevronDown,
  Send,
  Command
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface CommandBarProps {
  activeWorkspace: string;
  onWorkspaceChange: (workspace: string) => void;
  onCommand: (command: string) => void;
  onSearch: (query: string) => void;
}

export function CommandBar({ 
  activeWorkspace, 
  onWorkspaceChange, 
  onCommand, 
  onSearch
}: CommandBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isCommandMode, setIsCommandMode] = useState(false);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCommandMode && searchValue.startsWith('/')) {
      onCommand(searchValue.slice(1));
    } else {
      onSearch(searchValue);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Switch to command mode if input starts with '/'
    if (value.startsWith('/') && !isCommandMode) {
      setIsCommandMode(true);
    } 
    
    // Switch back to search mode if input no longer starts with '/'
    if (!value.startsWith('/') && isCommandMode) {
      setIsCommandMode(false);
    }
  };
  
  const workspaceOptions = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4 mr-2" /> },
    { id: 'items', label: 'Items', icon: <ClipboardList className="h-4 w-4 mr-2" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="h-4 w-4 mr-2" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4 mr-2" /> }
  ];
  
  const currentWorkspace = workspaceOptions.find(ws => ws.id === activeWorkspace);
  
  return (
    <div className="flex items-center h-14 px-4 border-b border-gray-800 bg-gray-900 text-white">
      {/* Workspace Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
            {currentWorkspace?.icon}
            <span>{currentWorkspace?.label || 'Workspace'}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {workspaceOptions.map((option) => (
            <DropdownMenuItem 
              key={option.id}
              onClick={() => onWorkspaceChange(option.id)}
              className={cn(
                "cursor-pointer",
                activeWorkspace === option.id && "bg-gray-800"
              )}
            >
              {option.icon}
              <span>{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Search/Command Bar */}
      <div className="flex-1 mx-4">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {isCommandMode ? (
              <Command className="h-4 w-4 text-gray-400" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            placeholder={isCommandMode ? "Type a command..." : "Search..."}
            className={cn(
              "block w-full py-2 pl-10 pr-10 bg-gray-800 border border-gray-700 rounded-md text-sm text-white",
              "placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00BFFF]",
              isCommandMode && "text-yellow-300"
            )}
          />
          {searchValue && (
            <button 
              type="button" 
              onClick={() => setSearchValue('')}
              className="absolute inset-y-0 right-12 flex items-center pr-1"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          )}
          <button 
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <Send className="h-4 w-4 text-gray-400 hover:text-[#00BFFF]" />
          </button>
        </form>
      </div>
      
      {/* User Menu (Placeholder) */}
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-[#00BFFF] font-semibold">
          A
        </div>
      </div>
    </div>
  );
}