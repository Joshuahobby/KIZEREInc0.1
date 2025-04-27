import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
  label: string;
  key: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
};

export type DataTablePagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type DataTableAction<T> = {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
};

interface DataTableDashboardProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: DataTableColumn<T>[];
  keyField: string;
  pagination?: DataTablePagination;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  actions?: DataTableAction<T>[];
  onExport?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function DataTableDashboard<T>({
  title,
  description,
  data,
  columns,
  keyField,
  pagination,
  onPageChange,
  onSearch,
  onSort,
  actions,
  onExport,
  isLoading = false,
  className,
}: DataTableDashboardProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort(key, newDirection);
  };

  return (
    <Card className={cn('border border-border/50 bg-card/50 backdrop-blur-sm h-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <form onSubmit={handleSearch} className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs w-[160px] md:w-[200px]"
              />
            </form>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onExport}
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4 animate-pulse">
            <div className="h-8 bg-muted-foreground/20 rounded w-full"></div>
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-12 bg-muted-foreground/10 rounded w-full"></div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <ScrollArea className="rounded-md border m-1 mb-2 max-h-[400px] overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead 
                      key={column.key}
                      className={cn(
                        "text-xs font-medium text-muted-foreground h-9",
                        column.sortable && "cursor-pointer select-none"
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.sortable && sortKey === column.key && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableHead className="w-[40px]"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: any) => (
                  <TableRow key={item[keyField]}>
                    {columns.map((column) => (
                      <TableCell key={`${item[keyField]}-${column.key}`} className="py-2 text-xs">
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </TableCell>
                    ))}
                    {actions && actions.length > 0 && (
                      <TableCell className="p-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, i) => (
                              <DropdownMenuItem
                                key={i}
                                onClick={() => action.onClick(item)}
                                className="text-xs cursor-pointer"
                              >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {pagination && (
          <div className="flex items-center justify-between border-t border-border/40 px-4 py-2">
            <div className="text-xs text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
              {pagination.totalItems} items
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-medium mx-2">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to render status badges
export function renderStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'successful':
    case 'completed':
    case 'resolved':
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    case 'pending':
    case 'in progress':
    case 'processing':
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          {status}
        </Badge>
      );
    case 'failed':
    case 'rejected':
    case 'cancelled':
    case 'error':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          {status}
        </Badge>
      );
  }
}