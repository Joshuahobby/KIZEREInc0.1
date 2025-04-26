import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextualSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  data: any;
  type: string;
  className?: string;
  position?: 'left' | 'right';
}

export function ContextualSidebar({
  isOpen,
  onClose,
  title,
  icon,
  data,
  type,
  className,
  position = 'right'
}: ContextualSidebarProps) {
  // Determine content based on context type
  const renderContent = () => {
    switch (type) {
      case 'user':
        return renderUserContent();
      case 'item':
        return renderItemContent();
      case 'report':
        return renderReportContent();
      case 'payment':
        return renderPaymentContent();
      case 'system':
        return renderSystemContent();
      default:
        return (
          <div className="p-4">
            <p className="text-gray-400">No details available</p>
          </div>
        );
    }
  };

  // Render user context content
  const renderUserContent = () => {
    return (
      <div className="space-y-4">
        {/* User profile */}
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-md">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-[#00BFFF] mb-3">
            {data.actor?.avatar ? (
              <img 
                src={data.actor.avatar} 
                alt={data.actor.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">
                {data.actor?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="text-lg font-medium text-white">{data.actor?.name}</h3>
          <p className="text-sm text-gray-400">{data.actor?.role}</p>
        </div>
        
        {/* Contact information */}
        {data.metadata && (
          <div className="p-4 bg-gray-800 rounded-md">
            <h4 className="text-sm font-medium text-white mb-3">Contact Information</h4>
            <div className="space-y-2">
              {data.metadata.email && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Email</span>
                  <span className="text-sm text-white">{data.metadata.email}</span>
                </div>
              )}
              {data.metadata.phoneNumber && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Phone</span>
                  <span className="text-sm text-white">{data.metadata.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="p-4 bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-white mb-3">Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              View Profile
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              Edit User
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              Send Message
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-red-500 hover:text-red-600">
              Disable Account
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render item context content
  const renderItemContent = () => {
    return (
      <div className="space-y-4">
        {/* Item details */}
        <div className="p-4 bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-white mb-3">Item Details</h4>
          {data.metadata && (
            <div className="space-y-2">
              {data.metadata.itemType && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Type</span>
                  <span className="text-sm text-white">{data.metadata.itemType}</span>
                </div>
              )}
              {data.metadata.serialNumber && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Serial Number</span>
                  <span className="text-sm text-white">{data.metadata.serialNumber}</span>
                </div>
              )}
              {data.metadata.value && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Value</span>
                  <span className="text-sm text-white">{data.metadata.value}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Registered by */}
        {data.actor && (
          <div className="p-4 bg-gray-800 rounded-md">
            <h4 className="text-sm font-medium text-white mb-3">Registered By</h4>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-[#00BFFF] mr-3">
                <span className="text-sm font-bold">
                  {data.actor.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-white">{data.actor.name}</p>
                <p className="text-xs text-gray-400">{data.actor.role}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="p-4 bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-white mb-3">Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              View Details
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              Edit Item
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              View Owner
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-red-500 hover:text-red-600">
              Mark as Lost
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render report context content
  const renderReportContent = () => {
    return (
      <div className="space-y-4">
        {/* Report details */}
        <div className="p-4 bg-gray-800 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">Report Details</h4>
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
              Pending
            </span>
          </div>
          
          {data.metadata && (
            <div className="space-y-2">
              {data.metadata.itemType && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Item</span>
                  <span className="text-sm text-white">{data.metadata.itemType}</span>
                </div>
              )}
              {data.metadata.brand && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Brand</span>
                  <span className="text-sm text-white">{data.metadata.brand}</span>
                </div>
              )}
              {data.metadata.lastSeen && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Last Seen</span>
                  <span className="text-sm text-white">{data.metadata.lastSeen}</span>
                </div>
              )}
              {data.metadata.reward && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Reward</span>
                  <span className="text-sm text-white">{data.metadata.reward}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Reported by */}
        {data.actor && (
          <div className="p-4 bg-gray-800 rounded-md">
            <h4 className="text-sm font-medium text-white mb-3">Reported By</h4>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-[#00BFFF] mr-3">
                <span className="text-sm font-bold">
                  {data.actor.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-white">{data.actor.name}</p>
                <p className="text-xs text-gray-400">{data.actor.role}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="p-4 bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-white mb-3">Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              Process Report
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              Contact User
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              Match Found Items
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-red-500 hover:text-red-600">
              Mark as Resolved
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render payment context content
  const renderPaymentContent = () => {
    return (
      <div className="space-y-4">
        {/* Payment details */}
        <div className="p-4 bg-gray-800 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">Payment Details</h4>
            <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300">
              Successful
            </span>
          </div>
          
          {data.metadata && (
            <div className="space-y-2">
              {data.metadata.paymentMethod && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Method</span>
                  <span className="text-sm text-white">{data.metadata.paymentMethod}</span>
                </div>
              )}
              {data.metadata.transactionId && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Transaction ID</span>
                  <span className="text-sm text-white">{data.metadata.transactionId}</span>
                </div>
              )}
              {data.metadata.category && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-sm text-white">{data.metadata.category}</span>
                </div>
              )}
              {data.description && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Description</span>
                  <span className="text-sm text-white">{data.description}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Paid by */}
        {data.actor && (
          <div className="p-4 bg-gray-800 rounded-md">
            <h4 className="text-sm font-medium text-white mb-3">Paid By</h4>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-[#00BFFF] mr-3">
                <span className="text-sm font-bold">
                  {data.actor.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-white">{data.actor.name}</p>
                <p className="text-xs text-gray-400">{data.actor.role}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="p-4 bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-white mb-3">Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              View Receipt
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              Email Receipt
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              View Customer
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-red-500 hover:text-red-600">
              Refund Payment
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render system context content
  const renderSystemContent = () => {
    return (
      <div className="space-y-4">
        {/* System event details */}
        <div className="p-4 bg-gray-800 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">Event Details</h4>
            <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300">
              Success
            </span>
          </div>
          
          {data.metadata && (
            <div className="space-y-2">
              {data.metadata.backupSize && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Backup Size</span>
                  <span className="text-sm text-white">{data.metadata.backupSize}</span>
                </div>
              )}
              {data.metadata.duration && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Duration</span>
                  <span className="text-sm text-white">{data.metadata.duration}</span>
                </div>
              )}
              {data.metadata.location && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Storage Location</span>
                  <span className="text-sm text-white">{data.metadata.location}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Event timing */}
        <div className="p-4 bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-white mb-3">Timing</h4>
          <div className="space-y-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Date</span>
              <span className="text-sm text-white">{data.date}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Time</span>
              <span className="text-sm text-white">{data.time}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-white mb-3">Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              View Logs
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              Download Backup
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              View Schedule
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              System Config
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 w-80 bg-gray-900 z-30 border-l border-gray-800 transform transition-transform duration-300 ease-in-out overflow-hidden",
        position === 'left' ? 'left-0 border-r border-l-0' : 'right-0',
        isOpen
          ? 'translate-x-0'
          : position === 'left'
          ? '-translate-x-full'
          : 'translate-x-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          {icon && <div className="mr-2 text-[#00BFFF]">{icon}</div>}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
        {renderContent()}
      </div>
    </div>
  );
}