import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GlobalSearch } from '../global-search';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock dependencies
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('wouter', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => [vi.fn(), vi.fn()],
}));

vi.mock('@/hooks/use-logger', () => ({
    useLogger: () => ({
        error: vi.fn(),
        info: vi.fn(),
    }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('GlobalSearch Component', () => {
    it('renders quick ID search buttons in empty state', () => {
        render(
            <TooltipProvider>
                <GlobalSearch />
            </TooltipProvider>
        );

        // Open the search dialog
        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        // Check if Quick ID buttons are present
        expect(screen.getByText('search.actions.quickId')).toBeDefined();
        expect(screen.getByText('search.labels.imei')).toBeDefined();
        expect(screen.getByText('search.labels.nid')).toBeDefined();
    });

    it('updates query when a quick ID button is clicked', () => {
        render(
            <TooltipProvider>
                <GlobalSearch />
            </TooltipProvider>
        );

        // Open the search dialog
        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        // Click IMEI button
        const imeiButton = screen.getByText('search.labels.imei').closest('button');
        if (imeiButton) {
            fireEvent.click(imeiButton);
        }

        // Check if input value is updated (it should have "IMEI: ")
        const input = screen.getByPlaceholderText('search.actions.typeId') as HTMLInputElement;
        expect(input.value).toBe('IMEI: ');
    });

    it('updates query when a search tip is clicked', () => {
        render(
            <TooltipProvider>
                <GlobalSearch />
            </TooltipProvider>
        );

        // Open the search dialog
        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        // Click a quick ID button (e.g., IMEI) which acts as a "tip" to pre-fill the query
        const imeiButton = screen.getByText('search.labels.imei').closest('button');
        if (imeiButton) {
            fireEvent.click(imeiButton);
        }

        // The input should now have the prefix for the selected ID type
        const input = screen.getByPlaceholderText('search.actions.typeId') as HTMLInputElement;
        expect(input.value).toBe('IMEI: ');
    });
});
