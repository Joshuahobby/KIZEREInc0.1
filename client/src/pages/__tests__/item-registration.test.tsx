import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemRegistrationPage from '../item-registration';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider defaultLanguage="en">
      <AuthProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

describe('ItemRegistrationPage', () => {
  it('renders the registration form', async () => {
    render(<ItemRegistrationPage />, { wrapper: AllProviders });

    // screen.debug(); // For debugging if it fails again

    // Check for some static text that doesn't depend on i18n if possible, 
    // or ensure i18n matches.
    expect(await screen.findByText(/Item Details/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    render(<ItemRegistrationPage />, { wrapper: AllProviders });

    // Wait for form to render - there might be multiple (desktop/mobile)
    const continueButtons = await screen.findAllByText(/Continue/i);

    // Since name is empty, all should be disabled
    continueButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });
});
