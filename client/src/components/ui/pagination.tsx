import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  // Helper function to create a range array
  const range = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  };

  // Calculate page numbers to show
  const generatePaginationItems = (): (number | "dots")[] => {
    // If there are 7 or fewer pages, show all
    if (totalPages <= 7) {
      return range(1, totalPages);
    }

    // Always show first page
    const firstPageIndex = 1;
    // Always show last page
    const lastPageIndex = totalPages;

    // Show dots only if there are more than 2*siblingCount + 5 pages
    const shouldShowLeftDots = currentPage > 2 + siblingCount;
    const shouldShowRightDots = currentPage < totalPages - (2 + siblingCount);

    // Basic case: show dots on both sides
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(
        Math.max(2, currentPage - siblingCount),
        Math.min(totalPages - 1, currentPage + siblingCount)
      );
      return [firstPageIndex, "dots", ...middleRange, "dots", lastPageIndex];
    }

    // Case: no left dots, but right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftRange = range(1, 3 + 2 * siblingCount);
      return [...leftRange, "dots", lastPageIndex];
    }

    // Case: no right dots, but left dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightRange = range(totalPages - (3 + 2 * siblingCount) + 1, totalPages);
      return [firstPageIndex, "dots", ...rightRange];
    }

    // Fallback: show first and last page
    return [firstPageIndex, "dots", lastPageIndex];
  };

  const paginationItems = generatePaginationItems();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {paginationItems.map((item, index) => {
        if (item === "dots") {
          return (
            <Button
              key={`dots-${index}`}
              variant="ghost"
              size="icon"
              disabled
              aria-hidden="true"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
        
        return (
          <Button
            key={item}
            variant={currentPage === item ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={currentPage === item ? "page" : undefined}
          >
            {item}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}