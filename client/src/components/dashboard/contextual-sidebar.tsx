import React from 'react';
import { X, User, Package, FileText, CreditCard, AlertTriangle, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContextualSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  data: any;
  type: string;
}

export function ContextualSidebar({
  isOpen,
  onClose,
  title,
  icon,
  data,
  type
}: ContextualSidebarProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderUserDetails = () => {
    if (!data.actor) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center text-[#00BFFF] mr-4">
            {data.actor.avatar ? (
              <img
                src={data.actor.avatar}
                alt={data.actor.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold">
                {data.actor.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">{data.actor.name}</h3>
            {data.actor.role && (
              <p className="text-sm text-gray-400">{data.actor.role}</p>
            )}
          </div>
        </div>

        {data.metadata && (
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(data.metadata).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div className="flex items-center">
                  <span className="text-sm text-white mr-2">{value as string}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                        onClick={() => copyToClipboard(value as string)}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.actions && data.actions.length > 0 && (
          <div className="flex mt-4 space-x-2">
            {data.actions.map((action: any, i: number) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={action.onClick}
              >
                {action.icon && <span className="mr-1">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderItemDetails = () => {
    if (!data.metadata) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-12 w-12 rounded-md bg-gray-800 flex items-center justify-center text-[#00BFFF]">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">{data.metadata.itemType || 'Item'}</h3>
            <p className="text-sm text-gray-400">{data.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 mt-4">
          {Object.entries(data.metadata).map(([key, value]) => (
            <div key={key} className="flex items-start justify-between bg-gray-800 p-2 rounded">
              <span className="text-sm text-gray-400">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <div className="flex items-center">
                <span className="text-sm text-white mr-2">{value as string}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => copyToClipboard(value as string)}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        {data.actions && data.actions.length > 0 && (
          <div className="flex mt-4 space-x-2">
            {data.actions.map((action: any, i: number) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={action.onClick}
              >
                {action.icon && <span className="mr-1">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPaymentDetails = () => {
    if (!data.metadata) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-12 w-12 rounded-md bg-gray-800 flex items-center justify-center text-[#00BFFF]">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">
              {data.metadata.amount ? `Payment: ${data.metadata.amount}` : 'Payment'}
            </h3>
            <p className="text-sm text-gray-400">{data.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 mt-4">
          {Object.entries(data.metadata).map(([key, value]) => (
            <div key={key} className="flex items-start justify-between bg-gray-800 p-2 rounded">
              <span className="text-sm text-gray-400">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <div className="flex items-center">
                <span className="text-sm text-white mr-2">{value as string}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => copyToClipboard(value as string)}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        {data.actions && data.actions.length > 0 && (
          <div className="flex mt-4 space-x-2">
            {data.actions.map((action: any, i: number) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={action.onClick}
              >
                {action.icon && <span className="mr-1">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderReportDetails = () => {
    if (!data.metadata) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-12 w-12 rounded-md bg-gray-800 flex items-center justify-center text-[#00BFFF]">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">
              {data.title || 'Report'}
            </h3>
            <p className="text-sm text-gray-400">{data.description}</p>
          </div>
        </div>

        {data.actor && (
          <div className="flex items-center mt-4">
            <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-[#00BFFF] mr-2">
              {data.actor.avatar ? (
                <img
                  src={data.actor.avatar}
                  alt={data.actor.name}
                  className="h-full w-full rounded-full object-cover"
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-sm font-bold">
                  {data.actor.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-white">{data.actor.name}</p>
              {data.actor.role && (
                <p className="text-xs text-gray-400">{data.actor.role}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 mt-4">
          {Object.entries(data.metadata).map(([key, value]) => (
            <div key={key} className="flex items-start justify-between bg-gray-800 p-2 rounded">
              <span className="text-sm text-gray-400">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <div className="flex items-center">
                <span className="text-sm text-white mr-2">{value as string}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => copyToClipboard(value as string)}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        {data.actions && data.actions.length > 0 && (
          <div className="flex mt-4 space-x-2">
            {data.actions.map((action: any, i: number) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={action.onClick}
              >
                {action.icon && <span className="mr-1">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGenericDetails = () => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-12 w-12 rounded-md bg-gray-800 flex items-center justify-center text-[#00BFFF]">
            {icon || <AlertTriangle className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <p className="text-sm text-gray-400">{data.description}</p>
          </div>
        </div>

        {data.metadata && (
          <div className="grid grid-cols-1 gap-2 mt-4">
            {Object.entries(data.metadata).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between bg-gray-800 p-2 rounded">
                <span className="text-sm text-gray-400">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div className="flex items-center">
                  <span className="text-sm text-white mr-2">{value as string}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                        onClick={() => copyToClipboard(value as string)}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (!data) return null;

    switch (type) {
      case 'user':
        return renderUserDetails();
      case 'item':
        return renderItemDetails();
      case 'payment':
        return renderPaymentDetails();
      case 'report':
        return renderReportDetails();
      default:
        return renderGenericDetails();
    }
  };

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 bg-gray-900 border-l border-gray-800 w-80 transform transition-transform duration-200 ease-in-out z-40",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <TooltipProvider>
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-800">
          <div className="flex items-center">
            {icon && <span className="mr-2 text-[#00BFFF]">{icon}</span>}
            <h2 className="text-lg font-medium text-white">{title}</h2>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="h-[calc(100vh-3.5rem)] p-4">
          {renderContent()}
        </ScrollArea>
      </TooltipProvider>
    </div>
  );
}